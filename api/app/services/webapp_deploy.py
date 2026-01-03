from fastapi import HTTPException
from sqlalchemy.orm import Session
from uuid import uuid4
from uuid import UUID

import app.models.application_components as ApplicationComponentModel
import app.models.instance as InstanceModel
import app.schemas.application_components as ApplicationComponentSchema


class ApplicationComponentService:
    def upsert_webapp(
        db: Session,
        webapp_deploy: ApplicationComponentSchema.ApplicationComponentCreate,
        uuid: UUID = None,
    ):
        # Validate that webapp type requires url
        if webapp_deploy.type == ApplicationComponentSchema.WebappType.webapp and not webapp_deploy.url:
            raise HTTPException(
                status_code=400,
                detail="URL is required when type is 'webapp'"
            )

        # Get instance by uuid
        instance = (
            db.query(InstanceModel.Instance)
            .filter(InstanceModel.Instance.uuid == webapp_deploy.instance_uuid)
            .first()
        )
        if instance is None:
            raise HTTPException(status_code=404, detail="Instance not found")

        if uuid:

            db_webapp_deploy = (
                db.query(ApplicationComponentModel.ApplicationComponent)
                .filter(ApplicationComponentModel.ApplicationComponent.uuid == uuid)
                .first()
            )

            if db_webapp_deploy is None:
                raise HTTPException(status_code=404, detail="Webapp Deploy not found")

            if webapp_deploy.name is not None:
                db_webapp_deploy.name = webapp_deploy.name
            if webapp_deploy.type is not None:
                db_webapp_deploy.type = webapp_deploy.type
            if webapp_deploy.settings is not None:
                db_webapp_deploy.settings = webapp_deploy.settings
            if webapp_deploy.is_public is not None:
                db_webapp_deploy.is_public = webapp_deploy.is_public
            if webapp_deploy.url is not None:
                db_webapp_deploy.url = webapp_deploy.url
            if webapp_deploy.enabled is not None:
                db_webapp_deploy.enabled = webapp_deploy.enabled

            # Validate that webapp type requires url (check final state after all updates)
            final_type = db_webapp_deploy.type
            final_url = db_webapp_deploy.url
            if final_type == ApplicationComponentSchema.WebappType.webapp and not final_url:
                raise HTTPException(
                    status_code=400,
                    detail="URL is required when type is 'webapp'"
                )

            db.commit()
            db.refresh(db_webapp_deploy)

        else:
            db_webapp_deploy = ApplicationComponentModel.ApplicationComponent(
                uuid=uuid4(),
                instance_id=instance.id,
                name=webapp_deploy.name,
                type=webapp_deploy.type,
                settings=webapp_deploy.settings,
                is_public=webapp_deploy.is_public,
                url=webapp_deploy.url,
                enabled=webapp_deploy.enabled,
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
    ) -> ApplicationComponentSchema.ApplicationComponentCompletedResponse:
        db_webapp_deploy = (
            db.query(ApplicationComponentModel.ApplicationComponent)
            .filter(ApplicationComponentModel.ApplicationComponent.uuid == uuid)
            .first()
        )
        if db_webapp_deploy is None:
            raise HTTPException(status_code=404, detail="Webapp Deploy not found")
        return ApplicationComponentSchema.ApplicationComponentCompletedResponse.model_validate(
            db_webapp_deploy
        )

    def get_webapp_deploys(
        db: Session, skip: int = 0, limit: int = 100
    ) -> ApplicationComponentSchema.ApplicationComponentReducedResponse:
        return db.query(ApplicationComponentModel.ApplicationComponent).offset(skip).limit(limit).all()

    def delete_webapp_deploy(db: Session, uuid: UUID):
        db_webapp_deploy = (
            db.query(ApplicationComponentModel.ApplicationComponent)
            .filter(ApplicationComponentModel.ApplicationComponent.uuid == uuid)
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
