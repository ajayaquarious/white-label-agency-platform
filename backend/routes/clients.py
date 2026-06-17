from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Client
from schemas import ClientCreate, ClientResponse, ClientUpdate

router = APIRouter(prefix="/clients", tags=["clients"])

DEFAULT_ONBOARDING_STEPS = [
    {"step": "Intake Form", "status": "completed", "order": 1},
    {"step": "Contract Signed", "status": "pending", "order": 2},
    {"step": "Brand Guidelines", "status": "pending", "order": 3},
    {"step": "Project Folder Created", "status": "pending", "order": 4},
    {"step": "Kickoff Meeting", "status": "pending", "order": 5},
]


@router.get("", response_model=list[ClientResponse])
async def list_clients(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Client).order_by(Client.created_at.desc()))
        return result.scalars().all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch clients: {str(e)}")


@router.post("", response_model=ClientResponse, status_code=201)
async def create_client(payload: ClientCreate, db: AsyncSession = Depends(get_db)):
    try:
        steps = payload.onboarding_steps or DEFAULT_ONBOARDING_STEPS
        client = Client(
            name=payload.name,
            email=payload.email,
            company=payload.company,
            budget=payload.budget,
            onboarding_status=payload.onboarding_status,
            documents=payload.documents,
            onboarding_steps=steps,
        )
        db.add(client)
        await db.flush()
        await db.refresh(client)
        return client
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create client: {str(e)}")


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(client_id: UUID, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Client).where(Client.id == client_id))
        client = result.scalar_one_or_none()
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")
        return client
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch client: {str(e)}")


@router.put("/{client_id}", response_model=ClientResponse)
async def update_client(client_id: UUID, payload: ClientUpdate, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Client).where(Client.id == client_id))
        client = result.scalar_one_or_none()
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")

        update_data = payload.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(client, key, value)

        await db.flush()
        await db.refresh(client)
        return client
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update client: {str(e)}")
