import logging
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from db.database import SessionLocal
from models.content import ScheduledPost, Content

logger = logging.getLogger(__name__)

# Initialize background scheduler with UTC timezone
scheduler = BackgroundScheduler(timezone="UTC")


def publish_scheduled_post(schedule_id: str):
    """Callback to execute when a scheduled post's time arrives."""
    logger.info(f"⏰ Executing scheduled post job: {schedule_id}")
    db: Session = SessionLocal()
    try:
        scheduled = db.query(ScheduledPost).filter(ScheduledPost.id == schedule_id).first()
        if not scheduled:
            logger.warning(f"Scheduled post {schedule_id} not found in DB.")
            return
        
        if scheduled.status != "scheduled":
            logger.info(f"Scheduled post {schedule_id} is already in status: {scheduled.status}")
            return
            
        content = db.query(Content).filter(Content.id == scheduled.content_id).first()
        if content:
            content.status = "posted"
            
        scheduled.status = "posted"
        db.commit()
        logger.info(f"✅ Successfully published post {schedule_id}!")
    except Exception as e:
        logger.error(f"❌ Error publishing scheduled post {schedule_id}: {e}")
        db.rollback()
    finally:
        db.close()


def start_scheduler():
    """Start APScheduler and load pending scheduled posts from DB on startup."""
    if not scheduler.running:
        scheduler.start()
        logger.info("📅 APScheduler started successfully")
        
        # Load any existing pending scheduled posts from DB
        db = SessionLocal()
        try:
            pending = db.query(ScheduledPost).filter(ScheduledPost.status == "scheduled").all()
            count = 0
            for post in pending:
                run_time = post.scheduled_at
                scheduler.add_job(
                    publish_scheduled_post,
                    'date',
                    run_date=run_time,
                    args=[post.id],
                    id=f"post_{post.id}",
                    replace_existing=True
                )
                count += 1
            if count > 0:
                logger.info(f"Loaded {count} pending scheduled jobs into APScheduler")
        except Exception as e:
            logger.error(f"Error loading pending jobs into APScheduler: {e}")
        finally:
            db.close()


def schedule_post_job(post_id: str, run_date: datetime):
    """Add a new scheduled post job to APScheduler."""
    scheduler.add_job(
        publish_scheduled_post,
        'date',
        run_date=run_date,
        args=[post_id],
        id=f"post_{post_id}",
        replace_existing=True
    )
    logger.info(f"Added scheduled job for post {post_id} at {run_date}")


def cancel_post_job(post_id: str):
    """Cancel a scheduled post job in APScheduler."""
    try:
        scheduler.remove_job(f"post_{post_id}")
        logger.info(f"Cancelled scheduled job for post {post_id}")
    except Exception:
        pass
