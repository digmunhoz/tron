from pydantic import BaseModel, ConfigDict
from uuid import UUID


class EnvironmentBase(BaseModel):
    name: str


class EnvironmentCreate(EnvironmentBase):
    pass


class Environment(EnvironmentBase):
    uuid: UUID

    model_config = ConfigDict(
        from_attributes=True,
    )


class EnvironmentWithClusters(Environment):
    name: str
    clusters: list
    settings: list

    model_config = ConfigDict(
        from_attributes=True,
    )