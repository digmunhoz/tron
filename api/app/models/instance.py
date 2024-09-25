from sqlalchemy import Column, Integer, String, DateTime, UniqueConstraint, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
from sqlalchemy.dialects.postgresql import UUID
from uuid import uuid4


class Instance(Base):
    __tablename__ = "instances"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(UUID(as_uuid=True), default=uuid4, unique=True, nullable=False)

    webapp_deploy_id = Column(Integer, ForeignKey("webapp_deploys.id"), nullable=False)
    webapp_deploy = relationship("WebappDeploy", back_populates="instances")

    cluster_id = Column(Integer, ForeignKey("clusters.id"), nullable=False)
    cluster = relationship("Cluster", back_populates="instances")

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), server_onupdate=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint('cluster_id', 'uuid', name='instance_cluster_uuid'),
    )