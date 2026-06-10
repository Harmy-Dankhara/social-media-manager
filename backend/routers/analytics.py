from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from core.deps import get_db, get_current_user
from models.user import User
from models.content import Content, ScheduledPost
from models.brand import Brand

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("")
async def get_analytics(
    days: int = 30,
    brand_id: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    since = datetime.utcnow() - timedelta(days=days)

    content_query = db.query(Content).filter(
        Content.user_id == current_user.id,
        Content.created_at >= since,
    )
    if brand_id:
        content_query = content_query.filter(Content.brand_id == brand_id)

    all_content = content_query.all()

    # Posts over time (daily buckets)
    posts_by_day = {}
    for c in all_content:
        day_key = c.created_at.strftime("%Y-%m-%d")
        posts_by_day[day_key] = posts_by_day.get(day_key, 0) + 1

    posts_over_time = [
        {"date": k, "posts": v}
        for k, v in sorted(posts_by_day.items())
    ]

    # Content by platform
    platform_counts = {}
    for c in all_content:
        platform_counts[c.platform] = platform_counts.get(c.platform, 0) + 1

    content_by_platform = [
        {"platform": k, "count": v}
        for k, v in platform_counts.items()
    ]

    # Status breakdown
    status_counts = {}
    for c in all_content:
        status_counts[c.status] = status_counts.get(c.status, 0) + 1

    # Scheduled posts this week
    week_ago = datetime.utcnow() - timedelta(days=7)
    scheduled_this_week = db.query(ScheduledPost).filter(
        ScheduledPost.user_id == current_user.id,
        ScheduledPost.created_at >= week_ago,
    ).count()

    # Total brands
    total_brands = db.query(Brand).filter(Brand.user_id == current_user.id).count()

    # Mock engagement trend (realistic mock data)
    import random
    random.seed(42)
    engagement_trend = []
    for i in range(days):
        date = (datetime.utcnow() - timedelta(days=days - i)).strftime("%Y-%m-%d")
        engagement_trend.append({
            "date": date,
            "engagement": round(2.5 + random.uniform(-0.8, 2.5), 2),
            "reach": random.randint(800, 5000),
            "clicks": random.randint(50, 500),
        })

    # Top performing content (most recent drafts as proxy)
    top_content = content_query.order_by(Content.created_at.desc()).limit(5).all()

    return {
        "summary": {
            "total_posts_generated": len(all_content),
            "posts_scheduled_this_week": scheduled_this_week,
            "avg_engagement_rate": 3.7,
            "active_brands": total_brands,
        },
        "posts_over_time": posts_over_time,
        "content_by_platform": content_by_platform,
        "status_breakdown": status_counts,
        "engagement_trend": engagement_trend,
        "top_content": [
            {
                "id": c.id,
                "platform": c.platform,
                "caption": (c.caption or "")[:120] + "..." if c.caption and len(c.caption) > 120 else c.caption,
                "status": c.status,
                "created_at": c.created_at.isoformat(),
            }
            for c in top_content
        ],
    }
