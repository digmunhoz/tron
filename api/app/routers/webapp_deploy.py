from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import database
from app.services.webapp_deploy import WebappDeployService
from app.schemas import webapp_deploy as schemas
from uuid import UUID

router = APIRouter()


@router.post("/webapp_deploys/", response_model=schemas.WebappDeployReducedResponse)
def create_webapp_deploy(
    webapp_deploy: schemas.WebappDeployCreate, db: Session = Depends(database.get_db)
):
    return WebappDeployService.upsert_webapp(db, webapp_deploy)


@router.put("/webapp_deploys/{uuid}", response_model=schemas.WebappDeployReducedResponse)
def update_webapp_deploy(uuid: UUID, webapp_deploy: schemas.WebappDeployUpdate, db: Session = Depends(database.get_db)):
    return WebappDeployService.upsert_webapp(db, webapp_deploy, uuid)

@router.get("/webapp_deploys/", response_model=list[schemas.WebappDeployReducedResponse])
def list_webapp_deploys(
    skip: int = 0, limit: int = 10, db: Session = Depends(database.get_db)
):
    return WebappDeployService.get_webapp_deploys(db, skip=skip, limit=limit)


@router.get("/webapp_deploys/{uuid}", response_model=schemas.WebappDeployCompletedResponse)
def get_webapp_deploy(uuid: UUID, db: Session = Depends(database.get_db)):
    db_webapp_deploy = WebappDeployService.get_webapp_deploy(db, uuid=uuid)
    if db_webapp_deploy is None:
        raise HTTPException(status_code=404, detail="Webapp Deploy not found")
    return db_webapp_deploy

@router.delete("/webapp_deploys/{uuid}", response_model=dict)
def delete_webapp_deploy(uuid: UUID, db: Session = Depends(database.get_db)):
    return WebappDeployService.delete_webapp_deploy(db, uuid)
