from pydantic import BaseModel
from uuid import UUID


class NamespaceBase(BaseModel):
    name: str

class NamespaceCreate(NamespaceBase):
    pass

class Namespace(NamespaceBase):
    uuid: UUID

    class Config:
        from_attributes = True
