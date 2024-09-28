from pydantic import BaseModel, conint
from enum import Enum
from typing import List
from uuid import UUID
from app.schemas.webapp import WebappReducedResponse
from app.schemas.environment import Environment
from app.schemas.workload import Workload


class WebappDeployProtocolType(str, Enum):
    http = "http"
    https = "https"
    tcp = "tcp"
    tls = "tls"


class WebappDeployHealthcheckProtocolType(str, Enum):
    http = "http"
    tcp = "tcp"


class WebappDeployEndpoints(BaseModel):
    source_protocol: WebappDeployProtocolType
    source_port: int
    dest_protocol: WebappDeployProtocolType
    dest_port: int

    class Config:
        from_attributes = True


class WebappDeployEnvs(BaseModel):
    key: str
    value: str


class WebappDeploySecrets(BaseModel):
    name: str
    key: str


class WebappDeployCustromMetrics(BaseModel):
    enabled: bool = False
    path: str = "/metrics"
    port: int


class WebappDeployHealthcheck(BaseModel):
    path: str = "/healthcheck"
    protocol: WebappDeployHealthcheckProtocolType
    port: conint(ge=1, le=65535) = 80
    timeout: int = 3
    interval: int = 15
    initial_interval: int = 15
    failure_threshold: int = 2


class WebappDeploy(BaseModel):

    class Config:
        from_attributes = True


class WebappDeployCreate(WebappDeploy):
    webapp_uuid: UUID
    image: str
    version: str
    workload_uuid: UUID
    environment_uuid: UUID
    custom_metrics: WebappDeployCustromMetrics
    endpoints: List[WebappDeployEndpoints]
    envs: List[WebappDeployEnvs]
    secrets: List[WebappDeploySecrets]
    cpu_scaling_threshold: conint(ge=0, le=100) = 80
    memory_scaling_threshold: conint(ge=0, le=100) = 80
    healthcheck: WebappDeployHealthcheck


class WebappDeployUpdate(WebappDeploy):
    image: str
    version: str
    workload_uuid: UUID
    custom_metrics: WebappDeployCustromMetrics
    endpoints: List[WebappDeployEndpoints]
    envs: List[WebappDeployEnvs]
    secrets: List[WebappDeploySecrets]
    cpu_scaling_threshold: conint(ge=0, le=100) = 80
    memory_scaling_threshold: conint(ge=0, le=100) = 80
    healthcheck: WebappDeployHealthcheck


class WebappDeployCompletedResponse(WebappDeploy):
    uuid: UUID
    webapp: WebappReducedResponse
    workload: Workload
    image: str
    version: str
    custom_metrics: WebappDeployCustromMetrics
    endpoints: List[WebappDeployEndpoints]
    envs: List[WebappDeployEnvs]
    secrets: List[WebappDeploySecrets]
    cpu_scaling_threshold: conint(ge=0, le=100) = 80
    memory_scaling_threshold: conint(ge=0, le=100) = 80
    healthcheck: WebappDeployHealthcheck

    class Config:
        from_attributes = True
        from_orm = True


class WebappDeployReducedResponse(WebappDeploy):
    uuid: UUID
    workload: Workload
    webapp: WebappReducedResponse
    environment: Environment

    class Config:
        from_attributes = True
