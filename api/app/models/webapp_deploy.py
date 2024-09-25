import enum
from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Enum, UniqueConstraint, JSON, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from uuid import uuid4
from app.database import Base


class WebappProtocolType(str, enum.Enum):
    http = "http"
    https = "https"
    tcp = "tcp"
    tls = "tls"


class WebappDeploy(Base):
    __tablename__ = "webapp_deploys"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(UUID(as_uuid=True), default=uuid4, unique=True, nullable=False)

    image = Column(String)
    version = Column(String)

    webapp_id = Column(Integer, ForeignKey("webapps.id"), nullable=False)
    webapp = relationship("Webapp", back_populates="webapp_deploys")

    workload_id = Column(Integer, ForeignKey("workloads.id"), nullable=False)
    workload = relationship("Workload", back_populates="webapp_deploys")

    environment_id = Column(Integer, ForeignKey("environments.id"), nullable=False)
    environment = relationship("Environment", back_populates="webapp_deploys")

    cpu_scaling_threshold = Column(Integer, default=80)
    memory_scaling_threshold = Column(Integer, default=80)

    custom_metrics = Column(JSON, nullable=False)
    endpoints = Column(JSON, nullable=False)
    envs = Column(JSON, nullable=True)
    secrets = Column(JSON, nullable=True)

    instances = relationship("Instance", back_populates="webapp_deploy")

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), server_onupdate=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint('environment_id', 'uuid', name='uix_environment_uuid'),
    )