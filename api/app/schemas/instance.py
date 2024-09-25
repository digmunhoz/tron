from pydantic import BaseModel
from uuid import UUID

from app.schemas.cluster import ClusterResponse
from app.schemas.webapp_deploy import WebappDeployReducedResponse

class InstanceBase(BaseModel):
    uuid: UUID

class InstanceCreate(BaseModel):
    cluster_uuid: UUID
    webapp_deploy_uuid: UUID

    class Config:
        from_attributes = True


class Instance(InstanceBase):
    cluster: ClusterResponse
    webapp_deploy: WebappDeployReducedResponse

    class Config:
        from_attributes = True