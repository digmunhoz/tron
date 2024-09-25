from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import database
from app.services.namespace import NamespaceService
from app.schemas import namespace as schemas
from uuid import UUID

router = APIRouter()


@router.post("/namespaces/", response_model=schemas.Namespace)
def create_namespace(
    namespace: schemas.NamespaceCreate,
    uuid: UUID = None,
    db: Session = Depends(database.get_db),
):
    return NamespaceService.upsert_namespace(db, namespace, uuid)


@router.put("/namespaces/{uuid}", response_model=schemas.Namespace)
def update_namespace(
    namespace: schemas.NamespaceCreate,
    uuid: UUID = None,
    db: Session = Depends(database.get_db),
):
    return NamespaceService.upsert_namespace(db, namespace, uuid)


@router.get("/namespaces/", response_model=list[schemas.Namespace])
def list_namespaces(skip: int = 0, limit: int = 10, db: Session = Depends(database.get_db)):
    return NamespaceService.get_namespaces(db, skip=skip, limit=limit)


@router.get("/namespaces/{uuid}", response_model=schemas.Namespace)
def get_namespace(uuid: UUID, db: Session = Depends(database.get_db)):
    return NamespaceService.get_namespace(db, uuid)


@router.delete("/namespaces/{uuid}", response_model=dict)
def delete_namespace(uuid: UUID, db: Session = Depends(database.get_db)):
    return NamespaceService.delete_namespace(db, uuid)
