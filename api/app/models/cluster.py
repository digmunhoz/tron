from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
from sqlalchemy.dialects.postgresql import UUID
from uuid import uuid4

class Cluster(Base):
    __tablename__ = "clusters"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(UUID(as_uuid=True), default=uuid4, unique=True, nullable=False)
    name = Column(String, unique=True, index=True, nullable=False)
    api_address = Column(String, unique=True, nullable=False)
    token = Column(String, nullable=False)

    environment_id = Column(Integer, ForeignKey("environments.id"), nullable=False)
    environment = relationship("Environment", back_populates="clusters")

    instances = relationship("Instance", back_populates="cluster")

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), server_onupdate=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint('uuid', name='uix_cluster_uuid'),
    )