import asyncio
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session

from core.deps import get_db, get_current_user
from core.websocket_manager import manager as ws_manager
from models.user import User
from models.brand import Brand
from models.content import Content
from schemas.content import ContentCreate, ContentOut, ContentUpdate, GenerateRequest
from agents.social_agent import run_social_agent

router = APIRouter(prefix="/api/content", tags=["content"])


@router.post("/generate", status_code=status.HTTP_202_ACCEPTED)
async def generate_content(
    request: GenerateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Trigger LangGraph agent to generate content. Results streamed via WebSocket."""
    brand = db.query(Brand).filter(
        Brand.id == request.brand_id, Brand.user_id == current_user.id
    ).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    user_id = current_user.id
    brand_id = request.brand_id
    brand_name = brand.name
    brand_industry = brand.industry

    async def run_agent_and_save():
        try:
            posts = await run_social_agent(
                brand_id=brand_id,
                brand_name=brand_name,
                brand_industry=brand_industry,
                platforms=request.platforms,
                content_type=request.content_type,
                topic=request.topic,
                num_posts=request.num_posts,
                user_id=user_id,
                websocket_manager=ws_manager,
            )
            # Persist generated posts to DB
            from db.database import SessionLocal
            with SessionLocal() as new_db:
                for post in posts:
                    content = Content(
                        id=post.get("id"),
                        brand_id=brand_id,
                        user_id=user_id,
                        platform=post.get("platform", "instagram"),
                        content_type=request.content_type,
                        caption=post.get("caption", ""),
                        hashtags=post.get("hashtags", []),
                        emojis=post.get("emojis", []),
                        topic=request.topic,
                        status="draft",
                    )
                    new_db.add(content)
                new_db.commit()
        except Exception as e:
            await ws_manager.send_to_user(user_id, {
                "type": "error",
                "message": f"Generation failed: {str(e)}",
            })

    background_tasks.add_task(run_agent_and_save)

    return {"message": "Content generation started", "status": "processing"}


@router.get("", response_model=List[ContentOut])
async def list_content(
    brand_id: str = None,
    platform: str = None,
    status: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Content).filter(Content.user_id == current_user.id)
    if brand_id:
        query = query.filter(Content.brand_id == brand_id)
    if platform:
        query = query.filter(Content.platform == platform)
    if status:
        query = query.filter(Content.status == status)
    return query.order_by(Content.created_at.desc()).all()


@router.get("/{content_id}", response_model=ContentOut)
async def get_content(
    content_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    content = db.query(Content).filter(
        Content.id == content_id, Content.user_id == current_user.id
    ).first()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    return content


@router.put("/{content_id}", response_model=ContentOut)
async def update_content(
    content_id: str,
    content_data: ContentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    content = db.query(Content).filter(
        Content.id == content_id, Content.user_id == current_user.id
    ).first()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    for field, value in content_data.model_dump(exclude_unset=True).items():
        setattr(content, field, value)

    db.commit()
    db.refresh(content)
    return content


@router.delete("/{content_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_content(
    content_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    content = db.query(Content).filter(
        Content.id == content_id, Content.user_id == current_user.id
    ).first()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    db.delete(content)
    db.commit()
