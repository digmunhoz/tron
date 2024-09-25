import json

from kubernetes import client
from kubernetes.client.rest import ApiException

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
                cpu_capacity = node.status.capacity['cpu']
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

            node_memory = node.status.allocatable.get('memory')
            if node_memory:
                total_memory += int(node_memory[:-2])
            node_allocated_memory = node.status.capacity.get('memory')
            if node_allocated_memory:
                total_allocated_memory += int(node_allocated_memory[:-2])

        available_memory = total_memory - total_allocated_memory
        return available_memory
