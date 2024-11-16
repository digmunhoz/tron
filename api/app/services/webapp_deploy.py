from fastapi import HTTPException
from sqlalchemy.orm import Session
from uuid import uuid4
from uuid import UUID
from app.k8s.client import K8sClient
from app.helpers.serializers import serialize_webapp_deploy, serialize_settings
from app.services.kubernetes.webapp_instance_manager import (
    KubernetesWebAppInstanceManager,
)

import app.models.webapp as WebappModel
import app.models.environment as EnvironmentModel
import app.models.webapp_deploy as WebappDeployModel
import app.models.settings as SettingsModel
import app.models.cluster as ClusterModel
import app.models.workload as WorkloadModel
import app.models.webapp_instance as InstanceModel
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

            settings = (
                db.query(SettingsModel.Settings)
                .filter(SettingsModel.Settings.environment_id == db_webapp_deploy.environment_id)
                .all()
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
            db_webapp_deploy.healthcheck = webapp_deploy.healthcheck.model_dump()
            db_webapp_deploy.cpu = webapp_deploy.cpu
            db_webapp_deploy.memory = webapp_deploy.memory

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

                    webapp_deploy_serialized = serialize_webapp_deploy(db_webapp_deploy)
                    settings_serialized = serialize_settings(settings)

                    k8s_client = K8sClient(url=cluster.api_address, token=cluster.token)
                    kubernetes_payload = (
                        KubernetesWebAppInstanceManager.instance_management(
                            webapp_deploy_serialized, settings_serialized
                        )
                    )
                    k8s_client.apply_or_delete_yaml_to_k8s(
                        kubernetes_payload, operation="update"
                    )

                    db.commit()
                    db.refresh(db_webapp_deploy)

            except Exception as e:
                db.rollback()
                message = {"status": "error", "message": f"{e}"}
                raise HTTPException(status_code=400, detail=message)

        else:

            workload = (
                db.query(WorkloadModel.Workload)
                .filter(WorkloadModel.Workload.uuid == webapp_deploy.workload_uuid)
                .first()
            )

            if not workload:
                raise HTTPException(status_code=404, detail="Workload not found")

            webapp = (
                db.query(WebappModel.Webapp)
                .filter(WebappModel.Webapp.uuid == webapp_deploy.webapp_uuid)
                .first()
            )

            environment = (
                db.query(EnvironmentModel.Environment)
                .filter(
                    EnvironmentModel.Environment.uuid == webapp_deploy.environment_uuid
                )
                .first()
            )

            db_webapp_deploy = WebappDeployModel.WebappDeploy(
                uuid=uuid4(),
                image=webapp_deploy.image,
                version=webapp_deploy.version,
                webapp_id=webapp.id,
                workload_id=workload.id,
                environment_id=environment.id,
                custom_metrics=webapp_deploy.custom_metrics.model_dump(),
                endpoints=[
                    endpoint.model_dump() for endpoint in webapp_deploy.endpoints
                ],
                envs=[env.model_dump() for env in webapp_deploy.envs],
                secrets=[secret.model_dump() for secret in webapp_deploy.secrets],
                cpu_scaling_threshold=webapp_deploy.cpu_scaling_threshold,
                memory_scaling_threshold=webapp_deploy.memory_scaling_threshold,
                healthcheck=webapp_deploy.healthcheck.model_dump(),
                cpu=webapp_deploy.cpu,
                memory=webapp_deploy.memory,
            )
            db.add(db_webapp_deploy)

            try:
                db.commit()
                db.refresh(db_webapp_deploy)
            except Exception as e:
                db.rollback()
                message = {"status": "error", "message": f"{e._sql_message}"}
                raise HTTPException(status_code=400, detail=message)

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
        db: Session, skip: int = 0, limit: int = 100
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

        try:
            db.delete(db_webapp_deploy)
            db.commit()
        except Exception as e:
            db.rollback()
            message = {"status": "error", "message": f"{e._sql_message}"}
            print(dir(e))
            raise HTTPException(status_code=400, detail=message)

        return {"detail": "Webapp Deploy deleted successfully"}
