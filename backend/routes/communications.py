from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Communication
from schemas import CommunicationCreate, CommunicationResponse

router = APIRouter(prefix="/communications", tags=["communications"])


@router.get("", response_model=list[CommunicationResponse])
async def list_communications(
    client_id: UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    try:
        query = select(Communication).order_by(Communication.timestamp.desc())
        if client_id:
            query = query.where(Communication.client_id == client_id)
        result = await db.execute(query)
        return result.scalars().all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch communications: {str(e)}")


@router.post("", response_model=CommunicationResponse, status_code=201)
async def add_communication(payload: CommunicationCreate, db: AsyncSession = Depends(get_db)):
    try:
        comm = Communication(
            client_id=payload.client_id,
            message_type=payload.message_type,
            content=payload.content,
            notes=payload.notes,
        )
        db.add(comm)
        await db.flush()
        await db.refresh(comm)
        return comm
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add communication: {str(e)}")
