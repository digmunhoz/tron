from pydantic import BaseModel, conint, ConfigDict
from enum import Enum
from typing import List
from uuid import UUID
from app.schemas.namespace import Namespace


class Webapp(BaseModel):
    name: str

    model_config = ConfigDict(
        from_attributes=True,
    )


class WebappProtocolType(str, Enum):
    http = "http"
    https = "https"
    tcp = "tcp"
    tls = "tls"


class WebappEndpoints(BaseModel):
    source_protocol: WebappProtocolType
    source_port: int
    dest_protocol: WebappProtocolType
    dest_port: int


class WebappEnvs(BaseModel):
    key: str
    value: str


class WebappSecrets(BaseModel):
    name: str
    key: str


class WebappCustromMetrics(BaseModel):
    enabled: bool = False
    path: str
    port: int


class WebappCreate(Webapp):
    private: bool
    namespace_uuid: UUID


class WebappCompletedResponse(Webapp):
    private: bool
    uuid: UUID
    namespace: Namespace
    webapp_deploy: list

    model_config = ConfigDict(
        from_attributes=True,
    )


class WebappReducedResponse(Webapp):
    uuid: UUID
    private: bool
    namespace: Namespace

    model_config = ConfigDict(
        from_attributes=True,
    )
