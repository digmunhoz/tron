from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import database
from app.services.webapp import WebappService
from app.schemas import webapp as schemas
from uuid import UUID

router = APIRouter()


@router.post("/webapps/", response_model=schemas.WebappReducedResponse)
def create_webapp(
    webapp: schemas.WebappCreate,
    uuid: UUID = None,
    db: Session = Depends(database.get_db),
):
    return WebappService.upsert_webapp(db, webapp, uuid)


@router.put("/webapps/{uuid}", response_model=schemas.WebappReducedResponse)
def update_webapp(
    webapp: schemas.WebappCreate,
    uuid: UUID = None,
    db: Session = Depends(database.get_db),
):
    return WebappService.upsert_webapp(db, webapp, uuid)

@router.get("/webapps/", response_model=list[schemas.WebappReducedResponse])
def list_webapps(skip: int = 0, limit: int = 10, db: Session = Depends(database.get_db)):
    return WebappService.get_webapps(db, skip=skip, limit=limit)


@router.get("/webapps/{uuid}", response_model=schemas.WebappCompletedResponse)
def get_webapp(uuid: UUID, db: Session = Depends(database.get_db)):
    db_webapp = WebappService.get_webapp(db, uuid=uuid)
    if db_webapp is None:
        raise HTTPException(status_code=404, detail="Webapp not found")
    return db_webapp


@router.delete("/webapps/{uuid}", response_model=dict)
def delete_webapp(uuid: UUID, db: Session = Depends(database.get_db)):
    return WebappService.delete_webapp(db, uuid)
