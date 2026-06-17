from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from lib.groq import generate_proposal_content
from models import Proposal
from schemas import ProposalCreate, ProposalGenerateRequest, ProposalResponse

router = APIRouter(prefix="/proposals", tags=["proposals"])


@router.get("", response_model=list[ProposalResponse])
async def list_proposals(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Proposal).order_by(Proposal.created_at.desc()))
        return result.scalars().all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch proposals: {str(e)}")


@router.post("", response_model=ProposalResponse, status_code=201)
async def create_proposal(payload: ProposalCreate, db: AsyncSession = Depends(get_db)):
    try:
        proposal = Proposal(
            client_id=payload.client_id,
            title=payload.title,
            content=payload.content,
            budget=payload.budget,
            timeline=payload.timeline,
            services=payload.services,
            status=payload.status,
        )
        db.add(proposal)
        await db.flush()
        await db.refresh(proposal)
        return proposal
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create proposal: {str(e)}")


@router.post("/generate", response_model=ProposalResponse, status_code=201)
async def generate_proposal(payload: ProposalGenerateRequest, db: AsyncSession = Depends(get_db)):
    try:
        content = generate_proposal_content(payload.model_dump())
        title = payload.title or f"Proposal for {payload.client_name}"

        proposal = Proposal(
            client_id=payload.client_id,
            title=title,
            content=content,
            budget=payload.budget,
            timeline=payload.timeline,
            services=payload.services,
            status="generated",
        )
        db.add(proposal)
        await db.flush()
        await db.refresh(proposal)
        return proposal
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate proposal: {str(e)}")


@router.get("/{proposal_id}", response_model=ProposalResponse)
async def get_proposal(proposal_id: UUID, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Proposal).where(Proposal.id == proposal_id))
        proposal = result.scalar_one_or_none()
        if not proposal:
            raise HTTPException(status_code=404, detail="Proposal not found")
        return proposal
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch proposal: {str(e)}")
