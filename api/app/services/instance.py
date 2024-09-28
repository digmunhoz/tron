from fastapi import HTTPException

import app.models.instance as InstanceModel
import app.models.webapp_deploy as WebappDeployModel
import app.models.cluster as ClusterModel
import app.models.environment as EnvironmentModel
import app.schemas.instance as InstanceSchema

from app.utils.serializers import serialize_webapp
from app.k8s.client import K8sClient
from app.services.kubernetes.webapp_instance_manager import (
    KubernetesWebAppInstanceManager,
)

from sqlalchemy.orm import Session
from uuid import uuid4
from uuid import UUID


class InstanceService:
    def get_instance(db: Session, instance_uuid: int):
        db_instance = (
            db.query(InstanceModel.Instance)
            .filter(InstanceModel.Instance.uuid == instance_uuid)
            .first()
        )

        if db_instance is None:
            raise HTTPException(status_code=404, detail="Instance not found")

        return InstanceSchema.Instance.model_validate(db_instance)

    def get_instances(db: Session, skip: int = 0, limit: int = 10):
        db_instances = db.query(InstanceModel.Instance).offset(skip).limit(limit).all()

        return db_instances

    def delete_instance(db: Session, instance_uuid: UUID):

        db_instance = (
            db.query(InstanceModel.Instance)
            .filter(InstanceModel.Instance.uuid == instance_uuid)
            .first()
        )
        if db_instance is None:
            raise HTTPException(status_code=404, detail="Instance not found")

        webapp_deploy = (
            db.query(WebappDeployModel.WebappDeploy)
            .filter(WebappDeployModel.WebappDeploy.uuid == db_instance.webapp_deploy.uuid)
            .first()
        )

        cluster = (
            db.query(ClusterModel.Cluster)
            .filter(ClusterModel.Cluster.uuid == db_instance.cluster.uuid)
            .first()
        )

        try:
            webapp_deploy_serialized = {
                "webapp_name": webapp_deploy.webapp.name,
                "webapp_uuid": webapp_deploy.webapp.uuid,
                "namespace_name": webapp_deploy.webapp.namespace.name,
                "namespace_uuid": webapp_deploy.webapp.namespace.uuid,
                "workload": webapp_deploy.workload.name,
                "image": webapp_deploy.image,
                "version": webapp_deploy.version,
                "cpu_scaling_threshold": webapp_deploy.cpu_scaling_threshold,
                "memory_scaling_threshold": webapp_deploy.memory_scaling_threshold,
                "envs": [env for env in webapp_deploy.envs],
                "secrets": [secret for secret in webapp_deploy.secrets],
                "custom_metrics": webapp_deploy.custom_metrics,
            }

            k8s_client = K8sClient(url=cluster.api_address, token=cluster.token)
            k8s_instance_manager = KubernetesWebAppInstanceManager(k8s_client)
            k8s_instance_manager.instance_management(webapp_deploy_serialized, operation="delete")

            db.delete(db_instance)
            db.commit()
        except Exception as e:
            message = {"status": "error", "message": f"{e}"}

            raise HTTPException(status_code=400, detail=message)

        return {"detail": "Instance deleted successfully"}

    def upsert_instance(
        db: Session,
        instance: InstanceSchema.InstanceCreate,
        instance_uuid: UUID = None,
    ):

        cluster = (
            db.query(ClusterModel.Cluster)
            .filter(ClusterModel.Cluster.uuid == instance.cluster_uuid)
            .first()
        )

        webapp_deploy = (
            db.query(WebappDeployModel.WebappDeploy)
            .filter(WebappDeployModel.WebappDeploy.uuid == instance.webapp_deploy_uuid)
            .first()
        )

        if cluster.environment.uuid != webapp_deploy.environment.uuid:
            raise HTTPException(
                status_code=400, detail="Cluster is not associated with the environment"
            )

        if instance_uuid:
            db_instance = (
                db.query(InstanceModel.Instance)
                .filter(InstanceModel.Instance.uuid == instance_uuid)
                .first()
            )
            if db_instance:
                db_instance.cluster_id = cluster.id
                db_instance.webapp_deploy_id = webapp_deploy.id
                try:

                    webapp_deploy_serialized = {
                        "webapp_name": webapp_deploy.webapp.name,
                        "webapp_uuid": webapp_deploy.webapp.uuid,
                        "namespace_name": webapp_deploy.webapp.namespace.name,
                        "namespace_uuid": webapp_deploy.webapp.namespace.uuid,
                        "workload": webapp_deploy.workload.name,
                        "image": webapp_deploy.image,
                        "version": webapp_deploy.version,
                        "cpu_scaling_threshold": webapp_deploy.cpu_scaling_threshold,
                        "memory_scaling_threshold": webapp_deploy.memory_scaling_threshold,
                        "envs": [env for env in webapp_deploy.envs],
                        "secrets": [secret for secret in webapp_deploy.secrets],
                        "custom_metrics": webapp_deploy.custom_metrics,
                    }

                    k8s_client = K8sClient(url=cluster.api_address, token=cluster.token)
                    k8s_instance_manager = KubernetesWebAppInstanceManager(k8s_client)
                    k8s_instance_manager.instance_management(webapp_deploy_serialized, operation="create")

                    db.commit()
                    db.refresh(db_instance)
                except Exception as e:
                    db.rollback()
                    message = {"status": "error", "message": f"{e}"}
                    raise HTTPException(status_code=400, detail=message)
                return db_instance

        new_instance = InstanceModel.Instance(
            uuid=uuid4(), cluster_id=cluster.id, webapp_deploy_id=webapp_deploy.id
        )
        db.add(new_instance)
        try:

            webapp_deploy_serialized = serialize_webapp(webapp_deploy)

            k8s_client = K8sClient(url=cluster.api_address, token=cluster.token)
            k8s_instance_manager = KubernetesWebAppInstanceManager(k8s_client)
            k8s_instance_manager.instance_management(webapp_deploy_serialized, operation="create")

            db.commit()
            db.refresh(new_instance)

        except Exception as e:

            db.rollback()
            message = {"status": "error", "message": f"{e}"}

            raise HTTPException(status_code=400, detail=message)
        return new_instance
