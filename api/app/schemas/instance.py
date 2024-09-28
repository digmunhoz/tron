from pydantic import BaseModel, ConfigDict
from uuid import UUID

from app.schemas.cluster import ClusterResponse
from app.schemas.webapp_deploy import WebappDeployReducedResponse


class InstanceBase(BaseModel):
    uuid: UUID


class InstanceCreate(BaseModel):
    cluster_uuid: UUID
    webapp_deploy_uuid: UUID

    model_config = ConfigDict(
        from_attributes=True,
    )


class Instance(InstanceBase):
    cluster: ClusterResponse
    webapp_deploy: WebappDeployReducedResponse

    model_config = ConfigDict(
        from_attributes=True,
    )
