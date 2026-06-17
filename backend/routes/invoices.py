from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Invoice
from schemas import InvoiceCreate, InvoiceResponse, InvoiceUpdate

router = APIRouter(prefix="/invoices", tags=["invoices"])


def _calculate_total(items: list) -> Decimal:
    total = Decimal("0")
    for item in items:
        qty = item.get("quantity", 1)
        price = Decimal(str(item.get("unit_price", 0)))
        total += Decimal(str(qty)) * price
    return total


@router.get("", response_model=list[InvoiceResponse])
async def list_invoices(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Invoice).order_by(Invoice.created_at.desc()))
        return result.scalars().all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch invoices: {str(e)}")


@router.post("", response_model=InvoiceResponse, status_code=201)
async def create_invoice(payload: InvoiceCreate, db: AsyncSession = Depends(get_db)):
    try:
        items_data = [item.model_dump() for item in payload.items]
        total = _calculate_total(items_data)

        invoice = Invoice(
            client_id=payload.client_id,
            items=items_data,
            total_amount=total,
            payment_status=payload.payment_status,
            due_date=payload.due_date,
        )
        db.add(invoice)
        await db.flush()
        await db.refresh(invoice)
        return invoice
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create invoice: {str(e)}")


@router.put("/{invoice_id}", response_model=InvoiceResponse)
async def update_invoice(invoice_id: UUID, payload: InvoiceUpdate, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
        invoice = result.scalar_one_or_none()
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")

        invoice.payment_status = payload.payment_status
        await db.flush()
        await db.refresh(invoice)
        return invoice
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update invoice: {str(e)}")
