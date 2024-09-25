from fastapi import HTTPException

import app.models.instance as InstanceModel
import app.models.webapp_deploy as WebappDeployModel
import app.models.cluster as ClusterModel
import app.schemas.instance as InstanceSchema

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

        db.delete(db_instance)
        db.commit()
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
            raise HTTPException(status_code=400, detail="Cluster is not associated with the environment")

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
                    db.commit()
                except Exception as e:
                    message = {"status": "error", "message": f"{e._message}"}
                    raise HTTPException(status_code=400, detail=message)
                db.refresh(db_instance)
                return db_instance

        new_instance = InstanceModel.Instance(
            uuid=uuid4(), cluster_id=cluster.id, webapp_deploy_id=webapp_deploy.id
        )
        db.add(new_instance)
        try:
            db.commit()
        except Exception as e:
            message = {"status": "error", "message": f"{e._message}"}
            raise HTTPException(status_code=400, detail=message)
        db.refresh(new_instance)
        return new_instance
