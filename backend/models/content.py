import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, JSON, ForeignKey, Text
from sqlalchemy.orm import relationship
from db.database import Base


class Content(Base):
    __tablename__ = "content"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    brand_id = Column(String, ForeignKey("brands.id"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    platform = Column(String, nullable=False)   # instagram | linkedin | twitter | facebook
    content_type = Column(String, nullable=False)  # post | carousel | story | thread
    caption = Column(Text, nullable=True)
    hashtags = Column(JSON, nullable=True)       # list of strings
    emojis = Column(JSON, nullable=True)         # list of emoji strings
    topic = Column(String, nullable=True)
    status = Column(String, default="draft")     # draft | scheduled | posted
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="contents")
    brand = relationship("Brand", back_populates="contents")
    scheduled_post = relationship("ScheduledPost", back_populates="content", uselist=False)


class ScheduledPost(Base):
    __tablename__ = "scheduled_posts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    content_id = Column(String, ForeignKey("content.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    brand_id = Column(String, ForeignKey("brands.id"), nullable=False)
    platform = Column(String, nullable=False)
    scheduled_at = Column(DateTime, nullable=False)
    status = Column(String, default="scheduled")  # scheduled | posted | cancelled
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    content = relationship("Content", back_populates="scheduled_post")
    user = relationship("User", back_populates="scheduled_posts")
    brand = relationship("Brand", back_populates="scheduled_posts")
