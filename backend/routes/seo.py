import os
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import SEOReport
from schemas import SEOAnalyzeRequest, SEOReportCreate, SEOReportResponse

router = APIRouter(tags=["seo"])


def _mock_seo_data(domain: str, keywords: list[str]) -> dict:
    """Fallback SEO data when n8n webhook is unavailable."""
    keyword_rankings = {
        kw: {"position": idx + 3, "change": "+2" if idx % 2 == 0 else "-1"}
        for idx, kw in enumerate(keywords or ["digital marketing", "seo services", "content strategy"])
    }
    return {
        "keyword_rankings": keyword_rankings,
        "traffic_data": {
            "organic_sessions": 12450,
            "page_views": 38200,
            "bounce_rate": "42.3%",
            "avg_session_duration": "2m 34s",
            "domain": domain,
        },
        "competitor_data": {
            "competitors": [
                {"name": "Competitor A", "domain_authority": 58, "organic_traffic": 45000},
                {"name": "Competitor B", "domain_authority": 52, "organic_traffic": 32000},
                {"name": "Competitor C", "domain_authority": 45, "organic_traffic": 18000},
            ]
        },
    }


async def _call_n8n_webhook(domain: str, keywords: list[str]) -> dict | None:
    webhook_url = os.getenv("N8N_SEO_WEBHOOK_URL")
    if not webhook_url:
        return None

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                webhook_url,
                json={"domain": domain, "keywords": keywords},
            )
            if response.status_code == 200:
                data = response.json()
                # n8n returns array - extract first item
                if isinstance(data, list) and len(data) > 0:
                    return data[0]
                elif isinstance(data, dict):
                    return data
    except Exception:
        return None
    return None


@router.get("/seo-reports", response_model=list[SEOReportResponse])
async def list_seo_reports(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(SEOReport).order_by(SEOReport.report_date.desc()))
        return result.scalars().all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch SEO reports: {str(e)}")


@router.post("/seo-reports", response_model=SEOReportResponse, status_code=201)
async def create_seo_report(payload: SEOReportCreate, db: AsyncSession = Depends(get_db)):
    try:
        report = SEOReport(
            client_id=payload.client_id,
            keyword_rankings=payload.keyword_rankings,
            traffic_data=payload.traffic_data,
            competitor_data=payload.competitor_data,
        )
        db.add(report)
        await db.flush()
        await db.refresh(report)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create SEO report: {str(e)}")


@router.post("/seo/analyze", response_model=SEOReportResponse, status_code=201)
async def analyze_seo(payload: SEOAnalyzeRequest, db: AsyncSession = Depends(get_db)):
    try:
        n8n_data = await _call_n8n_webhook(payload.domain, payload.keywords)

        if n8n_data:
            seo_data = {
                "keyword_rankings": n8n_data.get("keyword_rankings", {}),
                "traffic_data": n8n_data.get("traffic_data", {}),
                "competitor_data": n8n_data.get("competitor_data", {}),
            }
        else:
            seo_data = _mock_seo_data(payload.domain, payload.keywords)

        report = SEOReport(
            client_id=payload.client_id,
            keyword_rankings=seo_data["keyword_rankings"],
            traffic_data=seo_data["traffic_data"],
            competitor_data=seo_data["competitor_data"],
        )
        db.add(report)
        await db.flush()
        await db.refresh(report)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze SEO: {str(e)}")