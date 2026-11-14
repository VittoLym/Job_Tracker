# Job Tracker

A personal web app to keep track of job applications: where you applied, what stage each process is in, and what changed. It can also watch a Gmail inbox and update applications from the emails it receives (LinkedIn confirmations, interview invitations, offers, rejections).

[![CI](https://github.com/VittoLym/Job_Tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/VittoLym/Job_Tracker/actions/workflows/ci.yml)

> **Status:** personal project for a single user. There is no user authentication. Read [Known limitations](#known-limitations) before exposing it anywhere.

## Features

- **Applications**: create, list, update and delete applications with company, role, job URL, status, work mode, salary and notes. Every status change is stored in a history.
- **Statuses**: `APPLIED`, `ASSESSMENT`, `INTERVIEW`, `OFFER`, `REJECTED`, `GHOSTED`. Work modes: `REMOTE`, `HYBRID`, `ONSITE`.
- **Web app**: dashboard and applications list built with Vue 3, Pinia and Vue Router.
- **Gmail integration (optional)**: Gmail push notifications through Google Pub/Sub trigger the webhook. The Gmail History API retrieves changes, and a keyword-based parser (Spanish and English) detects LinkedIn application confirmations and status updates. It only requests the read-only `gmail.readonly` scope.
- **Gmail idempotency**: processed Gmail message IDs are stored in PostgreSQL to prevent duplicate processing.
- **Transactional Outbox**: application status changes and their corresponding outbox events are persisted in the same database transaction.
- **Background dispatching**: a scheduled dispatcher checks pending outbox events every 10 seconds and publishes them to BullMQ. PostgreSQL row locking with `SKIP LOCKED` coordinates event claiming. Expired leases are recovered, with exponential retry delays and a maximum of five dispatch attempts.
- **Notifications queue**: BullMQ processes `status-change` jobs. The current worker only logs the status change; it does not send emails or in-app notifications yet.
- **Observability**: structured logs with Pino and a correlation ID per request, Prometheus metrics at `/metrics`, and a database health check at `/health`.
- **Demo mode**: with `DEMO_MODE=true`, the API becomes read-only.

## Architecture

```mermaid
flowchart TD
    G["Gmail inbox"] -->|"new email"| P["Google Pub/Sub"]
    P -->|"push"| W["POST /webhooks/gmail"]
    W --> S["Idempotency check by Gmail message ID"]
    S --> A["ApplicationsService"]
    A --> T["PostgreSQL transaction: application, status history, outbox event"]
    T --> D["Outbox dispatcher: every 10 s, SKIP LOCKED, leases, retries"]
    D --> Q["BullMQ queue: notifications"]
    Q --> N["NotificationsProcessor: currently logs"]
```

Delivery is **at-least-once**, not exactly-once. An outbox event marked `PUBLISHED` means BullMQ accepted the job, not that a user received a notification.

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | Vue 3, TypeScript, Pinia, Vue Router, Axios, Vite |
| Backend | NestJS 11, TypeScript, class-validator |
| Database | PostgreSQL 17, Prisma ORM |
| Queues and cache | Redis, BullMQ |
| Scheduling | @nestjs/schedule |
| Integrations | Gmail API, Google Pub/Sub |
| Observability | Pino, Prometheus (`prom-client`) |
| Testing | Jest |
| Infrastructure | Docker, Docker Compose, GitHub Actions |

## Repository layout

```
Job_Tracker/
├── apps/
│   ├── api/                  # NestJS API (Dockerfile, .env.example, Prisma schema and migrations)
│   │   └── src/              # applications, gmail, webhooks, notifications, metrics, health, prisma
│   └── web/                  # Vue 3 frontend (Vite, .env.example)
├── docker-compose.yml        # PostgreSQL, Redis and the API
├── docker-compose.dev.yml    # PostgreSQL and Redis only, for running the API locally
└── AGENTS.md
```

## Getting started

Requires Docker with Compose and Node.js (the supported range is in `engines` in `apps/web/package.json`).

### 1. Clone the repository

```bash
git clone https://github.com/VittoLym/Job_Tracker.git
cd Job_Tracker
```

### 2. Configure the API

```bash
cp apps/api/.env.example apps/api/.env
```

| Variable | Description |
|---|---|
| `PORT` | API port (default `3000`) |
| `DATABASE_URL` | PostgreSQL connection. `docker-compose.yml` sets it for the API container. For running the API on your machine, use port `5433` with `docker-compose.yml` or `5432` with `docker-compose.dev.yml` |
| `REDIS_HOST`, `REDIS_PORT` | Redis connection, used by BullMQ and the Gmail cursor. `docker-compose.yml` sets them for the API container |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `GOOGLE_REFRESH_TOKEN` | Gmail OAuth (optional) |
| `GMAIL_PUBSUB_TOPIC` | Full Pub/Sub topic name. Leave it empty to skip the Gmail watch |
| `WEBHOOK_TOKEN` | Shared secret that `POST /webhooks/gmail` requires as `?token=` |
| `CORS_ORIGIN` | Comma-separated list of allowed browser origins. Empty allows any origin |
| `DEMO_MODE` | `true` makes the API read-only |

### 3. Start PostgreSQL, Redis and the API

```bash
docker compose up --build
```

| Service | Address |
|---|---|
| PostgreSQL 17 (database `jobtracker`) | `localhost:5433` |
| Redis | `localhost:6379` |
| API | http://localhost:3000 |

The database credentials in `docker-compose.yml` are for local development only.

### 4. Apply the database migrations

From the repository root, with the containers running:

```bash
cd apps/api
npm ci
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/jobtracker npx prisma migrate deploy
```

### 5. Start the frontend

```bash
cd apps/web
npm ci
npm run dev
```

Open http://localhost:5173 (Vite's default port). The frontend calls `http://localhost:3000` unless `VITE_API_URL` is set (see `apps/web/.env.example`).

### Development mode

`docker-compose.dev.yml` starts only PostgreSQL (port 5432) and Redis, so you can run the API on your machine:

```bash
docker compose -f docker-compose.dev.yml up -d
cd apps/api
npm ci
npx prisma migrate deploy       # uses DATABASE_URL from apps/api/.env
npm run start:dev
```

## Gmail integration (optional)

1. In Google Cloud, enable the Gmail API and create an OAuth client. Put its id, secret and redirect URI (`http://localhost:3000/auth/google/callback` for local use) in `apps/api/.env`.
2. Open `http://localhost:3000/auth/google`, accept the read-only permission and copy the `refresh_token` from the response into `GOOGLE_REFRESH_TOKEN`.
3. Create a Pub/Sub topic, let `gmail-api-push@system.gserviceaccount.com` publish to it, and set its full name in `GMAIL_PUBSUB_TOPIC`.
4. Generate a token for the webhook and set it in `WEBHOOK_TOKEN`:
   ```bash
   node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
   ```
5. Create a push subscription that points to `https://<your-public-url>/webhooks/gmail?token=<WEBHOOK_TOKEN>`. Locally you need a tunnel such as ngrok or cloudflared.

On startup the API registers a Gmail watch on the INBOX label.

## Demo mode

Set `DEMO_MODE=true` to expose the app without letting anyone change it: only `GET /applications`, `GET /applications/:id` and `GET /health` are allowed. Writes, the OAuth flow, `/metrics` and the webhook answer `403`. Combine it with `CORS_ORIGIN` to limit which sites can call the API from a browser, and point it at a database with sample data, never your real one.

## API

| Method | Path | Description |
|---|---|---|
| GET, POST | `/applications` | List and create applications |
| GET, PATCH, DELETE | `/applications/:id` | Read, update and delete one application |
| GET | `/health` | Health check (database) |
| GET | `/metrics` | Prometheus metrics |
| POST | `/webhooks/gmail?token=...` | Gmail push notifications |
| GET | `/auth/google`, `/auth/google/callback` | One-off OAuth flow to obtain the Gmail refresh token |

Request bodies are validated with `whitelist` and `forbidNonWhitelisted`.

## Testing

```bash
cd apps/api
npx jest --runInBand
```

The test suite covers:

- **Email parsing:** LinkedIn application confirmations in Spanish and English, status detection, priority between statuses and company hints. Known false positives (for example newsletters that mention interviews, or sender names that include a department such as "Acme Talent") are documented with `it.failing`, so they show up as known gaps instead of being hidden.
- **Gmail idempotency:** duplicate message handling and database uniqueness.
- **Transactional Outbox:** event dispatching, expired lease recovery, retry handling and maximum attempts.
- **Scheduled dispatching:** automatic execution and protection against overlapping runs.

Comprehensive application service, webhook and end-to-end coverage are still planned.

GitHub Actions builds and tests the API and builds the frontend on every push and pull request. ESLint runs in the pipeline but does not block it yet.

## Known limitations

- **No user authentication.** CORS is open unless `CORS_ORIGIN` is set. `DEMO_MODE` blocks writes but does not hide the data.
- **The Gmail webhook is protected by a shared token only.** It does not verify the Google Pub/Sub JWT.
- **`/auth/google/callback` returns the refresh token in the HTTP response.** It is a one-off setup helper, not something to expose publicly.
- **The Gmail watch is registered only at startup.** Gmail watches expire and there is no automatic renewal job yet.
- **Email parsing is keyword-based.** Broad keywords can match unrelated emails, and company matching is based on name comparison, so variations in how a company is written can cause misses.
- **Notifications are not delivered yet.** The BullMQ worker only logs status changes. Outbox `PUBLISHED` means queued in BullMQ, not delivered.
- **The health check covers PostgreSQL only**, not Redis.
- **The frontend is not part of `docker-compose.yml`.**
- **The test suite does not provide end-to-end coverage yet.**

## Roadmap

- [x] Gmail message idempotency
- [x] Transactional Outbox for application status changes
- [x] Scheduled Outbox dispatcher
- [x] Expired lease recovery and retry handling
- [x] CI with GitHub Actions
- [ ] Make ESLint blocking in CI
- [ ] Add comprehensive application service and webhook tests
- [ ] Add end-to-end tests
- [ ] Improve company matching with normalized comparison
- [ ] Skip bulk email (`List-Unsubscribe`, `Precedence: bulk`) in the parser
- [ ] Renew the Gmail watch automatically
- [ ] Verify Google Pub/Sub JWT signatures
- [ ] Implement actual email or in-app notification delivery
- [ ] Add a frontend notifications center
- [ ] Add real week-over-week trends to the dashboard
- [ ] Add reminders for applications without updates
- [ ] Deploy a hosted demo with sample data
- [ ] Add authentication
- [ ] Add the frontend to Docker Compose

## How I used AI in this project

- **What I did myself:** the backend and the database schema.
- **What I delegated:** the visual design of the frontend.
- **Agent instructions:** see [`AGENTS.md`](./AGENTS.md).

## Author

**Alexander Assón**, Backend / Full Stack Engineer, Mendoza, Argentina.
[LinkedIn](https://linkedin.com/in/devvitto) · [GitHub](https://github.com/VittoLym)
