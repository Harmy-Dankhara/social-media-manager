from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any


class CompetitorCreate(BaseModel):
    name: str
    website: Optional[str] = None
    industry: Optional[str] = None
    notes: Optional[str] = None


class CompetitorOut(BaseModel):
    id: str
    user_id: str
    name: str
    website: Optional[str] = None
    industry: Optional[str] = None
    notes: Optional[str] = None
    analysis: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True
