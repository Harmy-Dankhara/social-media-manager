import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.deps import get_db, get_current_user
from models.user import User
from models.content import Content, ScheduledPost
from schemas.scheduler import ScheduleCreate, ScheduleOut, ScheduleUpdate

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/scheduler", tags=["scheduler"])


@router.post("", response_model=ScheduleOut, status_code=status.HTTP_201_CREATED)
async def schedule_post(
    schedule_data: ScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate content belongs to user
    content = db.query(Content).filter(
        Content.id == schedule_data.content_id,
        Content.user_id == current_user.id,
    ).first()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    # Check if already scheduled
    existing = db.query(ScheduledPost).filter(
        ScheduledPost.content_id == schedule_data.content_id,
        ScheduledPost.status == "scheduled",
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Post is already scheduled")

    scheduled = ScheduledPost(
        content_id=schedule_data.content_id,
        user_id=current_user.id,
        brand_id=schedule_data.brand_id,
        platform=schedule_data.platform,
        scheduled_at=schedule_data.scheduled_at,
        status="scheduled",
    )
    db.add(scheduled)

    # Update content status
    content.status = "scheduled"
    db.commit()
    db.refresh(scheduled)

    # Schedule background job in APScheduler
    try:
        from core.scheduler import schedule_post_job
        schedule_post_job(scheduled.id, scheduled.scheduled_at)
    except Exception as e:
        logger.error(f"Failed to schedule job in APScheduler: {e}")

    return scheduled


@router.get("", response_model=List[ScheduleOut])
async def list_scheduled(
    brand_id: str = None,
    status: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(ScheduledPost).filter(ScheduledPost.user_id == current_user.id)
    if brand_id:
        query = query.filter(ScheduledPost.brand_id == brand_id)
    if status:
        query = query.filter(ScheduledPost.status == status)
    else:
        query = query.filter(ScheduledPost.status != "cancelled")
    return query.order_by(ScheduledPost.scheduled_at.asc()).all()


@router.put("/{schedule_id}", response_model=ScheduleOut)
async def update_schedule(
    schedule_id: str,
    schedule_data: ScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    scheduled = db.query(ScheduledPost).filter(
        ScheduledPost.id == schedule_id,
        ScheduledPost.user_id == current_user.id,
    ).first()
    if not scheduled:
        raise HTTPException(status_code=404, detail="Scheduled post not found")

    for field, value in schedule_data.model_dump(exclude_unset=True).items():
        setattr(scheduled, field, value)

    db.commit()
    db.refresh(scheduled)

    # Update background job in APScheduler if time or status was updated
    try:
        from core.scheduler import schedule_post_job, cancel_post_job
        if scheduled.status == "scheduled":
            schedule_post_job(scheduled.id, scheduled.scheduled_at)
        elif scheduled.status == "cancelled":
            cancel_post_job(scheduled.id)
    except Exception as e:
        logger.error(f"Failed to update job in APScheduler: {e}")

    return scheduled


@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_schedule(
    schedule_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    scheduled = db.query(ScheduledPost).filter(
        ScheduledPost.id == schedule_id,
        ScheduledPost.user_id == current_user.id,
    ).first()
    if not scheduled:
        raise HTTPException(status_code=404, detail="Scheduled post not found")

    # Revert content status
    content = db.query(Content).filter(Content.id == scheduled.content_id).first()
    if content:
        content.status = "draft"

    scheduled.status = "cancelled"
    db.commit()

    # Cancel background job in APScheduler
    try:
        from core.scheduler import cancel_post_job
        cancel_post_job(schedule_id)
    except Exception as e:
        logger.error(f"Failed to cancel job in APScheduler: {e}")
