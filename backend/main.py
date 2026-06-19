import asyncio
import os
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from fastapi import APIRouter, Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db, init_db
from models import Client, Invoice, Task
from routes import clients, communications, content, invoices, proposals, seo, tasks
from schemas import DashboardStats


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await init_db()
        print("[DB] Connected ✓")
    except Exception as e:
        print(f"[DB WARNING] Could not connect: {e}")
    yield


app = FastAPI(
    title="White-Label AI Agency Operations Platform",
    description="Backend API for digital agency operations management",
    version="1.0.0",
    lifespan=lifespan,
)

allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "https://carefree-vitality-production-2d6a.up.railway.app",
]
railway_domain = os.getenv("RAILWAY_PUBLIC_DOMAIN")
if railway_domain:
    allowed_origins.append(f"https://{railway_domain}")
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")


@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "agency-operations-api"}


@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def dashboard_stats(db: AsyncSession = Depends(get_db)):
    try:
        active_clients = await db.scalar(select(func.count(Client.id)).where(Client.onboarding_status != "archived"))
        pending_tasks = await db.scalar(select(func.count(Task.id)).where(Task.status.in_(["pending", "in-progress"])))
        now = datetime.utcnow()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        revenue = await db.scalar(select(func.coalesce(func.sum(Invoice.total_amount), 0)).where(Invoice.payment_status == "paid", Invoice.created_at >= month_start))
        pending_invoices = await db.scalar(select(func.count(Invoice.id)).where(Invoice.payment_status.in_(["pending", "overdue"])))
        return DashboardStats(active_clients=active_clients or 0, pending_tasks=pending_tasks or 0, revenue_this_month=float(revenue or 0), pending_invoices=pending_invoices or 0)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard stats: {str(e)}")


api_router.include_router(clients.router)
api_router.include_router(proposals.router)
api_router.include_router(content.router)
api_router.include_router(seo.router)
api_router.include_router(tasks.router)
api_router.include_router(communications.router)
api_router.include_router(invoices.router)
app.include_router(api_router)