# Job Tracker API

> A production-ready backend system to track job applications — built with the same patterns I'd use in a real-world product.

## Motivation

I built this while actively job hunting. Instead of a spreadsheet, I wanted a system that reflects how I actually think about backend architecture: event-driven, observable, and deployable from day one.

## Architecture

```
┌─────────────┐     HTTP      ┌──────────────────┐
│   Vue.js    │ ──────────── │   NestJS API     │
│  Dashboard  │              │                  │
└─────────────┘              │  ┌────────────┐  │
                             │  │Applications│  │
                             │  │  Service   │  │
                             │  └─────┬──────┘  │
                             │        │          │
                             │  ┌─────▼──────┐  │
                             │  │   BullMQ   │  │     ┌─────────┐
                             │  │   Queue    │ ──────► │  Redis  │
                             │  └─────┬──────┘  │     └─────────┘
                             │        │          │
                             │  ┌─────▼──────┐  │     ┌──────────────┐
                             │  │Notification│  │     │  PostgreSQL  │
                             │  │ Processor  │  │     │              │
                             │  └────────────┘  │     │ Applications │
                             │                  │ ──► │StatusHistory │
                             │  Prometheus /metrics   │Notifications │
                             └──────────────────┘     └──────────────┘
```

## Key Technical Decisions

**Event-driven status changes** — Every time an application status changes (e.g. `APPLIED → INTERVIEW`), the service enqueues a BullMQ job instead of handling side effects inline. This decouples the HTTP response from notification delivery and makes the system resilient to downstream failures.

**StatusHistory as first-class entity** — Rather than just storing the current status, every transition is recorded with `fromStatus`, `toStatus`, and a timestamp. This enables real metrics: average time per stage, funnel drop-off analysis, ghosting rates.

**Repository pattern** — Data access is isolated in `applications.repository.ts`, keeping the service layer clean and the persistence layer swappable.

**Observability from day one** — Structured logging with Pino (correlation IDs on every request) and a Prometheus-compatible `/metrics` endpoint. Not added later — designed in from the start.

## Stack

| Layer | Technology |
|---|---|
| API Framework | NestJS + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Queue | BullMQ + Redis |
| Logging | Pino |
| Metrics | Prometheus |
| Frontend | Vue.js + Pinia |
| Infra | Docker + Docker Compose |

## Endpoints

```
GET    /applications           List all applications (filter by status)
POST   /applications           Create new application
GET    /applications/:id       Get application with full status history
PATCH  /applications/:id       Update application (triggers status event if changed)
DELETE /applications/:id       Delete application

GET    /health                 Health check (DB + Redis)
GET    /metrics                Prometheus metrics endpoint
```

## Data Model

```prisma
Application {
  id, company, role, url
  status: APPLIED | ASSESSMENT | INTERVIEW | OFFER | REJECTED | GHOSTED
  workMode: REMOTE | HYBRID | ONSITE
  salary (USD)
  notes
  statusHistory[]   ← every transition recorded
  notifications[]   ← async delivery log
}
```

## Getting Started

```bash
# Start infrastructure
docker compose -f docker-compose.dev.yml up -d

# Install dependencies
cd apps/api && npm install

# Run migrations
npx prisma migrate dev

# Start API
npm run start:dev
```

## Roadmap

### ✅ Done
- Project structure (monorepo: `apps/api` + `apps/web`)
- Docker Compose (dev + prod)
- Prisma schema + initial migration
- Applications CRUD with DTOs and validation
- StatusHistory — automatic transition recording
- Repository pattern

### 🔄 In progress
- BullMQ queue setup
- Notification processor (worker)

### 📋 Upcoming
- Pino structured logging + correlation IDs
- Prometheus `/metrics` endpoint
- `/health` endpoint
- Vue.js dashboard with metrics
- Email notifications on status change
- Dockerfile + production deploy (Railway or VPS)