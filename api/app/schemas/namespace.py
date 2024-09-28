from pydantic import BaseModel, ConfigDict
from uuid import UUID


class NamespaceBase(BaseModel):
    name: str


class NamespaceCreate(NamespaceBase):
    pass


class Namespace(NamespaceBase):
    uuid: UUID

    model_config = ConfigDict(
        from_attributes=True,
    )
