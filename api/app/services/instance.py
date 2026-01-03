from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import delete
from uuid import uuid4, UUID

import app.models.instance as InstanceModel
import app.models.application as ApplicationModel
import app.models.environment as EnvironmentModel
import app.models.cluster as ClusterModel
import app.models.application_components as ApplicationComponentModel
import app.models.cluster_instance as ClusterInstanceModel
import app.models.settings as SettingsModel
import app.schemas.instance as InstanceSchema
from app.k8s.client import K8sClient
from app.services.kubernetes.application_component_manager import KubernetesApplicationComponentManager
from app.helpers.serializers import serialize_application_component, serialize_settings


class InstanceService:
    @staticmethod
    def upsert_instance(
        db: Session, instance: InstanceSchema.InstanceCreate, instance_uuid: UUID = None
    ):
        if instance_uuid:
            db_instance = (
                db.query(InstanceModel.Instance)
                .filter(InstanceModel.Instance.uuid == instance_uuid)
                .first()
            )
            if db_instance is None:
                raise HTTPException(status_code=404, detail="Instance not found")

            if instance.image is not None:
                db_instance.image = instance.image
            if instance.version is not None:
                db_instance.version = instance.version
            if instance.enabled is not None:
                db_instance.enabled = instance.enabled
        else:
            application = (
                db.query(ApplicationModel.Application)
                .filter(ApplicationModel.Application.uuid == instance.application_uuid)
                .first()
            )
            if not application:
                raise HTTPException(status_code=404, detail="Application not found")

            environment = (
                db.query(EnvironmentModel.Environment)
                .filter(EnvironmentModel.Environment.uuid == instance.environment_uuid)
                .first()
            )
            if not environment:
                raise HTTPException(status_code=404, detail="Environment not found")

            # Check if instance already exists for this application and environment
            existing_instance = (
                db.query(InstanceModel.Instance)
                .filter(
                    InstanceModel.Instance.application_id == application.id,
                    InstanceModel.Instance.environment_id == environment.id
                )
                .first()
            )
            if existing_instance:
                raise HTTPException(
                    status_code=400,
                    detail="Instance already exists for this application and environment"
                )

            db_instance = InstanceModel.Instance(
                uuid=uuid4(),
                application_id=application.id,
                environment_id=environment.id,
                image=instance.image,
                version=instance.version,
                enabled=instance.enabled,
            )
            db.add(db_instance)

        db.commit()
        db.refresh(db_instance)
        return db_instance

    @staticmethod
    def update_instance(
        db: Session, instance_uuid: UUID, instance: InstanceSchema.InstanceUpdate
    ):
        db_instance = (
            db.query(InstanceModel.Instance)
            .filter(InstanceModel.Instance.uuid == instance_uuid)
            .first()
        )
        if db_instance is None:
            raise HTTPException(status_code=404, detail="Instance not found")

        if instance.image is not None:
            db_instance.image = instance.image
        if instance.version is not None:
            db_instance.version = instance.version
        if instance.enabled is not None:
            db_instance.enabled = instance.enabled

        db.commit()
        db.refresh(db_instance)
        return db_instance

    @staticmethod
    def get_instance(db: Session, uuid: UUID) -> InstanceSchema.Instance:
        db_instance = (
            db.query(InstanceModel.Instance)
            .options(joinedload(InstanceModel.Instance.components))
            .filter(InstanceModel.Instance.uuid == uuid)
            .first()
        )

        if db_instance is None:
            raise HTTPException(status_code=404, detail="Instance not found")

        return db_instance

    @staticmethod
    def get_instances(
        db: Session, skip: int = 0, limit: int = 100
    ) -> list[InstanceSchema.Instance]:
        return (
            db.query(InstanceModel.Instance)
            .options(joinedload(InstanceModel.Instance.components))
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def delete_instance(db: Session, uuid: UUID):
        # Buscar a instância com relacionamentos
        db_instance = (
            db.query(InstanceModel.Instance)
            .options(
                joinedload(InstanceModel.Instance.application),
                joinedload(InstanceModel.Instance.environment),
                joinedload(InstanceModel.Instance.components)
            )
            .filter(InstanceModel.Instance.uuid == uuid)
            .first()
        )
        if db_instance is None:
            raise HTTPException(status_code=404, detail="Instance not found")

        # Obter o nome da aplicação para deletar o namespace
        application_name = db_instance.application.name

        # Buscar todos os componentes associados à instância
        components = (
            db.query(ApplicationComponentModel.ApplicationComponent)
            .options(
                joinedload(ApplicationComponentModel.ApplicationComponent.instance)
                .joinedload(InstanceModel.Instance.application),
                joinedload(ApplicationComponentModel.ApplicationComponent.instance)
                .joinedload(InstanceModel.Instance.environment),
                joinedload(ApplicationComponentModel.ApplicationComponent.instances)
            )
            .filter(ApplicationComponentModel.ApplicationComponent.instance_id == db_instance.id)
            .all()
        )

        # Deletar cada componente e seus recursos do Kubernetes
        # IMPORTANTE: Precisamos deletar os componentes ANTES de deletar a instância
        # para evitar que o SQLAlchemy tente atualizar a foreign key para NULL
        for component in components:
            try:
                # Buscar cluster_instance associado
                cluster_instance = (
                    db.query(ClusterInstanceModel.ClusterInstance)
                    .filter(ClusterInstanceModel.ClusterInstance.application_component_id == component.id)
                    .first()
                )

                if cluster_instance:
                    cluster = cluster_instance.cluster
                    instance = component.instance
                    settings = (
                        db.query(SettingsModel.Settings)
                        .filter(SettingsModel.Settings.environment_id == instance.environment_id)
                        .all()
                    )
                    settings_serialized = serialize_settings(settings)

                    application_component_serialized = serialize_application_component(component)
                    component_type = component.type.value if hasattr(component.type, 'value') else str(component.type)

                    # Deletar recursos do Kubernetes
                    k8s_client = K8sClient(url=cluster.api_address, token=cluster.token)
                    k8s_client.ensure_namespace_exists(application_component_serialized.get("application_name"))
                    kubernetes_payload = KubernetesApplicationComponentManager.instance_management(
                        application_component_serialized, component_type, settings_serialized, db=db
                    )
                    k8s_client.apply_or_delete_yaml_to_k8s(kubernetes_payload, operation="delete")

                    # Deletar cluster_instance usando delete direto no banco
                    cluster_instance_id = cluster_instance.id
                    cluster_instance_stmt = delete(ClusterInstanceModel.ClusterInstance).where(
                        ClusterInstanceModel.ClusterInstance.id == cluster_instance_id
                    )
                    db.execute(cluster_instance_stmt)
                    db.flush()  # Flush para garantir que cluster_instance seja deletado antes do componente

                # Deletar o componente explicitamente usando delete direto no banco
                # Isso evita que o SQLAlchemy tente atualizar a foreign key
                component_id = component.id
                stmt = delete(ApplicationComponentModel.ApplicationComponent).where(
                    ApplicationComponentModel.ApplicationComponent.id == component_id
                )
                db.execute(stmt)
                db.flush()  # Flush imediato para garantir que o componente seja deletado do banco

            except Exception as e:
                # Se houver erro, fazer rollback e relançar
                db.rollback()
                print(f"Error deleting component '{component.name}': {e}")
                raise HTTPException(status_code=400, detail=f"Failed to delete component '{component.name}': {str(e)}")

        # Buscar todos os clusters do environment para deletar o namespace em cada um
        clusters = (
            db.query(ClusterModel.Cluster)
            .filter(ClusterModel.Cluster.environment_id == db_instance.environment_id)
            .all()
        )

        # Deletar o namespace em todos os clusters do environment
        for cluster in clusters:
            try:
                k8s_client = K8sClient(url=cluster.api_address, token=cluster.token)
                k8s_client.delete_namespace(application_name)
            except Exception as e:
                # Log do erro mas continua com a deleção em outros clusters
                print(f"Error deleting namespace '{application_name}' from cluster '{cluster.name}': {e}")

        try:
            # Deletar a instância do banco
            db.delete(db_instance)
            db.commit()
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=400, detail=f"Failed to delete instance: {str(e)}")

        return {"detail": "Instance deleted successfully"}

