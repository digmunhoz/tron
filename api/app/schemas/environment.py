from pydantic import BaseModel
from uuid import UUID


class EnvironmentBase(BaseModel):
    name: str

class EnvironmentCreate(EnvironmentBase):
    pass

class Environment(EnvironmentBase):
    uuid: UUID

    class Config:
        from_attributes = True

class EnvironmentWithClusters(Environment):
    name: str
    clusters: list

    class Config:
        from_attributes = True