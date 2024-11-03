from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from .. import database
from app.services.webapp import WebappService
from app.schemas import webapp as WebappSchemas
from app.services.webapp_deploy import WebappDeployService
from app.schemas import webapp_deploy as WebappDeploySchemas
from app.services.webapp_instance import InstanceService
from app.schemas import instance as WebappInstanceSchemas

router = APIRouter()


@router.post("/webapps/", response_model=WebappSchemas.WebappReducedResponse)
def create_webapp(
    webapp: WebappSchemas.WebappCreate,
    uuid: UUID = None,
    db: Session = Depends(database.get_db),
):
    return WebappService.upsert_webapp(db, webapp, uuid)


@router.put("/webapps/{uuid}", response_model=WebappSchemas.WebappReducedResponse)
def update_webapp(
    webapp: WebappSchemas.WebappCreate,
    uuid: UUID = None,
    db: Session = Depends(database.get_db),
):
    return WebappService.upsert_webapp(db, webapp, uuid)


@router.get("/webapps/", response_model=list[WebappSchemas.WebappReducedResponse])
def list_webapps(
    skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)
):
    return WebappService.get_webapps(db, skip=skip, limit=limit)


@router.get("/webapps/{uuid}", response_model=WebappSchemas.WebappCompletedResponse)
def get_webapp(uuid: UUID, db: Session = Depends(database.get_db)):
    db_webapp = WebappService.get_webapp(db, uuid=uuid)
    if db_webapp is None:
        raise HTTPException(status_code=404, detail="Webapp not found")
    return db_webapp


@router.delete("/webapps/{uuid}", response_model=dict)
def delete_webapp(uuid: UUID, db: Session = Depends(database.get_db)):
    return WebappService.delete_webapp(db, uuid)


@router.post(
    "/webapps/deploys/", response_model=WebappDeploySchemas.WebappDeployReducedResponse
)
def create_webapp_deploy(
    webapp_deploy: WebappDeploySchemas.WebappDeployCreate,
    db: Session = Depends(database.get_db),
):
    return WebappDeployService.upsert_webapp(db, webapp_deploy)


@router.put(
    "/webapps/deploys/{uuid}",
    response_model=WebappDeploySchemas.WebappDeployReducedResponse,
)
def update_webapp_deploy(
    uuid: UUID,
    webapp_deploy: WebappDeploySchemas.WebappDeployUpdate,
    db: Session = Depends(database.get_db),
):
    return WebappDeployService.upsert_webapp(db, webapp_deploy, uuid)


@router.get(
    "/webapps/deploys/",
    response_model=list[WebappDeploySchemas.WebappDeployReducedResponse],
)
def list_webapp_deploys(
    skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)
):
    return WebappDeployService.get_webapp_deploys(db, skip=skip, limit=limit)


@router.get(
    "/webapps/deploys/{uuid}",
    response_model=WebappDeploySchemas.WebappDeployCompletedResponse,
)
def get_webapp_deploy(uuid: UUID, db: Session = Depends(database.get_db)):
    db_webapp_deploy = WebappDeployService.get_webapp_deploy(db, uuid=uuid)
    if db_webapp_deploy is None:
        raise HTTPException(status_code=404, detail="Webapp Deploy not found")
    return db_webapp_deploy


@router.delete("/webapps/deploys/{uuid}", response_model=dict)
def delete_webapp_deploy(uuid: UUID, db: Session = Depends(database.get_db)):
    return WebappDeployService.delete_webapp_deploy(db, uuid)


@router.post("/webapps/instances/", response_model=WebappInstanceSchemas.Instance)
def create_instance(
    instance: WebappInstanceSchemas.InstanceCreate,
    uuid: UUID = None,
    db: Session = Depends(database.get_db),
):
    return InstanceService.upsert_instance(db, instance, uuid)


@router.get("/webapps/instances/", response_model=list[WebappInstanceSchemas.Instance])
def list_instances(
    skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)
):
    return InstanceService.get_instances(db, skip=skip, limit=limit)


@router.get("/webapps/instances/{uuid}", response_model=WebappInstanceSchemas.Instance)
def get_instance(uuid: UUID, db: Session = Depends(database.get_db)):
    db_instance = InstanceService.get_instance(db, instance_uuid=uuid)
    if db_instance is None:
        raise HTTPException(status_code=404, detail="Instance not found")
    return db_instance


@router.delete("/webapps/instances/{uuid}", response_model=dict)
def delete_instance(uuid: UUID, db: Session = Depends(database.get_db)):
    return InstanceService.delete_instance(db, uuid)
