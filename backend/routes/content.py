from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from lib.groq import generate_content_item
from models import ContentItem
from schemas import ContentCreate, ContentGenerateRequest, ContentResponse

router = APIRouter(prefix="/content", tags=["content"])


@router.get("", response_model=list[ContentResponse])
async def list_content(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(ContentItem).order_by(ContentItem.created_at.desc()))
        return result.scalars().all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch content: {str(e)}")


@router.post("", response_model=ContentResponse, status_code=201)
async def create_content(payload: ContentCreate, db: AsyncSession = Depends(get_db)):
    try:
        item = ContentItem(
            client_id=payload.client_id,
            type=payload.type,
            title=payload.title,
            content=payload.content,
            status=payload.status,
            version=payload.version,
        )
        db.add(item)
        await db.flush()
        await db.refresh(item)
        return item
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create content: {str(e)}")


@router.post("/generate", response_model=ContentResponse, status_code=201)
async def generate_content(payload: ContentGenerateRequest, db: AsyncSession = Depends(get_db)):
    try:
        content_text = generate_content_item(
            payload.type,
            payload.topic,
            payload.client_name or "",
        )
        title = payload.title or f"{payload.type.title()}: {payload.topic[:50]}"

        item = ContentItem(
            client_id=payload.client_id,
            type=payload.type,
            title=title,
            content=content_text,
            status="pending_approval",
            version=1,
        )
        db.add(item)
        await db.flush()
        await db.refresh(item)
        return item
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate content: {str(e)}")


@router.put("/{content_id}/status", response_model=ContentResponse)
async def update_content_status(content_id: UUID, status: str, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(ContentItem).where(ContentItem.id == content_id))
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Content not found")
        item.status = status
        await db.flush()
        await db.refresh(item)
        return item
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update content: {str(e)}")
