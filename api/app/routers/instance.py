from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import database
from app.services.instance import InstanceService
from app.schemas import instance as schemas
from uuid import UUID

router = APIRouter()


@router.post("/instances", response_model=schemas.Instance)
def create_instance(
    instance: schemas.InstanceCreate,
    uuid: UUID = None,
    db: Session = Depends(database.get_db),
):
    return InstanceService.upsert_instance(db, instance, uuid)


@router.get("/instances/", response_model=list[schemas.Instance])
def list_instances(
    skip: int = 0, limit: int = 10, db: Session = Depends(database.get_db)
):
    return InstanceService.get_instances(db, skip=skip, limit=limit)


@router.get("/instances/{uuid}", response_model=schemas.Instance)
def get_instance(uuid: UUID, db: Session = Depends(database.get_db)):
    db_instance = InstanceService.get_instance(db, instance_uuid=uuid)
    if db_instance is None:
        raise HTTPException(status_code=404, detail="Instance not found")
    return db_instance


@router.delete("/instances/{uuid}", response_model=dict)
def delete_instance(uuid: UUID, db: Session = Depends(database.get_db)):
    return InstanceService.delete_instance(db, uuid)
