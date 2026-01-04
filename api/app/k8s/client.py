import json

from kubernetes import client
from kubernetes.client.rest import ApiException
from kubernetes.stream import stream
from fastapi import HTTPException


K8S_API_MAPPING = {
    "Deployment": (
        client.AppsV1Api,
        "create_namespaced_deployment",
        "delete_namespaced_deployment",
        "replace_namespaced_deployment",
    ),
    "Service": (
        client.CoreV1Api,
        "create_namespaced_service",
        "delete_namespaced_service",
        "replace_namespaced_service",
    ),
    "ConfigMap": (
        client.CoreV1Api,
        "create_namespaced_config_map",
        "delete_namespaced_config_map",
        "replace_namespaced_config_map",
    ),
    "Secret": (
        client.CoreV1Api,
        "create_namespaced_secret",
        "delete_namespaced_secret",
        "replace_namespaced_secret",
    ),
    "Ingress": (
        client.NetworkingV1Api,
        "create_namespaced_ingress",
        "delete_namespaced_ingress",
        "replace_namespaced_ingress",
    ),
    "HorizontalPodAutoscaler": (
        client.AutoscalingV2Api,
        "create_namespaced_horizontal_pod_autoscaler",
        "delete_namespaced_horizontal_pod_autoscaler",
        "replace_namespaced_horizontal_pod_autoscaler",
    ),
    "CronJob": (
        client.BatchV1Api,
        "create_namespaced_cron_job",
        "delete_namespaced_cron_job",
        "replace_namespaced_cron_job",
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
            try:
                error_body = json.loads(e.body) if e.body else {}
                error_message = error_body.get("message", str(e.body)) if isinstance(error_body, dict) else str(e.body)
            except (json.JSONDecodeError, AttributeError):
                error_message = str(e.body) if e.body else str(e)
            message = {"status": "error", "message": {"code": str(e.status), "message": error_message}}
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

    def delete_namespace(self, namespace_name):
        """
        Deleta um namespace do Kubernetes.
        Quando um namespace é deletado, todos os recursos dentro dele são automaticamente deletados.
        """
        v1 = client.CoreV1Api(self.api_client)
        try:
            v1.delete_namespace(name=namespace_name, body=client.V1DeleteOptions())
        except ApiException as e:
            if e.status == 404:
                # Namespace já não existe, não é um erro
                return
            else:
                raise e

    def delete_pod(self, namespace: str, pod_name: str):
        """
        Deleta um pod específico do Kubernetes.

        Args:
            namespace: Nome do namespace
            pod_name: Nome do pod

        Returns:
            True se deletado com sucesso, False caso contrário
        """
        try:
            v1 = client.CoreV1Api(self.api_client)
            v1.delete_namespaced_pod(name=pod_name, namespace=namespace, body=client.V1DeleteOptions())
            return True
        except ApiException as e:
            if e.status == 404:
                # Pod já não existe, não é um erro
                return True
            else:
                print(f"Erro ao deletar pod {pod_name}: {e}")
                raise e

    def get_pod_logs(self, namespace: str, pod_name: str, container_name: str = None, tail_lines: int = 100, follow: bool = False):
        """
        Obtém os logs de um pod do Kubernetes.

        Args:
            namespace: Nome do namespace
            pod_name: Nome do pod
            container_name: Nome do container (opcional, se o pod tiver múltiplos containers)
            tail_lines: Número de linhas finais a retornar (padrão: 100)
            follow: Se True, segue os logs em tempo real (padrão: False)

        Returns:
            String com os logs do pod
        """
        try:
            v1 = client.CoreV1Api(self.api_client)
            logs = v1.read_namespaced_pod_log(
                name=pod_name,
                namespace=namespace,
                container=container_name,
                tail_lines=tail_lines,
                follow=follow,
                _preload_content=False
            )
            return logs.read().decode('utf-8')
        except ApiException as e:
            if e.status == 404:
                raise HTTPException(status_code=404, detail=f"Pod {pod_name} not found")
            else:
                print(f"Erro ao obter logs do pod {pod_name}: {e}")
                raise HTTPException(status_code=e.status, detail=f"Failed to get logs: {str(e)}")

    def exec_pod_command(self, namespace: str, pod_name: str, command: list[str], container_name: str = None):
        """
        Executa um comando em um pod do Kubernetes.

        Args:
            namespace: Nome do namespace
            pod_name: Nome do pod
            command: Lista com o comando e argumentos (ex: ['ls', '-la'])
            container_name: Nome do container (opcional, se o pod tiver múltiplos containers)

        Returns:
            Tupla (stdout, stderr, return_code)
        """
        try:
            v1 = client.CoreV1Api(self.api_client)

            # Executar comando usando stream
            exec_command = stream(
                v1.connect_get_namespaced_pod_exec,
                pod_name,
                namespace,
                command=command,
                container=container_name,
                stderr=True,
                stdin=False,
                stdout=True,
                tty=False,
                _preload_content=False
            )

            stdout = ""
            stderr = ""

            while exec_command.is_open():
                exec_command.update(timeout=1)
                if exec_command.peek_stdout():
                    stdout += exec_command.read_stdout()
                if exec_command.peek_stderr():
                    stderr += exec_command.read_stderr()

            exec_command.close()

            return {
                "stdout": stdout,
                "stderr": stderr,
                "return_code": 0 if not stderr else 1
            }
        except ApiException as e:
            if e.status == 404:
                raise HTTPException(status_code=404, detail=f"Pod {pod_name} not found")
            else:
                print(f"Erro ao executar comando no pod {pod_name}: {e}")
                raise HTTPException(status_code=e.status, detail=f"Failed to execute command: {str(e)}")
        except Exception as e:
            print(f"Erro ao executar comando no pod {pod_name}: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to execute command: {str(e)}")

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

            api_mapping = K8S_API_MAPPING.get(kind)
            if not api_mapping:
                raise ValueError(f"No API found for resource kind: {kind}")

            api_class, create_method, delete_method, replace_method = api_mapping

            api_instance = api_class(self.api_client)

            if operation == "create":
                getattr(api_instance, create_method)(
                    namespace=namespace, body=document
                )
            elif operation == "update":
                getattr(api_instance, replace_method)(
                    name=name, namespace=namespace, body=document
                )
            elif operation == "upsert":
                # Tenta atualizar primeiro, se não existir, cria
                try:
                    # Para Deployments, preservar o número de réplicas atual se não especificado
                    if kind == "Deployment" and "spec" in document:
                        try:
                            read_method = getattr(api_instance, "read_namespaced_deployment", None)
                            if read_method:
                                existing_deployment = read_method(name=name, namespace=namespace)

                                # Se o novo documento não especifica replicas, preservar o valor atual
                                # Isso evita que o Kubernetes resete para o valor padrão (1) ou conflite com HPA
                                if "replicas" not in document.get("spec", {}):
                                    if hasattr(existing_deployment.spec, "replicas") and existing_deployment.spec.replicas is not None:
                                        document["spec"]["replicas"] = existing_deployment.spec.replicas

                                # Preservar também resourceVersion e outras metadatas necessárias para evitar conflitos
                                # O resourceVersion é necessário para o replace funcionar corretamente
                                if hasattr(existing_deployment.metadata, "resource_version") and existing_deployment.metadata.resource_version:
                                    if "metadata" not in document:
                                        document["metadata"] = {}
                                    document["metadata"]["resourceVersion"] = existing_deployment.metadata.resource_version

                                    # Preservar também generation se existir
                                    if hasattr(existing_deployment.metadata, "generation") and existing_deployment.metadata.generation:
                                        document["metadata"]["generation"] = existing_deployment.metadata.generation
                        except ApiException as read_e:
                            # Se não conseguir ler (404 ou outro erro), continua normalmente
                            # Isso significa que o deployment não existe ainda, então criaremos
                            if read_e.status != 404:
                                # Se for outro erro, loga mas continua
                                print(f"Warning: Could not read existing deployment to preserve replicas: {read_e}")

                    getattr(api_instance, replace_method)(
                        name=name, namespace=namespace, body=document
                    )
                except ApiException as e:
                    if e.status == 404:
                        # Recurso não existe, criar
                        getattr(api_instance, create_method)(
                            namespace=namespace, body=document
                        )
                    else:
                        raise e
            elif operation == "delete":
                try:
                    getattr(api_instance, delete_method)(
                        name=name, namespace=namespace, body=client.V1DeleteOptions()
                    )
                except ApiException as e:
                    if e.status == 404:
                        # Recurso já não existe no Kubernetes, isso é aceitável
                        # O objetivo é deletar e se já não existe, consideramos sucesso
                        pass
                    else:
                        raise e

        return f"Documents applied successfully"

    def list_pods(self, namespace: str, label_selector: str = None):
        """
        Lista pods de um namespace, opcionalmente filtrados por label selector.

        Args:
            namespace: Nome do namespace
            label_selector: Seletor de labels (ex: "app=myapp")

        Returns:
            Lista de pods com informações formatadas
        """
        try:
            v1 = client.CoreV1Api(self.api_client)

            if label_selector:
                pods = v1.list_namespaced_pod(namespace=namespace, label_selector=label_selector).items
            else:
                pods = v1.list_namespaced_pod(namespace=namespace).items

            # Formatar dados dos pods
            formatted_pods = []
            for pod in pods:
                # Calcular CPU e Memory dos containers
                cpu_requests = 0
                cpu_limits = 0
                memory_requests = 0
                memory_limits = 0

                for container in pod.spec.containers:
                    if container.resources:
                        # Acessar requests (é um dict no Kubernetes Python client)
                        if container.resources.requests:
                            requests = container.resources.requests
                            if 'cpu' in requests:
                                cpu_str = str(requests['cpu'])
                                cpu_requests += self._parse_cpu(cpu_str)
                            if 'memory' in requests:
                                mem_str = str(requests['memory'])
                                memory_requests += self._parse_memory(mem_str)

                        # Acessar limits (é um dict no Kubernetes Python client)
                        if container.resources.limits:
                            limits = container.resources.limits
                            if 'cpu' in limits:
                                cpu_str = str(limits['cpu'])
                                cpu_limits += self._parse_cpu(cpu_str)
                            if 'memory' in limits:
                                mem_str = str(limits['memory'])
                                memory_limits += self._parse_memory(mem_str)

                # Status do pod
                status = "Unknown"
                if pod.status.phase:
                    status = pod.status.phase

                # Restarts
                restarts = 0
                if pod.status.container_statuses:
                    for container_status in pod.status.container_statuses:
                        if container_status.restart_count:
                            restarts += container_status.restart_count

                # Age (tempo desde a criação)
                age_seconds = 0
                if pod.metadata.creation_timestamp:
                    from datetime import datetime, timezone
                    now = datetime.now(timezone.utc)
                    age_seconds = int((now - pod.metadata.creation_timestamp).total_seconds())

                # Host IP (IP do nó onde o pod está rodando)
                host_ip = pod.status.host_ip if pod.status.host_ip else None

                formatted_pods.append({
                    "name": pod.metadata.name,
                    "status": status,
                    "restarts": restarts,
                    "cpu_requests": cpu_requests,
                    "cpu_limits": cpu_limits,
                    "memory_requests": memory_requests,
                    "memory_limits": memory_limits,
                    "age_seconds": age_seconds,
                    "host_ip": host_ip,
                })

            return formatted_pods
        except ApiException as e:
            print(f"Erro ao listar pods: {e}")
            return []

    def list_jobs(self, namespace: str, label_selector: str = None):
        """
        Lista Jobs de um namespace, opcionalmente filtrados por label selector.
        Usado para listar Jobs criados por CronJobs.

        Args:
            namespace: Nome do namespace
            label_selector: Seletor de labels (ex: "app=myapp")

        Returns:
            Lista de jobs com informações formatadas
        """
        try:
            batch_v1 = client.BatchV1Api(self.api_client)

            if label_selector:
                jobs = batch_v1.list_namespaced_job(namespace=namespace, label_selector=label_selector).items
            else:
                jobs = batch_v1.list_namespaced_job(namespace=namespace).items

            # Formatar dados dos jobs
            formatted_jobs = []
            for job in jobs:
                # Status do job
                status = "Unknown"
                if job.status.succeeded:
                    status = "Succeeded"
                elif job.status.failed:
                    status = "Failed"
                elif job.status.active:
                    status = "Active"
                elif job.status.conditions:
                    # Verificar condições para status mais específico
                    for condition in job.status.conditions:
                        if condition.type == "Complete" and condition.status == "True":
                            status = "Succeeded"
                            break
                        elif condition.type == "Failed" and condition.status == "True":
                            status = "Failed"
                            break

                # Contagem de sucessos e falhas
                succeeded = job.status.succeeded if job.status.succeeded else 0
                failed = job.status.failed if job.status.failed else 0
                active = job.status.active if job.status.active else 0

                # Start time
                start_time = None
                if job.status.start_time:
                    start_time = job.status.start_time.isoformat()

                # Completion time
                completion_time = None
                if job.status.completion_time:
                    completion_time = job.status.completion_time.isoformat()

                # Age (tempo desde a criação)
                age_seconds = 0
                if job.metadata.creation_timestamp:
                    from datetime import datetime, timezone
                    now = datetime.now(timezone.utc)
                    age_seconds = int((now - job.metadata.creation_timestamp).total_seconds())

                # Duração (se completado)
                duration_seconds = None
                if start_time and completion_time:
                    from datetime import datetime
                    start = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
                    completion = datetime.fromisoformat(completion_time.replace('Z', '+00:00'))
                    duration_seconds = int((completion - start).total_seconds())

                formatted_jobs.append({
                    "name": job.metadata.name,
                    "status": status,
                    "succeeded": succeeded,
                    "failed": failed,
                    "active": active,
                    "start_time": start_time,
                    "completion_time": completion_time,
                    "age_seconds": age_seconds,
                    "duration_seconds": duration_seconds,
                })

            # Ordenar por criação (mais recente primeiro)
            formatted_jobs.sort(key=lambda x: x["age_seconds"], reverse=False)

            return formatted_jobs
        except ApiException as e:
            print(f"Erro ao listar jobs: {e}")
            return []

    def _parse_cpu(self, cpu_str: str) -> float:
        """Converte string de CPU (ex: '500m', '1', '0.5') para float."""
        if not cpu_str:
            return 0.0
        cpu_str = cpu_str.strip()
        if cpu_str.endswith('m'):
            return float(cpu_str[:-1]) / 1000
        return float(cpu_str)

    def _parse_memory(self, memory_str: str) -> int:
        """Converte string de memória (ex: '512Mi', '1Gi', '1000M') para MB."""
        if not memory_str:
            return 0
        memory_str = memory_str.strip()

        # Remover sufixos e converter
        if memory_str.endswith('Ki'):
            return int(memory_str[:-2]) // 1024
        elif memory_str.endswith('Mi'):
            return int(memory_str[:-2])
        elif memory_str.endswith('Gi'):
            return int(memory_str[:-2]) * 1024
        elif memory_str.endswith('Ti'):
            return int(memory_str[:-2]) * 1024 * 1024
        elif memory_str.endswith('K'):
            return int(memory_str[:-1]) // 1000
        elif memory_str.endswith('M'):
            return int(memory_str[:-1])
        elif memory_str.endswith('G'):
            return int(memory_str[:-1]) * 1000
        elif memory_str.endswith('T'):
            return int(memory_str[:-1]) * 1000 * 1000
        else:
            # Assumir bytes
            return int(memory_str) // (1024 * 1024)
