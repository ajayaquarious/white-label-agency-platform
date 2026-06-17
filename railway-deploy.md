# Railway Deployment Guide

Deploy the White-Label AI Agency Operations Platform on Railway without Docker.

## Architecture on Railway

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Frontend       │────▶│  Backend        │────▶│  PostgreSQL     │
│  (Node/Nixpacks)│     │  (Python/FastAPI)│     │  (Railway DB)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │  Groq API       │
                        │  n8n Webhook    │
                        └─────────────────┘
```

## Step 1: Create Railway Project

1. Go to [https://railway.com](https://railway.com) and sign in
2. Click **New Project**
3. Choose **Empty Project**

## Step 2: Add PostgreSQL

1. In your project, click **+ New**
2. Select **Database** → **PostgreSQL**
3. Once provisioned, open the Postgres service → **Variables**
4. Copy `DATABASE_URL` (internal URL for backend)

Optional: run the schema manually:

```bash
railway connect postgres
\i database/schema.sql
```

Tables also auto-create when the backend starts.

## Step 3: Deploy Backend (FastAPI)

1. Click **+ New** → **GitHub Repo** (or **Empty Service** and connect later)
2. Set the **Root Directory** to `backend`
3. Add environment variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (Railway reference) |
| `GROQ_API_KEY` | Your Groq API key |
| `FRONTEND_URL` | `https://<your-frontend-domain>.up.railway.app` |
| `N8N_SEO_WEBHOOK_URL` | (optional) n8n webhook URL |

4. Railway reads `backend/railway.json`:

```json
{
  "deploy": {
    "startCommand": "uvicorn main:app --host 0.0.0.0 --port $PORT",
    "healthcheckPath": "/api/health"
  }
}
```

5. Generate a public domain: **Settings** → **Networking** → **Generate Domain**
6. Note the backend URL (e.g. `https://agency-api.up.railway.app`)

## Step 4: Deploy Frontend (React)

1. Click **+ New** → add another service from the same repo
2. Set **Root Directory** to `frontend`
3. Add environment variables:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://<your-backend-domain>.up.railway.app/api` |
| `PORT` | (Railway sets automatically) |

4. Railway reads `frontend/railway.json`:

```json
{
  "build": {
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm run serve"
  }
}
```

5. Generate a public domain for the frontend
6. Update backend `FRONTEND_URL` to match the frontend domain

## Step 5: Configure CORS

The backend automatically allows:

- `http://localhost:5173` (local dev)
- `FRONTEND_URL` env variable
- `https://{RAILWAY_PUBLIC_DOMAIN}`

Set `FRONTEND_URL` on the backend service after the frontend domain is known.

## Step 6: Verify Deployment

1. Open frontend URL → Dashboard loads
2. Check backend health: `https://<backend>/api/health`
3. Create a client in **Onboarding**
4. Generate a proposal (requires valid `GROQ_API_KEY`)
5. Run SEO analysis (uses mock data if n8n not configured)

## n8n SEO Workflow Setup

1. Create an n8n workflow with a **Webhook** trigger
2. Add nodes to fetch keyword rankings, traffic, and competitor data
3. Return JSON:

```json
{
  "keyword_rankings": { "keyword": { "position": 5, "change": "+2" } },
  "traffic_data": { "organic_sessions": 10000, "page_views": 30000 },
  "competitor_data": { "competitors": [{ "name": "...", "domain_authority": 50 }] }
}
```

4. Set `N8N_SEO_WEBHOOK_URL` on the backend to the webhook URL

## CLI Deployment (Alternative)

Install Railway CLI:

```bash
npm i -g @railway/cli
railway login
```

Deploy backend:

```bash
cd backend
railway link
railway up
```

Deploy frontend:

```bash
cd frontend
railway link
railway up
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| CORS errors | Set `FRONTEND_URL` on backend to exact frontend URL |
| API 502 on AI | Verify `GROQ_API_KEY` is set |
| DB connection fails | Use Railway internal `DATABASE_URL` reference |
| Frontend blank API | Set `VITE_API_URL` before build (redeploy after change) |
| Build fails | Check Node 18+ and Python 3.11+ in Nixpacks logs |

## Cost Estimate

- Frontend: ~$5/mo (Hobby)
- Backend: ~$5/mo (Hobby)
- PostgreSQL: ~$5/mo (Hobby)

Total: ~$15/mo on Railway Hobby plan.
