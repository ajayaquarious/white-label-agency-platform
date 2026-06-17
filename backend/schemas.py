from datetime import date, datetime
from decimal import Decimal
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field


# --- Clients ---
class ClientCreate(BaseModel):
    name: str
    email: str
    company: Optional[str] = None
    budget: Optional[float] = None
    onboarding_status: str = "pending"
    documents: list[Any] = Field(default_factory=list)
    onboarding_steps: list[Any] = Field(default_factory=list)


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    company: Optional[str] = None
    budget: Optional[float] = None
    onboarding_status: Optional[str] = None
    documents: Optional[list[Any]] = None
    onboarding_steps: Optional[list[Any]] = None


class ClientResponse(BaseModel):
    id: UUID
    name: str
    email: str
    company: Optional[str]
    budget: Optional[float]
    onboarding_status: str
    documents: list[Any]
    onboarding_steps: list[Any]
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Proposals ---
class ProposalCreate(BaseModel):
    client_id: Optional[UUID] = None
    title: str
    content: Optional[str] = None
    budget: Optional[float] = None
    timeline: Optional[str] = None
    services: list[str] = Field(default_factory=list)
    status: str = "draft"


class ProposalGenerateRequest(BaseModel):
    client_name: str
    company: Optional[str] = ""
    budget: float
    timeline: str
    services: list[str]
    notes: Optional[str] = ""
    client_id: Optional[UUID] = None
    title: Optional[str] = None


class ProposalResponse(BaseModel):
    id: UUID
    client_id: Optional[UUID]
    title: str
    content: Optional[str]
    budget: Optional[float]
    timeline: Optional[str]
    services: list[Any]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Content ---
class ContentCreate(BaseModel):
    client_id: Optional[UUID] = None
    type: str
    title: str
    content: Optional[str] = None
    status: str = "draft"
    version: int = 1


class ContentGenerateRequest(BaseModel):
    type: str
    topic: str
    title: Optional[str] = None
    client_id: Optional[UUID] = None
    client_name: Optional[str] = ""


class ContentResponse(BaseModel):
    id: UUID
    client_id: Optional[UUID]
    type: str
    title: str
    content: Optional[str]
    status: str
    version: int
    created_at: datetime

    model_config = {"from_attributes": True}


# --- SEO ---
class SEOReportCreate(BaseModel):
    client_id: UUID
    keyword_rankings: dict[str, Any] = Field(default_factory=dict)
    traffic_data: dict[str, Any] = Field(default_factory=dict)
    competitor_data: dict[str, Any] = Field(default_factory=dict)


class SEOAnalyzeRequest(BaseModel):
    client_id: UUID
    domain: str
    keywords: list[str] = Field(default_factory=list)


class SEOReportResponse(BaseModel):
    id: UUID
    client_id: Optional[UUID]
    keyword_rankings: dict[str, Any]
    traffic_data: dict[str, Any]
    competitor_data: dict[str, Any]
    report_date: datetime

    model_config = {"from_attributes": True}


# --- Tasks ---
class TaskCreate(BaseModel):
    client_id: Optional[UUID] = None
    title: str
    description: Optional[str] = None
    assignee: Optional[str] = None
    priority: str = "medium"
    status: str = "pending"
    due_date: Optional[date] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assignee: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[date] = None
    client_id: Optional[UUID] = None


class TaskResponse(BaseModel):
    id: UUID
    client_id: Optional[UUID]
    title: str
    description: Optional[str]
    assignee: Optional[str]
    priority: str
    status: str
    due_date: Optional[date]
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Communications ---
class CommunicationCreate(BaseModel):
    client_id: UUID
    message_type: str = "note"
    content: str
    notes: Optional[str] = None


class CommunicationResponse(BaseModel):
    id: UUID
    client_id: Optional[UUID]
    message_type: str
    content: str
    timestamp: datetime
    notes: Optional[str]

    model_config = {"from_attributes": True}


# --- Invoices ---
class InvoiceItem(BaseModel):
    description: str
    quantity: int = 1
    unit_price: float


class InvoiceCreate(BaseModel):
    client_id: UUID
    items: list[InvoiceItem]
    due_date: Optional[date] = None
    payment_status: str = "pending"


class InvoiceUpdate(BaseModel):
    payment_status: str


class InvoiceResponse(BaseModel):
    id: UUID
    client_id: Optional[UUID]
    items: list[Any]
    total_amount: float
    payment_status: str
    due_date: Optional[date]
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Dashboard ---
class DashboardStats(BaseModel):
    active_clients: int
    pending_tasks: int
    revenue_this_month: float
    pending_invoices: int
