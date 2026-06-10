import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from db.database import Base


class Brand(Base):
    __tablename__ = "brands"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    industry = Column(String, nullable=False)
    website = Column(String, nullable=True)
    description = Column(String, nullable=True)
    target_audience = Column(JSON, nullable=True)
    brand_voice = Column(String, nullable=True)
    rag_status = Column(String, default="pending")  # pending | indexing | ready
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="brands")
    contents = relationship("Content", back_populates="brand", cascade="all, delete-orphan")
    scheduled_posts = relationship("ScheduledPost", back_populates="brand", cascade="all, delete-orphan")
