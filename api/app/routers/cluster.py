from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import database
from app.services.cluster import ClusterService
from app.schemas import cluster as schemas
from uuid import UUID

router = APIRouter()


@router.post("/clusters", response_model=schemas.ClusterResponse)
def create_cluster(
    cluster: schemas.ClusterCreate,
    uuid: UUID = None,
    db: Session = Depends(database.get_db),
):
    return ClusterService.upsert_cluster(db, cluster, uuid)


@router.put("/clusters/{uuid}", response_model=schemas.ClusterResponse)
def update_cluster(
    cluster: schemas.ClusterUpdate,
    uuid: UUID = None,
    db: Session = Depends(database.get_db),
):
    return ClusterService.upsert_cluster(db, cluster, uuid)

@router.get("/clusters/", response_model=list[schemas.ClusterResponseWithValidation])
def list_clusters(
    skip: int = 0, limit: int = 10, db: Session = Depends(database.get_db)
):
    return ClusterService.get_clusters(db, skip=skip, limit=limit)


@router.get("/clusters/{uuid}", response_model=schemas.ClusterCompletedResponse)
def get_cluster(uuid: UUID, db: Session = Depends(database.get_db)):
    db_cluster = ClusterService.get_cluster(db, uuid=uuid)
    if db_cluster is None:
        raise HTTPException(status_code=404, detail="Cluster not found")
    return db_cluster


@router.delete("/clusters/{uuid}", response_model=dict)
def delete_cluster(uuid: UUID, db: Session = Depends(database.get_db)):
    return ClusterService.delete_cluster(db, uuid)
