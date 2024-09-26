import json

from kubernetes import client
from kubernetes.client.rest import ApiException


K8S_API_MAPPING = {
    "Deployment": (
        client.AppsV1Api,
        "create_namespaced_deployment",
        "delete_namespaced_deployment",
    ),
    "Service": (
        client.CoreV1Api,
        "create_namespaced_service",
        "delete_namespaced_service",
    ),
    "ConfigMap": (
        client.CoreV1Api,
        "create_namespaced_config_map",
        "delete_namespaced_config_map",
    ),
    "Secret": (
        client.CoreV1Api,
        "create_namespaced_secret",
        "delete_namespaced_secret",
    ),
    "Ingress": (
        client.NetworkingV1Api,
        "create_namespaced_ingress",
        "delete_namespaced_ingress",
    ),
    "HorizontalPodAutoscaler": (
        client.AutoscalingV2Api,
        "create_namespaced_horizontal_pod_autoscaler",
        "delete_namespaced_horizontal_pod_autoscaler",
    ),
}


class K8sClient:
    def __init__(self, url: str, token: str, verify_ssl: bool = False):
        """
        Inicializa o cliente Kubernetes com os parâmetros fornecidos.
        """
        self.configuration = client.Configuration()
        self.configuration.host = url
        self.configuration.verify_ssl = verify_ssl
        self.configuration.api_key = {"authorization": f"Bearer {token}"}
        self.api_client = client.ApiClient(self.configuration)

    def validate_connection(self):
        """
        Valida a conexão ao Kubernetes tentando listar os namespaces.
        """
        try:
            v1 = client.CoreV1Api(self.api_client)
            v1.list_namespace()
            message = {"status": "ok", "message": "connected"}
            return (True, message)
        except ApiException as e:
            print(e.body)
            message = {"status": "error", "message": json.loads(e.body)}
            return (False, message)

    def get_namespaces(self):
        """
        Retorna uma lista de namespaces do cluster Kubernetes.
        """
        try:
            v1 = client.CoreV1Api(self.api_client)
            return v1.list_namespace().items
        except ApiException as e:
            print(f"Erro ao listar namespaces: {e}")
            return []

    def create_namespace(self, name: str):
        """
        Cria um novo namespace no cluster Kubernetes.
        """
        body = client.V1Namespace(metadata=client.V1ObjectMeta(name=name))
        try:
            v1 = client.CoreV1Api(self.api_client)
            return v1.create_namespace(body=body)
        except ApiException as e:
            print(f"Erro ao criar namespace: {e}")
            return None

    def get_available_cpu(self):
        """
        Retorna a quantidade total de CPU disponível no cluster Kubernetes.
        """
        try:
            v1 = client.CoreV1Api(self.api_client)
            nodes = v1.list_node().items

            total_cpu = 0
            for node in nodes:
                cpu_capacity = node.status.capacity["cpu"]
                total_cpu += int(cpu_capacity)

            return total_cpu
        except ApiException as e:
            print(f"Erro ao obter a quantidade de CPU disponível: {e}")
            return None

    def get_available_memory(self):
        """
        Obtém a quantidade de memória disponível no cluster Kubernetes.
        """
        v1 = client.CoreV1Api(self.api_client)
        nodes = v1.list_node().items

        total_memory = 0
        total_allocated_memory = 0

        for node in nodes:

            node_memory = node.status.allocatable.get("memory")
            if node_memory:
                total_memory += int(node_memory[:-2])
            node_allocated_memory = node.status.capacity.get("memory")
            if node_allocated_memory:
                total_allocated_memory += int(node_allocated_memory[:-2])

        available_memory = total_memory - total_allocated_memory
        return available_memory

    def ensure_namespace_exists(self, namespace_name):
        """Cria o namespace se ele não existir."""
        v1 = client.CoreV1Api(self.api_client)
        try:
            v1.read_namespace(name=namespace_name)
        except ApiException as e:
            if e.status == 404:
                namespace_metadata = client.V1ObjectMeta(name=namespace_name)
                namespace_body = client.V1Namespace(metadata=namespace_metadata)
                v1.create_namespace(body=namespace_body)
            else:
                raise e

    def apply_or_delete_yaml_to_k8s(self, yaml_documents, operation="create"):

        for document in yaml_documents:

            kind = document.get("kind")
            api_version = document.get("apiVersion")
            name = document["metadata"].get("name")
            namespace = document["metadata"].get("namespace")

            if not namespace:
                raise ValueError("Namespace not specified in the YAML file")

            try:
                self.ensure_namespace_exists(namespace)
            except Exception as e:
                raise e

            if not kind or not api_version:
                raise ValueError("YAML must include 'kind' and 'apiVersion' fields.")

            api_class, create_api_method, delete_api_method = K8S_API_MAPPING.get(kind)

            if not api_class:
                raise ValueError(f"No API found for resource kind: {kind}")

            api_instance = api_class(self.api_client)

            if operation == "create":
                getattr(api_instance, create_api_method)(
                    namespace=namespace, body=document
                )
            elif operation == "delete":
                getattr(api_instance, delete_api_method)(
                    name=name, namespace=namespace, body=client.V1DeleteOptions()
                )

        return f"Documents applied successfully"
