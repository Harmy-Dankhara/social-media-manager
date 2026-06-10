from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.deps import get_db, get_current_user
from models.user import User
from models.competitor import Competitor
from schemas.competitor import CompetitorCreate, CompetitorOut
from agents.competitor_agent import run_competitor_agent

router = APIRouter(prefix="/api/competitors", tags=["competitors"])


@router.post("", response_model=CompetitorOut, status_code=status.HTTP_201_CREATED)
async def analyze_competitor(
    competitor_data: CompetitorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Run the competitor analysis agent
    analysis_result = await run_competitor_agent(
        name=competitor_data.name,
        website=competitor_data.website,
        industry=competitor_data.industry,
        notes=competitor_data.notes,
        user_gemini_api_key=current_user.gemini_api_key,
    )

    # Save to database
    competitor = Competitor(
        user_id=current_user.id,
        name=competitor_data.name,
        website=competitor_data.website,
        industry=competitor_data.industry,
        notes=competitor_data.notes,
        analysis=analysis_result,
    )
    db.add(competitor)
    db.commit()
    db.refresh(competitor)

    return competitor


@router.get("", response_model=List[CompetitorOut])
async def list_competitors(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    competitors = (
        db.query(Competitor)
        .filter(Competitor.user_id == current_user.id)
        .order_by(Competitor.created_at.desc())
        .all()
    )
    return competitors


@router.get("/{competitor_id}", response_model=CompetitorOut)
async def get_competitor(
    competitor_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    competitor = (
        db.query(Competitor)
        .filter(Competitor.id == competitor_id, Competitor.user_id == current_user.id)
        .first()
    )
    if not competitor:
        raise HTTPException(status_code=404, detail="Competitor not found")
    return competitor


@router.delete("/{competitor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_competitor(
    competitor_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    competitor = (
        db.query(Competitor)
        .filter(Competitor.id == competitor_id, Competitor.user_id == current_user.id)
        .first()
    )
    if not competitor:
        raise HTTPException(status_code=404, detail="Competitor not found")
    db.delete(competitor)
    db.commit()
