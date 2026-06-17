# White-Label AI Agency Operations Platform

A full-stack operations platform for digital agencies to manage 7 critical workflows in one dashboard: client onboarding, AI proposal generation, content creation, SEO reporting, task management, client communications, and billing.

Built for white-label agency partners serving 1,100+ digital agencies.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Tailwind CSS, Vite |
| Backend | FastAPI (Python 3.11+), async SQLAlchemy |
| Database | PostgreSQL (Railway or Supabase) |
| AI | Groq API — Llama 3.1 70B |
| Automation | n8n workflow integration (SEO) |
| Deployment | Railway (Nixpacks, no Docker) |

## Project Structure

```
white-label-agency-platform/
├── frontend/          # React + TypeScript app
├── backend/           # FastAPI API server
├── database/          # PostgreSQL schema
├── .env.example       # Environment template
├── README.md
└── railway-deploy.md  # Deployment guide
```

## Quick Start (Local Development)

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL database
- [Groq API key](https://console.groq.com)

### 1. Install Groq API Key

1. Sign up at [https://groq.com](https://groq.com)
2. Create an API key in the console
3. Copy to your `.env` file

### 2. Set Up Environment

```bash
cp .env.example .env
# Edit .env with your keys and DATABASE_URL
```

### 3. Initialize Database

```bash
# Option A: Run schema SQL directly
psql $DATABASE_URL -f database/schema.sql

# Option B: Tables auto-create on backend startup via SQLAlchemy
```

### 4. Start Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### 5. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

The Vite dev server proxies `/api` requests to the backend.

### 6. Test the Platform

1. Open the dashboard
2. Go to **Client Onboarding** → create a client
3. Go to **Proposals** → fill the form → **Generate Proposal** (requires `GROQ_API_KEY`)
4. Explore other modules: Content, SEO, Tasks, Communications, Billing

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/dashboard/stats` | Dashboard metrics |
| GET/POST | `/api/clients` | List/create clients |
| GET | `/api/clients/{id}` | Client details |
| GET/POST | `/api/proposals` | List/create proposals |
| POST | `/api/proposals/generate` | AI proposal (Groq) |
| GET/POST | `/api/content` | Content items |
| POST | `/api/content/generate` | AI content (Groq) |
| GET/POST | `/api/seo-reports` | SEO reports |
| POST | `/api/seo/analyze` | n8n SEO workflow |
| GET/POST/PUT/DELETE | `/api/tasks` | Task CRUD |
| GET/POST | `/api/communications` | Client messages |
| GET/POST/PUT | `/api/invoices` | Invoice management |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Yes (AI features) | Groq API key |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `N8N_SEO_WEBHOOK_URL` | No | n8n webhook for SEO automation |
| `FRONTEND_URL` | No | CORS origin for production frontend |
| `VITE_API_URL` | No | Frontend API base URL (production) |
| `SUPABASE_URL` | No | Supabase Auth URL |
| `SUPABASE_ANON_KEY` | No | Supabase anon key |

## Modules

1. **Dashboard** — Stats and navigation to all 7 workflows
2. **Client Onboarding** — Intake form, document upload, timeline tracker
3. **Proposal Generation** — Groq AI proposals with PDF export
4. **Content Creation** — Blog/social/ad copy with approval workflow
5. **SEO Reporting** — Keyword rankings, traffic, competitors via n8n
6. **Task Management** — CRUD, assignees, priorities, calendar view
7. **Communications** — Per-client threads and history
8. **Billing** — Invoices, line items, payment tracking, PDF export

## Deploy to Railway

See [railway-deploy.md](./railway-deploy.md) for step-by-step Railway deployment.

## License

MIT
