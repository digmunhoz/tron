from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload
from uuid import uuid4
from uuid import UUID

import app.models.application_components as ApplicationComponentModel
import app.models.instance as InstanceModel
import app.models.cluster_instance as ClusterInstanceModel
import app.models.settings as SettingsModel
import app.schemas.webapp as WebappSchema
from app.helpers.serializers import serialize_application_component, serialize_settings
from app.k8s.client import K8sClient
from app.services.kubernetes.application_component_manager import (
    KubernetesApplicationComponentManager,
)
from app.services.cluster_selection import ClusterSelectionService


class WebappService:
    @staticmethod
    def upsert_webapp(
        db: Session,
        webapp: WebappSchema.WebappCreate | WebappSchema.WebappUpdate,
        uuid: UUID = None,
    ):
        if uuid:
            # Update existing webapp
            db_webapp = (
                db.query(ApplicationComponentModel.ApplicationComponent)
                .filter(ApplicationComponentModel.ApplicationComponent.uuid == uuid)
                .first()
            )

            if db_webapp is None:
                raise HTTPException(status_code=404, detail="Webapp not found")

            if db_webapp.type != ApplicationComponentModel.WebappType.webapp:
                raise HTTPException(
                    status_code=400,
                    detail="Component is not a webapp"
                )

            # Cast to WebappUpdate for type checking
            webapp_update = WebappSchema.WebappUpdate.model_validate(webapp)

            # Verificar se houve mudança no enabled
            enabled_changed = webapp_update.enabled is not None and webapp_update.enabled != db_webapp.enabled
            was_enabled = db_webapp.enabled
            will_be_enabled = webapp_update.enabled if webapp_update.enabled is not None else db_webapp.enabled

            if webapp_update.is_public is not None:
                db_webapp.is_public = webapp_update.is_public
            if webapp_update.url is not None:
                db_webapp.url = webapp_update.url
            if webapp_update.enabled is not None:
                db_webapp.enabled = webapp_update.enabled
            if webapp_update.settings is not None:
                db_webapp.settings = webapp_update.settings.model_dump()

            # Validate that webapp type requires url (check final state after all updates)
            final_url = db_webapp.url
            if not final_url:
                raise HTTPException(
                    status_code=400,
                    detail="URL is required for webapp components"
                )

            # Buscar o cluster_instance relacionado ao componente
            cluster_instance = (
                db.query(ClusterInstanceModel.ClusterInstance)
                .filter(ClusterInstanceModel.ClusterInstance.application_component_id == db_webapp.id)
                .first()
            )

            # Se não existir, criar automaticamente usando o cluster de menor carga
            if cluster_instance is None:
                instance = db_webapp.instance
                cluster = ClusterSelectionService.get_cluster_with_least_load_or_raise(
                    db, instance.environment_id, instance.environment.name
                )

                # Criar novo cluster_instance
                cluster_instance = ClusterInstanceModel.ClusterInstance(
                    uuid=uuid4(),
                    cluster_id=cluster.id,
                    application_component_id=db_webapp.id,
                )
                db.add(cluster_instance)
            else:
                cluster = cluster_instance.cluster

            # Buscar settings do environment
            instance = db_webapp.instance
            settings = (
                db.query(SettingsModel.Settings)
                .filter(SettingsModel.Settings.environment_id == instance.environment_id)
                .all()
            )
            settings_serialized = serialize_settings(settings)

            # Recarregar o componente com relacionamentos para serialização usando joinedload
            db_webapp = (
                db.query(ApplicationComponentModel.ApplicationComponent)
                .options(
                    joinedload(ApplicationComponentModel.ApplicationComponent.instance)
                    .joinedload(InstanceModel.Instance.application),
                    joinedload(ApplicationComponentModel.ApplicationComponent.instance)
                    .joinedload(InstanceModel.Instance.environment)
                )
                .filter(ApplicationComponentModel.ApplicationComponent.id == db_webapp.id)
                .first()
            )

            # Serializar o componente para os templates
            application_component_serialized = serialize_application_component(db_webapp)
            component_type = db_webapp.type.value if hasattr(db_webapp.type, 'value') else str(db_webapp.type)

            # Se o componente foi desativado (enabled mudou de True para False), remover do Kubernetes
            if enabled_changed and was_enabled and not will_be_enabled:
                try:
                    k8s_client = K8sClient(url=cluster.api_address, token=cluster.token)
                    application_name = application_component_serialized.get("application_name")
                    if application_name:
                        k8s_client.ensure_namespace_exists(application_name)

                    kubernetes_payload = KubernetesApplicationComponentManager.instance_management(
                        application_component_serialized, component_type, settings_serialized, db=db
                    )
                    k8s_client.apply_or_delete_yaml_to_k8s(
                        kubernetes_payload, operation="delete"
                    )

                    db.commit()
                    db.refresh(db_webapp)
                    if cluster_instance:
                        db.refresh(cluster_instance)
                except Exception as e:
                    # Log do erro mas continua com a atualização do banco
                    print(f"Error removing component '{db_webapp.name}' from Kubernetes: {e}")
                    db.commit()
                    db.refresh(db_webapp)
                    if cluster_instance:
                        db.refresh(cluster_instance)

            # Se o componente foi reativado (enabled mudou de False para True), reaplicar no Kubernetes
            elif enabled_changed and not was_enabled and will_be_enabled:
                try:
                    k8s_client = K8sClient(url=cluster.api_address, token=cluster.token)
                    application_name = application_component_serialized.get("application_name")
                    if application_name:
                        k8s_client.ensure_namespace_exists(application_name)

                    kubernetes_payload = KubernetesApplicationComponentManager.instance_management(
                        application_component_serialized, component_type, settings_serialized, db=db
                    )
                    k8s_client.apply_or_delete_yaml_to_k8s(
                        kubernetes_payload, operation="upsert"
                    )

                    db.commit()
                    db.refresh(db_webapp)
                    if cluster_instance:
                        db.refresh(cluster_instance)
                except Exception as e:
                    db.rollback()
                    raise HTTPException(
                        status_code=400,
                        detail=f"Failed to reapply component to Kubernetes cluster '{cluster.name}': {str(e)}"
                    )

            # Se não houve mudança no enabled ou se está habilitado, aplicar normalmente
            elif not enabled_changed or db_webapp.enabled:
                try:
                    k8s_client = K8sClient(url=cluster.api_address, token=cluster.token)

                    # Verificar e criar namespace com o nome da aplicação se não existir
                    application_name = application_component_serialized.get("application_name")
                    if application_name:
                        k8s_client.ensure_namespace_exists(application_name)

                    kubernetes_payload = KubernetesApplicationComponentManager.instance_management(
                        application_component_serialized, component_type, settings_serialized, db=db
                    )
                    k8s_client.apply_or_delete_yaml_to_k8s(
                        kubernetes_payload, operation="upsert"
                    )

                    db.commit()
                    db.refresh(db_webapp)
                    if cluster_instance:
                        db.refresh(cluster_instance)
                except Exception as e:
                    db.rollback()
                    raise HTTPException(
                        status_code=400,
                        detail=f"Failed to update component in Kubernetes cluster '{cluster.name}': {str(e)}"
                    )

        else:
            # Create new webapp
            # Cast to WebappCreate for type checking
            webapp_create = WebappSchema.WebappCreate.model_validate(webapp)

            # Validate that webapp requires url
            if not webapp_create.url:
                raise HTTPException(
                    status_code=400,
                    detail="URL is required for webapp components"
                )

            # Get instance by uuid
            instance = (
                db.query(InstanceModel.Instance)
                .filter(InstanceModel.Instance.uuid == webapp_create.instance_uuid)
                .first()
            )
            if instance is None:
                raise HTTPException(status_code=404, detail="Instance not found")

            db_webapp = ApplicationComponentModel.ApplicationComponent(
                uuid=uuid4(),
                instance_id=instance.id,
                name=webapp_create.name,
                type=ApplicationComponentModel.WebappType.webapp,
                settings=webapp_create.settings.model_dump(),
                is_public=webapp_create.is_public,
                url=webapp_create.url,
                enabled=webapp_create.enabled,
            )
            db.add(db_webapp)

            try:
                db.commit()
                db.refresh(db_webapp)
            except Exception as e:
                db.rollback()
                message = {"status": "error", "message": f"{e._sql_message}"}
                raise HTTPException(status_code=400, detail=message)

            # Criar cluster_instance automaticamente usando o cluster de menor carga
            cluster = ClusterSelectionService.get_cluster_with_least_load_or_raise(
                db, instance.environment_id, instance.environment.name
            )

            # Verificar se já existe um cluster_instance para este componente (não deveria acontecer em criação)
            existing_cluster_instance = (
                db.query(ClusterInstanceModel.ClusterInstance)
                .filter(ClusterInstanceModel.ClusterInstance.application_component_id == db_webapp.id)
                .first()
            )

            if existing_cluster_instance:
                # Se já existe, usar o cluster existente (caso de race condition ou erro anterior)
                cluster_instance = existing_cluster_instance
                cluster = cluster_instance.cluster
            else:
                # Criar novo cluster_instance
                cluster_instance = ClusterInstanceModel.ClusterInstance(
                    uuid=uuid4(),
                    cluster_id=cluster.id,
                    application_component_id=db_webapp.id,
                )
                db.add(cluster_instance)

            # Buscar settings do environment
            settings = (
                db.query(SettingsModel.Settings)
                .filter(SettingsModel.Settings.environment_id == instance.environment_id)
                .all()
            )
            settings_serialized = serialize_settings(settings)

            # Recarregar o componente com relacionamentos para serialização usando joinedload
            db_webapp = (
                db.query(ApplicationComponentModel.ApplicationComponent)
                .options(
                    joinedload(ApplicationComponentModel.ApplicationComponent.instance)
                    .joinedload(InstanceModel.Instance.application),
                    joinedload(ApplicationComponentModel.ApplicationComponent.instance)
                    .joinedload(InstanceModel.Instance.environment)
                )
                .filter(ApplicationComponentModel.ApplicationComponent.id == db_webapp.id)
                .first()
            )

            # Serializar o componente para os templates
            application_component_serialized = serialize_application_component(db_webapp)
            component_type = db_webapp.type.value if hasattr(db_webapp.type, 'value') else str(db_webapp.type)

            # Aplicar recursos no Kubernetes
            try:
                k8s_client = K8sClient(url=cluster.api_address, token=cluster.token)

                # Verificar e criar namespace com o nome da aplicação se não existir
                application_name = application_component_serialized.get("application_name")
                if application_name:
                    k8s_client.ensure_namespace_exists(application_name)

                kubernetes_payload = KubernetesApplicationComponentManager.instance_management(
                    application_component_serialized, component_type, settings_serialized, db=db
                )
                k8s_client.apply_or_delete_yaml_to_k8s(
                    kubernetes_payload, operation="create"
                )

                # Commit do cluster_instance e do componente
                db.commit()
                db.refresh(cluster_instance)
                db.refresh(db_webapp)
            except Exception as e:
                db.rollback()
                # Se falhar ao aplicar no Kubernetes, removemos o componente criado
                # para manter a consistência
                db.delete(db_webapp)
                if not existing_cluster_instance:
                    # Se criamos um cluster_instance, removemos também
                    if cluster_instance in db:
                        db.delete(cluster_instance)
                db.commit()
                raise HTTPException(
                    status_code=400,
                    detail=f"Failed to deploy component to Kubernetes cluster '{cluster.name}': {str(e)}"
                )

        return db_webapp

    def get_webapp(
        db: Session, uuid: UUID
    ) -> WebappSchema.Webapp:
        db_webapp = (
            db.query(ApplicationComponentModel.ApplicationComponent)
            .filter(ApplicationComponentModel.ApplicationComponent.uuid == uuid)
            .first()
        )
        if db_webapp is None:
            raise HTTPException(status_code=404, detail="Webapp not found")
        if db_webapp.type != ApplicationComponentModel.WebappType.webapp:
            raise HTTPException(
                status_code=400,
                detail="Component is not a webapp"
            )
        return WebappSchema.Webapp.model_validate(db_webapp)

    def get_webapps(
        db: Session, skip: int = 0, limit: int = 100
    ) -> list[WebappSchema.Webapp]:
        db_webapps = (
            db.query(ApplicationComponentModel.ApplicationComponent)
            .filter(ApplicationComponentModel.ApplicationComponent.type == ApplicationComponentModel.WebappType.webapp)
            .offset(skip)
            .limit(limit)
            .all()
        )
        return [WebappSchema.Webapp.model_validate(webapp) for webapp in db_webapps]

    @staticmethod
    def delete_webapp(db: Session, uuid: UUID):
        # Buscar o componente com relacionamentos
        db_webapp = (
            db.query(ApplicationComponentModel.ApplicationComponent)
            .options(
                joinedload(ApplicationComponentModel.ApplicationComponent.instance)
                .joinedload(InstanceModel.Instance.application),
                joinedload(ApplicationComponentModel.ApplicationComponent.instance)
                .joinedload(InstanceModel.Instance.environment),
                joinedload(ApplicationComponentModel.ApplicationComponent.instances)
            )
            .filter(ApplicationComponentModel.ApplicationComponent.uuid == uuid)
            .first()
        )

        if db_webapp is None:
            raise HTTPException(status_code=404, detail="Webapp not found")
        if db_webapp.type != ApplicationComponentModel.WebappType.webapp:
            raise HTTPException(
                status_code=400,
                detail="Component is not a webapp"
            )

        # Buscar o cluster_instance relacionado
        cluster_instance = (
            db.query(ClusterInstanceModel.ClusterInstance)
            .filter(ClusterInstanceModel.ClusterInstance.application_component_id == db_webapp.id)
            .first()
        )

        # Se existir cluster_instance, deletar os recursos no Kubernetes
        if cluster_instance:
            try:
                cluster = cluster_instance.cluster

                # Buscar settings do environment
                instance = db_webapp.instance
                settings = (
                    db.query(SettingsModel.Settings)
                    .filter(SettingsModel.Settings.environment_id == instance.environment_id)
                    .all()
                )
                settings_serialized = serialize_settings(settings)

                # Serializar o componente para os templates
                application_component_serialized = serialize_application_component(db_webapp)
                component_type = db_webapp.type.value if hasattr(db_webapp.type, 'value') else str(db_webapp.type)

                # Gerar payload do Kubernetes
                k8s_client = K8sClient(url=cluster.api_address, token=cluster.token)
                kubernetes_payload = KubernetesApplicationComponentManager.instance_management(
                    application_component_serialized, component_type, settings_serialized, db=db
                )

                # Deletar recursos no Kubernetes
                k8s_client.apply_or_delete_yaml_to_k8s(
                    kubernetes_payload, operation="delete"
                )
            except Exception as e:
                # Se falhar ao deletar no Kubernetes, ainda deletamos o componente e cluster_instance do banco
                # mas logamos o erro
                print(f"Error deleting resources from Kubernetes: {e}")

        # Deletar o cluster_instance e o componente do banco
        try:
            if cluster_instance:
                db.delete(cluster_instance)
            db.delete(db_webapp)
            db.commit()
        except Exception as e:
            db.rollback()
            message = {"status": "error", "message": f"{e._sql_message}"}
            raise HTTPException(status_code=400, detail=message)

        return {"detail": "Webapp deleted successfully"}

    @staticmethod
    def get_webapp_pods(db: Session, uuid: UUID):
        """
        Busca os pods do Kubernetes relacionados a um webapp.
        """
        # Buscar o componente com relacionamentos
        db_webapp = (
            db.query(ApplicationComponentModel.ApplicationComponent)
            .options(
                joinedload(ApplicationComponentModel.ApplicationComponent.instance)
                .joinedload(InstanceModel.Instance.application),
                joinedload(ApplicationComponentModel.ApplicationComponent.instance)
                .joinedload(InstanceModel.Instance.environment),
                joinedload(ApplicationComponentModel.ApplicationComponent.instances)
                .joinedload(ClusterInstanceModel.ClusterInstance.cluster)
            )
            .filter(ApplicationComponentModel.ApplicationComponent.uuid == uuid)
            .first()
        )

        if db_webapp is None:
            raise HTTPException(status_code=404, detail="Webapp not found")
        if db_webapp.type != ApplicationComponentModel.WebappType.webapp:
            raise HTTPException(
                status_code=400,
                detail="Component is not a webapp"
            )

        # Buscar cluster_instance relacionado
        cluster_instance = (
            db.query(ClusterInstanceModel.ClusterInstance)
            .filter(ClusterInstanceModel.ClusterInstance.application_component_id == db_webapp.id)
            .first()
        )

        if not cluster_instance:
            raise HTTPException(
                status_code=404,
                detail="Webapp is not deployed to any cluster"
            )

        cluster = cluster_instance.cluster
        application_name = db_webapp.instance.application.name
        component_name = db_webapp.name

        # Criar cliente Kubernetes
        k8s_client = K8sClient(url=cluster.api_address, token=cluster.token)

        # Listar pods usando label selector baseado no nome do componente
        # O label selector pode variar dependendo de como os pods são rotulados
        # Vamos tentar alguns padrões comuns
        label_selector = f"app={component_name}"
        pods = k8s_client.list_pods(namespace=application_name, label_selector=label_selector)

        # Se não encontrar com esse seletor, tentar sem seletor e filtrar depois
        if not pods:
            all_pods = k8s_client.list_pods(namespace=application_name)
            pods = [pod for pod in all_pods if component_name in pod['name']]

        return pods

    @staticmethod
    def delete_webapp_pod(db: Session, uuid: UUID, pod_name: str):
        """
        Deleta um pod específico do Kubernetes relacionado a um webapp.
        """
        # Buscar o componente com relacionamentos
        db_webapp = (
            db.query(ApplicationComponentModel.ApplicationComponent)
            .options(
                joinedload(ApplicationComponentModel.ApplicationComponent.instance)
                .joinedload(InstanceModel.Instance.application),
                joinedload(ApplicationComponentModel.ApplicationComponent.instances)
                .joinedload(ClusterInstanceModel.ClusterInstance.cluster)
            )
            .filter(ApplicationComponentModel.ApplicationComponent.uuid == uuid)
            .first()
        )

        if db_webapp is None:
            raise HTTPException(status_code=404, detail="Webapp not found")
        if db_webapp.type != ApplicationComponentModel.WebappType.webapp:
            raise HTTPException(
                status_code=400,
                detail="Component is not a webapp"
            )

        # Buscar cluster_instance relacionado
        cluster_instance = (
            db.query(ClusterInstanceModel.ClusterInstance)
            .filter(ClusterInstanceModel.ClusterInstance.application_component_id == db_webapp.id)
            .first()
        )

        if not cluster_instance:
            raise HTTPException(
                status_code=404,
                detail="Webapp is not deployed to any cluster"
            )

        cluster = cluster_instance.cluster
        application_name = db_webapp.instance.application.name

        # Criar cliente Kubernetes
        k8s_client = K8sClient(url=cluster.api_address, token=cluster.token)

        # Deletar o pod
        try:
            k8s_client.delete_pod(namespace=application_name, pod_name=pod_name)
            return {"detail": f"Pod {pod_name} deleted successfully"}
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to delete pod {pod_name}: {str(e)}"
            )

    @staticmethod
    def get_webapp_pod_logs(db: Session, uuid: UUID, pod_name: str, container_name: str = None, tail_lines: int = 100):
        """
        Obtém os logs de um pod específico do Kubernetes relacionado a um webapp.
        """
        # Buscar o componente com relacionamentos
        db_webapp = (
            db.query(ApplicationComponentModel.ApplicationComponent)
            .options(
                joinedload(ApplicationComponentModel.ApplicationComponent.instance)
                .joinedload(InstanceModel.Instance.application),
                joinedload(ApplicationComponentModel.ApplicationComponent.instances)
                .joinedload(ClusterInstanceModel.ClusterInstance.cluster)
            )
            .filter(ApplicationComponentModel.ApplicationComponent.uuid == uuid)
            .first()
        )

        if db_webapp is None:
            raise HTTPException(status_code=404, detail="Webapp not found")
        if db_webapp.type != ApplicationComponentModel.WebappType.webapp:
            raise HTTPException(
                status_code=400,
                detail="Component is not a webapp"
            )

        # Buscar cluster_instance relacionado
        cluster_instance = (
            db.query(ClusterInstanceModel.ClusterInstance)
            .filter(ClusterInstanceModel.ClusterInstance.application_component_id == db_webapp.id)
            .first()
        )

        if not cluster_instance:
            raise HTTPException(
                status_code=404,
                detail="Webapp is not deployed to any cluster"
            )

        cluster = cluster_instance.cluster
        application_name = db_webapp.instance.application.name

        # Criar cliente Kubernetes
        k8s_client = K8sClient(url=cluster.api_address, token=cluster.token)

        # Obter logs do pod
        try:
            logs = k8s_client.get_pod_logs(
                namespace=application_name,
                pod_name=pod_name,
                container_name=container_name,
                tail_lines=tail_lines
            )
            return {"logs": logs, "pod_name": pod_name, "container_name": container_name}
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to get logs for pod {pod_name}: {str(e)}"
            )

    @staticmethod
    def exec_webapp_pod_command(db: Session, uuid: UUID, pod_name: str, command: list[str], container_name: str = None):
        """
        Executa um comando em um pod específico do Kubernetes relacionado a um webapp.
        """
        # Buscar o componente com relacionamentos
        db_webapp = (
            db.query(ApplicationComponentModel.ApplicationComponent)
            .options(
                joinedload(ApplicationComponentModel.ApplicationComponent.instance)
                .joinedload(InstanceModel.Instance.application),
                joinedload(ApplicationComponentModel.ApplicationComponent.instances)
                .joinedload(ClusterInstanceModel.ClusterInstance.cluster)
            )
            .filter(ApplicationComponentModel.ApplicationComponent.uuid == uuid)
            .first()
        )

        if db_webapp is None:
            raise HTTPException(status_code=404, detail="Webapp not found")
        if db_webapp.type != ApplicationComponentModel.WebappType.webapp:
            raise HTTPException(
                status_code=400,
                detail="Component is not a webapp"
            )

        # Buscar cluster_instance relacionado
        cluster_instance = (
            db.query(ClusterInstanceModel.ClusterInstance)
            .filter(ClusterInstanceModel.ClusterInstance.application_component_id == db_webapp.id)
            .first()
        )

        if not cluster_instance:
            raise HTTPException(
                status_code=404,
                detail="Webapp is not deployed to any cluster"
            )

        cluster = cluster_instance.cluster
        application_name = db_webapp.instance.application.name

        # Criar cliente Kubernetes
        k8s_client = K8sClient(url=cluster.api_address, token=cluster.token)

        # Executar comando no pod
        try:
            result = k8s_client.exec_pod_command(
                namespace=application_name,
                pod_name=pod_name,
                command=command,
                container_name=container_name
            )
            return result
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to execute command in pod {pod_name}: {str(e)}"
            )

