from fastapi import HTTPException
from sqlalchemy.orm import Session
from uuid import uuid4
from uuid import UUID
from app.k8s.client import K8sClient
from app.services.kubernetes.webapp_instance_manager import (
    KubernetesWebAppInstanceManager,
)

import app.models.webapp as WebappModel
import app.models.environment as EnvironmentModel
import app.models.webapp_deploy as WebappDeployModel
import app.models.cluster as ClusterModel
import app.models.workload as WorkloadModel
import app.models.instance as InstanceModel
import app.schemas.webapp_deploy as WebappDeploySchema


class WebappDeployService:
    def upsert_webapp(
        db: Session,
        webapp_deploy: WebappDeploySchema.WebappDeployCreate,
        uuid: UUID = None,
    ):

        if uuid:

            db_webapp_deploy = (
                db.query(WebappDeployModel.WebappDeploy)
                .filter(WebappDeployModel.WebappDeploy.uuid == uuid)
                .first()
            )

            if db_webapp_deploy is None:
                raise HTTPException(status_code=404, detail="Webapp Deploy not found")

            workload = (
                db.query(WorkloadModel.Workload)
                .filter(WorkloadModel.Workload.uuid == webapp_deploy.workload_uuid)
                .first()
            )

            db_webapp_deploy.workload_id = workload.id
            db_webapp_deploy.image = webapp_deploy.image
            db_webapp_deploy.version = webapp_deploy.version
            db_webapp_deploy.custom_metrics = webapp_deploy.custom_metrics.model_dump()
            db_webapp_deploy.endpoints = [
                endpoint.model_dump() for endpoint in webapp_deploy.endpoints
            ]
            db_webapp_deploy.envs = [env.model_dump() for env in webapp_deploy.envs]
            db_webapp_deploy.secrets = [
                secret.model_dump() for secret in webapp_deploy.secrets
            ]
            db_webapp_deploy.cpu_scaling_threshold = webapp_deploy.cpu_scaling_threshold
            db_webapp_deploy.memory_scaling_threshold = (
                webapp_deploy.memory_scaling_threshold
            )

            instances = (
                db.query(InstanceModel.Instance)
                .filter(InstanceModel.Instance.webapp_deploy_id == db_webapp_deploy.id)
                .all()
            )

            try:
                for instance in instances:

                    cluster = (
                        db.query(ClusterModel.Cluster)
                        .filter(ClusterModel.Cluster.id == instance.cluster_id)
                        .first()
                    )

                    webapp_deploy_serialized = {
                        "webapp_name": db_webapp_deploy.webapp.name,
                        "webapp_uuid": db_webapp_deploy.webapp.uuid,
                        "namespace_name": db_webapp_deploy.webapp.namespace.name,
                        "namespace_uuid": db_webapp_deploy.webapp.namespace.uuid,
                        "workload": workload.name,
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
                    k8s_instance_manager.instance_management(
                        webapp_deploy_serialized, operation="update"
                    )

                    db.commit()
                    db.refresh(db_webapp_deploy)

            except Exception as e:
                db.rollback()
                message = {"status": "error", "message": f"{e}"}
                raise HTTPException(status_code=400, detail=message)

        else:
            db_webapp_deploy = WebappDeployModel.WebappDeploy(
                uuid=uuid4(),
                image=webapp_deploy.image,
                version=webapp_deploy.version,
                environment_id=(
                    db.query(EnvironmentModel.Environment)
                    .filter(
                        EnvironmentModel.Environment.uuid
                        == webapp_deploy.environment_uuid
                    )
                    .first()
                    .id
                ),
                webapp_id=(
                    db.query(WebappModel.Webapp)
                    .filter(WebappModel.Webapp.uuid == webapp_deploy.webapp_uuid)
                    .first()
                    .id
                ),
                workload_id=(
                    db.query(WorkloadModel.Workload)
                    .filter(WorkloadModel.Workload.uuid == webapp_deploy.workload_uuid)
                    .first()
                    .id
                ),
                custom_metrics=webapp_deploy.custom_metrics.model_dump(),
                endpoints=[
                    endpoint.model_dump() for endpoint in webapp_deploy.endpoints
                ],
                envs=[env.model_dump() for env in webapp_deploy.envs],
                secrets=[secret.model_dump() for secret in webapp_deploy.secrets],
                cpu_scaling_threshold=webapp_deploy.cpu_scaling_threshold,
                memory_scaling_threshold=webapp_deploy.memory_scaling_threshold,
            )
            db.add(db_webapp_deploy)
            db.commit()
            db.refresh(db_webapp_deploy)

        return db_webapp_deploy

    def get_webapp_deploy(
        db: Session, uuid: int
    ) -> WebappDeploySchema.WebappDeployCompletedResponse:
        db_webapp_deploy = (
            db.query(WebappDeployModel.WebappDeploy)
            .filter(WebappDeployModel.WebappDeploy.uuid == uuid)
            .first()
        )
        if db_webapp_deploy is None:
            raise HTTPException(status_code=404, detail="Webapp Deploy not found")
        return WebappDeploySchema.WebappDeployCompletedResponse.model_validate(
            db_webapp_deploy
        )

    def get_webapp_deploys(
        db: Session, skip: int = 0, limit: int = 10
    ) -> WebappDeploySchema.WebappDeployReducedResponse:
        return db.query(WebappDeployModel.WebappDeploy).offset(skip).limit(limit).all()

    def delete_webapp_deploy(db: Session, uuid: UUID):
        db_webapp_deploy = (
            db.query(WebappDeployModel.WebappDeploy)
            .filter(WebappDeployModel.WebappDeploy.uuid == uuid)
            .first()
        )
        if db_webapp_deploy is None:
            raise HTTPException(status_code=404, detail="Webapp Deploy not found")

        db.delete(db_webapp_deploy)
        db.commit()
        return {"detail": "Webapp Deploy deleted successfully"}
