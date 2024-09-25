from pydantic import BaseModel
from typing import Optional
from uuid import UUID

from app.schemas.environment import Environment


class ClusterBase(BaseModel):
    name: str
    api_address: str
    token: str


class ClusterCreate(ClusterBase):
    environment_uuid: UUID


class ClusterUpdate(ClusterBase):
    pass


class ClusterResponse(BaseModel):
    uuid: UUID
    name: str
    api_address: str

    class Config:
        from_attributes = True


class ClusterResponseWithValidation(BaseModel):
    uuid: UUID
    name: str
    api_address: str
    environment: Environment
    detail: dict

    class Config:
        from_attributes = True


class ClusterCompletedResponse(BaseModel):
    uuid: UUID
    name: str
    api_address: str
    available_cpu: Optional[int]
    available_memory: Optional[int]
    environment: Environment

    class Config:
        from_attributes = True


class Cluster(ClusterBase):
    uuid: UUID

    class Config:
        from_attributes = True
