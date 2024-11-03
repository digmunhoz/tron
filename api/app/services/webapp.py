from fastapi import HTTPException
from sqlalchemy.orm import Session
from uuid import uuid4
from uuid import UUID

import app.models.webapp as WebappModel
import app.models.webapp_deploy as WebappDeployModel
import app.models.namespace as NamespaceModel
import app.models.webapp_deploy as WebappDeployModel
import app.schemas.webapp as WebappSchema


class WebappService:
    def upsert_webapp(
        db: Session, webapp: WebappSchema.WebappCreate, webapp_uuid: UUID = None
    ):
        if webapp_uuid:

            db_webapp = (
                db.query(WebappModel.Webapp)
                .filter(WebappModel.Webapp.uuid == webapp_uuid)
                .first()
            )
            if db_webapp is None:
                raise HTTPException(status_code=404, detail="Webapp not found")

            db_webapp.name = webapp.name
            db_webapp.namespace_id = (
                db.query(NamespaceModel.Namespace)
                .filter(NamespaceModel.Namespace.uuid == webapp.namespace_uuid)
                .first()
                .id
            )
            db_webapp.private = webapp.private
        else:
            db_webapp = WebappModel.Webapp(
                uuid=uuid4(),
                name=webapp.name,
                namespace_id=(
                    db.query(NamespaceModel.Namespace)
                    .filter(NamespaceModel.Namespace.uuid == webapp.namespace_uuid)
                    .first()
                    .id
                ),
                private=webapp.private,
            )
            db.add(db_webapp)

        db.commit()
        db.refresh(db_webapp)
        return db_webapp

    def get_webapp(db: Session, uuid: int) -> WebappSchema.WebappCompletedResponse:
        db_webapp = (
            db.query(WebappModel.Webapp).filter(WebappModel.Webapp.uuid == uuid).first()
        )

        if db_webapp is None:
            raise HTTPException(status_code=404, detail="Webapp not found")

        serialized_data = {
            "uuid": db_webapp.uuid,
            "name": db_webapp.name,
            "private": db_webapp.private,
            "namespace": db_webapp.namespace,
            "webapp_deploy": [
                {
                    "uuid": webapp_deploy.uuid,
                    "environment": {
                        "uuid": webapp_deploy.environment.uuid,
                        "name": webapp_deploy.environment.name,
                    },
                }
                for webapp_deploy in db_webapp.webapp_deploys
            ],
        }

        return WebappSchema.WebappCompletedResponse.model_validate(serialized_data)

    def get_webapps(
        db: Session, skip: int = 0, limit: int = 100
    ) -> WebappSchema.WebappReducedResponse:
        return db.query(WebappModel.Webapp).offset(skip).limit(limit).all()

    def delete_webapp(db: Session, uuid: UUID):
        db_webapp = (
            db.query(WebappModel.Webapp).filter(WebappModel.Webapp.uuid == uuid).first()
        )
        if db_webapp is None:
            raise HTTPException(status_code=404, detail="Webapp not found")

        db.delete(db_webapp)
        db.commit()
        return {"detail": "Webapp deleted successfully"}
