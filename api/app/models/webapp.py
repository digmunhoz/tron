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


class Webapp(Base):
    __tablename__ = "webapps"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(UUID(as_uuid=True), default=uuid4, unique=True, nullable=False)
    name = Column(String, index=True)

    namespace_id = Column(Integer, ForeignKey("namespaces.id"))
    namespace = relationship("Namespace", back_populates="webapps")

    private = Column(Boolean, nullable=False, default=True)

    webapp_deploys = relationship("WebappDeploy", back_populates="webapp", cascade="all, delete-orphan")

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), server_onupdate=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint('namespace_id', 'name', name='uix_namespace_name'),
    )
