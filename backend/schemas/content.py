from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class ContentCreate(BaseModel):
    brand_id: str
    platform: str
    content_type: str
    caption: Optional[str] = None
    hashtags: Optional[List[str]] = None
    emojis: Optional[List[str]] = None
    topic: Optional[str] = None


class ContentUpdate(BaseModel):
    caption: Optional[str] = None
    hashtags: Optional[List[str]] = None
    emojis: Optional[List[str]] = None
    status: Optional[str] = None


class ContentOut(BaseModel):
    id: str
    brand_id: str
    user_id: str
    platform: str
    content_type: str
    caption: Optional[str] = None
    hashtags: Optional[List[str]] = None
    emojis: Optional[List[str]] = None
    topic: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class GenerateRequest(BaseModel):
    brand_id: str
    platforms: List[str]
    content_type: str
    topic: str
    num_posts: int = 3
