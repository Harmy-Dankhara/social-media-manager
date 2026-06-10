from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any


class TargetAudience(BaseModel):
    age_range: Optional[str] = None
    interests: Optional[List[str]] = None
    location: Optional[str] = None


class BrandCreate(BaseModel):
    name: str
    industry: str
    website: Optional[str] = None
    description: Optional[str] = None
    target_audience: Optional[TargetAudience] = None
    brand_voice: Optional[str] = None


class BrandUpdate(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    target_audience: Optional[TargetAudience] = None
    brand_voice: Optional[str] = None


class BrandOut(BaseModel):
    id: str
    user_id: str
    name: str
    industry: str
    website: Optional[str] = None
    description: Optional[str] = None
    target_audience: Optional[Dict[str, Any]] = None
    brand_voice: Optional[str] = None
    rag_status: str
    created_at: datetime

    class Config:
        from_attributes = True
