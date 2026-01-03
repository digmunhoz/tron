from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from .. import database
from app.services.application import ApplicationService
from app.schemas import application as ApplicationSchemas

router = APIRouter()


@router.post("/applications/", response_model=ApplicationSchemas.Application)
def create_application(
    application: ApplicationSchemas.ApplicationCreate,
    db: Session = Depends(database.get_db),
):
    return ApplicationService.upsert_application(db, application)


@router.put("/applications/{uuid}", response_model=ApplicationSchemas.Application)
def update_application(
    uuid: UUID,
    application: ApplicationSchemas.ApplicationUpdate,
    db: Session = Depends(database.get_db),
):
    return ApplicationService.update_application(db, uuid, application)


@router.get("/applications/", response_model=list[ApplicationSchemas.Application])
def list_applications(
    skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)
):
    return ApplicationService.get_applications(db, skip=skip, limit=limit)


@router.get("/applications/{uuid}", response_model=ApplicationSchemas.Application)
def get_application(uuid: UUID, db: Session = Depends(database.get_db)):
    db_application = ApplicationService.get_application(db, uuid=uuid)
    if db_application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    return db_application


@router.delete("/applications/{uuid}", response_model=dict)
def delete_application(uuid: UUID, db: Session = Depends(database.get_db)):
    return ApplicationService.delete_application(db, uuid)

