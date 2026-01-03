from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from .. import database
from app.services.instance import InstanceService
from app.schemas import instance as InstanceSchemas

router = APIRouter()


@router.post("/instances/", response_model=InstanceSchemas.Instance)
def create_instance(
    instance: InstanceSchemas.InstanceCreate,
    db: Session = Depends(database.get_db),
):
    return InstanceService.upsert_instance(db, instance)


@router.put("/instances/{uuid}", response_model=InstanceSchemas.Instance)
def update_instance(
    uuid: UUID,
    instance: InstanceSchemas.InstanceUpdate,
    db: Session = Depends(database.get_db),
):
    return InstanceService.update_instance(db, uuid, instance)


@router.get("/instances/", response_model=list[InstanceSchemas.Instance])
def list_instances(
    skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)
):
    return InstanceService.get_instances(db, skip=skip, limit=limit)


@router.get("/instances/{uuid}", response_model=InstanceSchemas.Instance)
def get_instance(uuid: UUID, db: Session = Depends(database.get_db)):
    db_instance = InstanceService.get_instance(db, uuid=uuid)
    if db_instance is None:
        raise HTTPException(status_code=404, detail="Instance not found")
    return db_instance


@router.delete("/instances/{uuid}", response_model=dict)
def delete_instance(uuid: UUID, db: Session = Depends(database.get_db)):
    return InstanceService.delete_instance(db, uuid)

