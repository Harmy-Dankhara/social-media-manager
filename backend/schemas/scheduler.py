from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ScheduleCreate(BaseModel):
    content_id: str
    brand_id: str
    platform: str
    scheduled_at: datetime


class ScheduleUpdate(BaseModel):
    scheduled_at: Optional[datetime] = None
    status: Optional[str] = None


class ScheduleOut(BaseModel):
    id: str
    content_id: str
    user_id: str
    brand_id: str
    platform: str
    scheduled_at: datetime
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
