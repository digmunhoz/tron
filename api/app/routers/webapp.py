from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.database import get_db
from app.services.webapp import WebappService
import app.schemas.webapp as WebappSchemas

router = APIRouter(prefix="/application_components/webapp", tags=["Webapp"])


@router.post("/", response_model=WebappSchemas.Webapp)
def create_webapp(
    webapp: WebappSchemas.WebappCreate,
    db: Session = Depends(get_db),
):
    return WebappService.upsert_webapp(db=db, webapp=webapp)


@router.get("/", response_model=list[WebappSchemas.Webapp])
def list_webapps(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    return WebappService.get_webapps(db=db, skip=skip, limit=limit)


@router.get("/{uuid}", response_model=WebappSchemas.Webapp)
def get_webapp(
    uuid: UUID,
    db: Session = Depends(get_db),
):
    return WebappService.get_webapp(db=db, uuid=uuid)


@router.put("/{uuid}", response_model=WebappSchemas.Webapp)
def update_webapp(
    uuid: UUID,
    webapp: WebappSchemas.WebappUpdate,
    db: Session = Depends(get_db),
):
    return WebappService.upsert_webapp(db=db, webapp=webapp, uuid=uuid)


@router.delete("/{uuid}")
def delete_webapp(
    uuid: UUID,
    db: Session = Depends(get_db),
):
    return WebappService.delete_webapp(db=db, uuid=uuid)

