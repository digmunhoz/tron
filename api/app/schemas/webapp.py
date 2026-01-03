from pydantic import BaseModel, ConfigDict, field_validator, model_validator
from enum import Enum
from typing import List, Any, Dict
from uuid import UUID
from datetime import datetime


class WebappProtocolType(str, Enum):
    http = "http"
    https = "https"
    tcp = "tcp"
    tls = "tls"


class WebappHealthcheckProtocolType(str, Enum):
    http = "http"
    tcp = "tcp"


class WebappEndpoints(BaseModel):
    source_protocol: WebappProtocolType
    source_port: int
    dest_protocol: WebappProtocolType
    dest_port: int

    model_config = ConfigDict(
        from_attributes=True,
    )


class WebappEnvs(BaseModel):
    key: str
    value: str


class WebappSecrets(BaseModel):
    name: str
    key: str


class WebappCustomMetrics(BaseModel):
    enabled: bool = False
    path: str = "/metrics"
    port: int


class WebappHealthcheck(BaseModel):
    path: str = "/healthcheck"
    protocol: WebappHealthcheckProtocolType
    port: int = 80
    timeout: int = 3
    interval: int = 15
    initial_interval: int = 15
    failure_threshold: int = 2


class WebappSettings(BaseModel):
    custom_metrics: WebappCustomMetrics
    endpoints: List[WebappEndpoints]
    envs: List[WebappEnvs] = []
    secrets: List[WebappSecrets] = []
    cpu_scaling_threshold: int = 80
    memory_scaling_threshold: int = 80
    healthcheck: WebappHealthcheck
    cpu: float
    memory: int


class WebappBase(BaseModel):
    name: str

    @field_validator('name')
    @classmethod
    def validate_name_no_spaces(cls, v: str) -> str:
        if ' ' in v:
            raise ValueError("Component name cannot contain spaces")
        return v

    model_config = ConfigDict(
        from_attributes=True,
    )


class WebappCreate(WebappBase):
    instance_uuid: UUID
    name: str
    is_public: bool = False
    url: str
    enabled: bool = True
    settings: WebappSettings


class WebappUpdate(WebappBase):
    name: str | None = None
    is_public: bool | None = None
    url: str | None = None
    enabled: bool | None = None
    settings: WebappSettings | None = None


class Webapp(WebappBase):
    uuid: UUID
    name: str
    is_public: bool
    url: str | None
    enabled: bool
    settings: Dict[str, Any] | None
    created_at: str
    updated_at: str

    @model_validator(mode='before')
    @classmethod
    def convert_datetime_to_string(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if 'created_at' in data and isinstance(data['created_at'], datetime):
                data['created_at'] = data['created_at'].isoformat()
            if 'updated_at' in data and isinstance(data['updated_at'], datetime):
                data['updated_at'] = data['updated_at'].isoformat()
        elif hasattr(data, '__dict__'):
            if hasattr(data, 'created_at') and isinstance(data.created_at, datetime):
                data.created_at = data.created_at.isoformat()
            if hasattr(data, 'updated_at') and isinstance(data.updated_at, datetime):
                data.updated_at = data.updated_at.isoformat()
        return data

    model_config = ConfigDict(
        from_attributes=True,
    )


class Pod(BaseModel):
    name: str
    status: str
    restarts: int
    cpu_requests: float
    cpu_limits: float
    memory_requests: int  # em MB
    memory_limits: int  # em MB
    age_seconds: int
    host_ip: str | None = None


class PodLogs(BaseModel):
    logs: str
    pod_name: str
    container_name: str | None = None


class PodCommandRequest(BaseModel):
    command: list[str]
    container_name: str | None = None


class PodCommandResponse(BaseModel):
    stdout: str
    stderr: str
    return_code: int

