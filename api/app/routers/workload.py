from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import database
from app.services.workload import WorkloadService
from app.schemas import workload as schemas
from uuid import UUID

router = APIRouter()


@router.get("/workloads/", response_model=list[schemas.Workload])
def list_workloads(
    skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)
):
    return WorkloadService.get_workloads(db, skip=skip, limit=limit)


@router.get("/workloads/{workload_id}", response_model=schemas.Workload)
def get_workload(workload_id: int, db: Session = Depends(database.get_db)):
    db_workload = WorkloadService.get_workload(db, workload_id=workload_id)
    if db_workload is None:
        raise HTTPException(status_code=404, detail="Workload not found")
    return db_workload


@router.delete("/workloads/{uuid}", response_model=dict)
def delete_workload(uuid: UUID, db: Session = Depends(database.get_db)):
    return WorkloadService.delete_workload(db, uuid)


@router.post("/workloads/", response_model=schemas.Workload)
def create_workload(
    workload: schemas.WorkloadCreate,
    workload_uuid: UUID = None,
    db: Session = Depends(database.get_db),
):
    return WorkloadService.upsert_workload(db, workload, workload_uuid)


@router.put("/workloads/{workload_uuid}", response_model=schemas.Workload)
def update_workload(
    workload: schemas.WorkloadCreate,
    workload_uuid: UUID = None,
    db: Session = Depends(database.get_db),
):
    return WorkloadService.upsert_workload(db, workload, workload_uuid)
