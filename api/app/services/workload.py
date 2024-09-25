from fastapi import HTTPException

import app.models.workload as WorkloadModel
import app.models.webapp as WebappModel
import app.schemas.workload as WorkloadSchema

from sqlalchemy.orm import Session
from uuid import uuid4
from uuid import UUID


class WorkloadService:
    def upsert_workload(db: Session, workload: WorkloadSchema.WorkloadCreate, workload_uuid: UUID = None):

        if workload_uuid:
            db_workload = db.query(WorkloadModel.Workload).filter(WorkloadModel.Workload.uuid == workload_uuid).first()
            if db_workload:
                db_workload.name = workload.name
                db.commit()
                db.refresh(db_workload)
                return db_workload

        new_workload = WorkloadModel.Workload(
            uuid=uuid4(),
            name=workload.name,
        )
        db.add(new_workload)
        db.commit()
        db.refresh(new_workload)
        return new_workload

    def get_workload(db: Session, workload_uuid: int):
        return db.query(WorkloadModel.Workload).filter(WorkloadModel.Workload.id == workload_uuid).first()

    def get_workloads(db: Session, skip: int = 0, limit: int = 10):
        return db.query(WorkloadModel.Workload).offset(skip).limit(limit).all()

    def delete_workload(db: Session, workload_uuid: UUID):

        db_workload = db.query(WorkloadModel.Workload).filter(WorkloadModel.Workload.uuid == workload_uuid).first()
        if db_workload is None:
            raise HTTPException(status_code=404, detail="Workload not found")

        associated_webapps = db.query(WebappModel.Webapp).filter(WebappModel.Webapp.workload_id == db_workload.id).all()
        if associated_webapps:
            raise HTTPException(status_code=400, detail="Cannot delete workload with associated webapps")

        db.delete(db_workload)
        db.commit()
        return {"detail": "Workload deleted successfully"}
