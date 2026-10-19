# Job Tracker

A personal web app to keep track of job applications: where you applied, what stage each process is in, and what changed. It can also watch a Gmail inbox and update applications from the emails it receives (LinkedIn confirmations, interview invitations, offers, rejections).

> **Status:** personal project for a single user. It has no authentication of its own. Read [Known limitations](#known-limitations) before exposing it anywhere.

## Features

- **Applications**: create, list, update and delete applications with company, role, job URL, status, work mode, salary and notes.
- **Statuses**: `APPLIED`, `ASSESSMENT`, `INTERVIEW`, `OFFER`, `REJECTED`, `GHOSTED`. Work modes: `REMOTE`, `HYBRID`, `ONSITE`.
- **Web app**: a dashboard and an applications list (Vue 3, Pinia).
- **Gmail integration (optional)**: Gmail push notifications (Pub/Sub) call a webhook. A keyword-based parser (Spanish and English) detects new LinkedIn applications and status changes, matches the company by name and updates or creates the application. It only asks for the read-only `gmail.readonly` scope.
- **Notifications queue**: every status change is enqueued in a BullMQ queue (`notifications`, 3 attempts with exponential backoff). The worker currently logs the change; it does not send anything yet.
- **Observability**: structured logs with Pino and a correlation id per request, Prometheus metrics at `/metrics` (default metrics plus counters for created applications and status changes) and a health check at `/health`.

## Tech stack

| Layer | Technologies |
|---|---|
| Frontend | Vue 3, TypeScript, Pinia, Vue Router, Axios, Vite |
| Backend | NestJS 11, TypeScript, class-validator |
| Database | PostgreSQL 17, Prisma ORM |
| Queues and cache | Redis, BullMQ |
| Integrations | Gmail API (googleapis) |
| Observability | Pino, Prometheus (`prom-client`) |
| Infrastructure | Docker, Docker Compose |

## Repository layout

```
Job_Tracker/
├── apps/
│   ├── api/                  # NestJS API (Dockerfile, Prisma schema and migrations)
│   │   └── src/              # applications, gmail, webhooks, notifications, metrics, health, prisma
│   └── web/                  # Vue 3 frontend (Vite)
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

The Gmail variables are optional: leave `GMAIL_PUBSUB_TOPIC` empty and the Gmail watch is skipped. `docker-compose.yml` sets `DATABASE_URL`, `REDIS_URL`, `REDIS_HOST` and `REDIS_PORT` for the API container.

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

Open http://localhost:5173 (Vite's default port). The frontend calls `http://localhost:3000` unless `VITE_API_URL` is set.

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
4. Create a push subscription that points to `https://<your-public-url>/webhooks/gmail`. Locally you need a tunnel such as ngrok or cloudflared.

On startup the API registers a Gmail watch on the INBOX label.

## API

| Method | Path | Description |
|---|---|---|
| GET, POST | `/applications` | List and create applications |
| GET, PATCH, DELETE | `/applications/:id` | Read, update and delete one application |
| GET | `/health` | Health check |
| GET | `/metrics` | Prometheus metrics |
| POST | `/webhooks/gmail` | Gmail push notifications |
| GET | `/auth/google`, `/auth/google/callback` | One-off OAuth flow to obtain the Gmail refresh token |

Request bodies are validated with `whitelist` and `forbidNonWhitelisted`.

## Testing

The API has the default Nest unit test and e2e template and no real tests yet.

```bash
cd apps/api
npm test
```

## Known limitations

- **No authentication and open CORS** (`origin: true` with credentials). It is meant to run locally for one user.
- **`POST /webhooks/gmail` does not verify the caller**, and it logs the sender, subject and snippet of each email it processes.
- **`/auth/google/callback` returns the refresh token in the HTTP response.** It is a one-off setup helper, not something to expose.
- **The Gmail watch is registered only at startup.** Gmail watches expire and there is no renewal job yet.
- **Email parsing is keyword-based** and matches the company by name, so false matches and misses are possible.
- **The notifications worker only logs.** Nothing is sent to the user yet.
- **The frontend is not part of `docker-compose.yml`.**

## Roadmap

- [ ] Unit tests for the parser and the applications service, plus e2e tests
- [ ] CI with GitHub Actions
- [ ] Verify the Pub/Sub caller on the webhook
- [ ] Renew the Gmail watch automatically
- [ ] Authentication
- [ ] Deliver notifications for real
- [ ] Add the frontend to Docker Compose

## Author

**Alexander Assón**, Backend / Full Stack Engineer, Mendoza, Argentina.
[LinkedIn](https://linkedin.com/in/devvitto) · [GitHub](https://github.com/VittoLym)