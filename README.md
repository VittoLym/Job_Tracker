# Job Tracker

A personal web app to keep track of job applications: where you applied, what stage each process is in, and what changed. It can also watch a Gmail inbox and update applications from the emails it receives (LinkedIn confirmations, interview invitations, offers, rejections).
---
![CI](https://github.com/VittoLym/Job_Tracker/actions/workflows/ci.yml/badge.svg).
> **Status:** personal project for a single user. There is no user authentication. Read [Known limitations](#known-limitations) before exposing it anywhere.

## Features

- **Applications**: create, list, update and delete applications with company, role, job URL, status, work mode, salary and notes. Every status change is stored in a history.
- **Statuses**: `APPLIED`, `ASSESSMENT`, `INTERVIEW`, `OFFER`, `REJECTED`, `GHOSTED`. Work modes: `REMOTE`, `HYBRID`, `ONSITE`.
- **Web app**: a dashboard and an applications list (Vue 3, Pinia).
- **Gmail integration (optional)**: Gmail push notifications (Pub/Sub) call a webhook. A keyword-based parser (Spanish and English) detects new LinkedIn applications and status changes, matches the company by name and updates or creates the application. It only asks for the read-only `gmail.readonly` scope.
- **Notifications queue**: every status change is enqueued in a BullMQ queue (`notifications`, 3 attempts with exponential backoff). The worker currently logs the change; it does not send anything yet.
- **Observability**: structured logs with Pino and a correlation id per request, Prometheus metrics at `/metrics` (default metrics plus counters for created applications and status changes) and a health check at `/health`.
- **Demo mode**: with `DEMO_MODE=true` the API becomes read-only.

## Tech stack

| Layer | Technologies |
|---|---|
| Frontend | Vue 3, TypeScript, Pinia, Vue Router, Axios, Vite |
| Backend | NestJS 11, TypeScript, class-validator |
| Database | PostgreSQL 17, Prisma ORM |
| Queues and cache | Redis, BullMQ |
| Integrations | Gmail API (googleapis) |
| Observability | Pino, Prometheus (`prom-client`) |
| Testing | Jest |
| Infrastructure | Docker, Docker Compose |

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

### 1. Configure the API

```bash
cp apps/api/.env.example apps/api/.env
```

| Variable | Description |
|---|---|
| `PORT` | API port (default `3000`) |
| `DATABASE_URL`, `REDIS_URL`, `REDIS_HOST`, `REDIS_PORT` | Connections. `docker-compose.yml` sets them for the API container; the values in `.env.example` are for running the API on your machine with `docker-compose.dev.yml` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `GOOGLE_REFRESH_TOKEN` | Gmail OAuth (optional) |
| `GMAIL_PUBSUB_TOPIC` | Full Pub/Sub topic name. Leave it empty to skip the Gmail watch |
| `WEBHOOK_TOKEN` | Shared secret that `POST /webhooks/gmail` requires as `?token=` |
| `CORS_ORIGIN` | Comma-separated list of allowed browser origins. Empty allows any origin |
| `DEMO_MODE` | `true` makes the API read-only |

### 2. Start PostgreSQL, Redis and the API

```bash
git clone https://github.com/VittoLym/Job_Tracker.git
cd Job_Tracker
docker compose up --build
```

| Service | Address |
|---|---|
| PostgreSQL 17 (database `jobtracker`) | `localhost:5433` |
| Redis | `localhost:6379` |
| API | http://localhost:3000 |

The database credentials in `docker-compose.yml` are for local development only.

### 3. Apply the database migrations

From the repository root, with the containers running:

```bash
cd apps/api
npm ci
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/jobtracker npx prisma migrate deploy
```

### 4. Start the frontend

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
npm test
```

The unit tests cover `EmailParserService`: LinkedIn confirmations in Spanish and English, status detection, priority between statuses and company hints. The known false positives (newsletters that mention interviews, sender names with a department such as "Acme Talent") are documented with `it.failing`, so they show up as known gaps instead of being hidden.

The applications service, the webhook and the frontend are not covered yet, and the e2e template needs PostgreSQL and Redis running.

## Known limitations

- **No user authentication.** CORS is open unless `CORS_ORIGIN` is set. `DEMO_MODE` blocks writes but does not hide the data.
- **The Gmail webhook is protected by a shared token only.** It does not verify the Pub/Sub JWT, it is not idempotent (a repeated notification can create a duplicate application) and it logs the sender, subject and snippet of each email it processes.
- **`/auth/google/callback` returns the refresh token in the HTTP response.** It is a one-off setup helper, not something to expose.
- **The Gmail watch is registered only at startup.** Gmail watches expire and there is no renewal job yet.
- **Email parsing is keyword-based.** Broad keywords can match unrelated emails, and the company is matched by loose name comparison, so false matches and misses are possible.
- **Applications created or updated from Gmail do not update the Prometheus counters**, because the webhook uses the repository directly.
- **The notifications worker only logs.** Nothing is sent to the user yet.
- **The health check covers PostgreSQL only**, not Redis.
- **The frontend is not part of `docker-compose.yml`.**

## Roadmap

- [ ] Tests for the applications service and the webhook, plus e2e tests
- [ ] CI with GitHub Actions
- [ ] Match companies with a normalized comparison (for example "Acme Talent" and "Acme")
- [ ] Skip bulk email (`List-Unsubscribe`, `Precedence: bulk`) in the parser
- [ ] Make the webhook idempotent by Gmail message id
- [ ] Renew the Gmail watch automatically
- [ ] Verify the Pub/Sub JWT on the webhook
- [ ] Real week-over-week trends in the dashboard
- [ ] Reminders for applications without news, using delayed BullMQ jobs
- [ ] Hosted demo with sample data
- [ ] Authentication
- [ ] Add the frontend to Docker Compose

## How I used AI in this project

- **What I did myself:** the backend and the database schema.
- **What I delegated:** the visual design of the frontend.
- **Agent instructions:** see [`AGENTS.md`](./AGENTS.md).

## Author

**Alexander Assón**, Backend / Full Stack Engineer, Mendoza, Argentina.
[LinkedIn](https://linkedin.com/in/devvitto) · [GitHub](https://github.com/VittoLym)
