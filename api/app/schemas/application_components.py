from pydantic import BaseModel, ConfigDict, model_validator, field_validator
from enum import Enum
from typing import Any, Dict
from uuid import UUID
from datetime import datetime


class WebappType(str, Enum):
    webapp = "webapp"
    worker = "worker"
    cron = "cron"


class ApplicationComponent(BaseModel):
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


class ApplicationComponentCreate(ApplicationComponent):
    instance_uuid: UUID
    name: str
    type: WebappType = WebappType.webapp
    settings: Dict[str, Any] | None = None
    is_public: bool = False
    url: str | None = None
    enabled: bool = True


class ApplicationComponentUpdate(ApplicationComponent):
    name: str | None = None
    type: WebappType | None = None
    settings: Dict[str, Any] | None = None
    is_public: bool | None = None
    url: str | None = None
    enabled: bool | None = None


class ApplicationComponentCompletedResponse(ApplicationComponent):
    uuid: UUID
    name: str
    type: WebappType
    settings: Dict[str, Any] | None
    is_public: bool
    url: str | None
    enabled: bool
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


class ApplicationComponentReducedResponse(ApplicationComponent):
    uuid: UUID
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

