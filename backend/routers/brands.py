import asyncio
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from core.deps import get_db, get_current_user
from models.user import User
from models.brand import Brand
from schemas.brand import BrandCreate, BrandOut, BrandUpdate
from agents.rag_pipeline import ingest_brand_document

router = APIRouter(prefix="/api/brands", tags=["brands"])


@router.post("", response_model=BrandOut, status_code=status.HTTP_201_CREATED)
async def create_brand(
    brand_data: BrandCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    brand = Brand(
        user_id=current_user.id,
        name=brand_data.name,
        industry=brand_data.industry,
        website=brand_data.website,
        description=brand_data.description,
        target_audience=brand_data.target_audience.model_dump() if brand_data.target_audience else None,
        brand_voice=brand_data.brand_voice,
        rag_status="pending",
    )
    db.add(brand)
    db.commit()
    db.refresh(brand)
    
    # Auto-ingest brand description as initial RAG doc
    if brand_data.description:
        asyncio.create_task(
            _ingest_brand_description(brand.id, brand_data.name, brand_data.description, brand_data.brand_voice)
        )
    
    return brand


async def _ingest_brand_description(brand_id: str, name: str, description: str, voice: Optional[str]):
    doc_text = f"""
Brand Name: {name}
Brand Description: {description}
Brand Voice: {voice or 'Professional and engaging'}
Guidelines: Create content that reflects our brand values and resonates with our target audience.
"""
    await ingest_brand_document(brand_id=brand_id, doc_content=doc_text, doc_type="brand_basics")


@router.post("/{brand_id}/upload-doc")
async def upload_brand_doc(
    brand_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    brand = db.query(Brand).filter(
        Brand.id == brand_id, Brand.user_id == current_user.id
    ).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    # Update status to indexing
    brand.rag_status = "indexing"
    db.commit()
    
    file_bytes = await file.read()
    filename = file.filename or ""
    is_pdf = filename.lower().endswith(".pdf")
    
    # Background ingestion
    async def do_ingest():
        try:
            success = await ingest_brand_document(
                brand_id=brand_id,
                doc_content="" if is_pdf else file_bytes.decode("utf-8", errors="ignore"),
                doc_type="uploaded_doc",
                is_pdf=is_pdf,
                file_bytes=file_bytes if is_pdf else None,
            )
            # Re-fetch brand and update status
            from db.database import SessionLocal
            with SessionLocal() as new_db:
                b = new_db.query(Brand).filter(Brand.id == brand_id).first()
                if b:
                    b.rag_status = "ready" if success else "error"
                    new_db.commit()
        except Exception as e:
            from db.database import SessionLocal
            with SessionLocal() as new_db:
                b = new_db.query(Brand).filter(Brand.id == brand_id).first()
                if b:
                    b.rag_status = "error"
                    new_db.commit()
    
    asyncio.create_task(do_ingest())
    
    return {"message": "Document upload started", "brand_id": brand_id, "status": "indexing"}


@router.get("", response_model=List[BrandOut])
async def list_brands(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    brands = db.query(Brand).filter(Brand.user_id == current_user.id).all()
    return brands


@router.get("/{brand_id}", response_model=BrandOut)
async def get_brand(
    brand_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    brand = db.query(Brand).filter(
        Brand.id == brand_id, Brand.user_id == current_user.id
    ).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    return brand


@router.put("/{brand_id}", response_model=BrandOut)
async def update_brand(
    brand_id: str,
    brand_data: BrandUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    brand = db.query(Brand).filter(
        Brand.id == brand_id, Brand.user_id == current_user.id
    ).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    update_data = brand_data.model_dump(exclude_unset=True)
    if "target_audience" in update_data and update_data["target_audience"]:
        update_data["target_audience"] = update_data["target_audience"]
    
    for field, value in update_data.items():
        setattr(brand, field, value)
    
    db.commit()
    db.refresh(brand)
    return brand


@router.delete("/{brand_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_brand(
    brand_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    brand = db.query(Brand).filter(
        Brand.id == brand_id, Brand.user_id == current_user.id
    ).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    db.delete(brand)
    db.commit()
