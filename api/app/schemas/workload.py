from pydantic import BaseModel
from uuid import UUID

class WorkloadBase(BaseModel):
    name: str

class WorkloadCreate(WorkloadBase):
    pass

class Workload(WorkloadBase):
    uuid: UUID

    class Config:
        from_attributes = True
