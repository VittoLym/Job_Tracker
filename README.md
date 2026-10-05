# Job Tracker

A full stack web app that helps job seekers keep track of every application in one place: where they applied, what stage each process is in, and what to do next. No more spreadsheets, lost links or "did I already apply here?" moments.

<!-- TODO: add a screenshot or GIF of the dashboard here -->
<!-- ![Dashboard](docs/images/dashboard.png) -->

## Features

- **Application lifecycle management**: track each application through its stages. <!-- TODO: list the real statuses you implemented (e.g. applied, interview, offer, rejected) -->
- **Dashboard and analytics**: overview of your applications and progress.
- **Email import workflows**: import applications from emails instead of typing them by hand. <!-- TODO: explain how it works (which provider, manual or automatic) -->
- **REST API** built with NestJS. <!-- TODO: link to Swagger/OpenAPI if you have it -->

## Tech stack

| Layer | Technologies |
|---|---|
| Frontend | Vue 3, TypeScript |
| Backend | NestJS, TypeScript |
| Database | PostgreSQL 17, Prisma ORM |
| Queues and cache | Redis, BullMQ |
| Observability | Prometheus <!-- TODO: confirm the metrics endpoint exists in the API --> |
| Infrastructure | Docker, Docker Compose |

## Repository layout

Monorepo with the applications under `apps/`:

```
Job_Tracker/
├── apps/
│   ├── api/                  # NestJS REST API (has its own Dockerfile)
│   └── [TODO: web]/          # Vue 3 frontend
├── docker-compose.yml        # PostgreSQL, Redis and the API
├── docker-compose.dev.yml    # [TODO: describe how it differs]
└── README.md
```

<!-- TODO: replace the tree above with the output of `tree -L 3 -I node_modules` -->

## Getting started

### Prerequisites

- Docker and Docker Compose
- Node.js [TODO: version] to run the frontend or the API outside Docker

### 1. Configure the API

The API reads its settings from `apps/api/.env`:

```bash
cp apps/api/.env.example apps/api/.env   # TODO: make sure this file exists in the repo
```

| Variable | Description |
|---|---|
| `JWT_SECRET` | Secret used to sign tokens |
| <!-- TODO --> | <!-- add the rest from your .env.example --> |

`DATABASE_URL`, `REDIS_URL`, `REDIS_HOST` and `REDIS_PORT` are already set by `docker-compose.yml`.

### 2. Start the backend

```bash
git clone https://github.com/VittoLym/Job_Tracker.git
cd Job_Tracker
docker compose up --build
```

This starts three services:

| Service | Image / build | Address |
|---|---|---|
| PostgreSQL | `postgres:17` (database `jobtracker`) | `localhost:5433` |
| Redis | `redis:alpine` | `localhost:6379` |
| API | built from `apps/api` | `http://localhost:3000` |

PostgreSQL and Redis have health checks, and the API waits until both are healthy before starting.

> The PostgreSQL credentials in `docker-compose.yml` are for local development only. Use your own secrets in any shared or production environment.

### 3. Start the frontend

```bash
# TODO: replace with your real commands
cd apps/[web]
npm install
npm run dev
```

Frontend: http://localhost:[TODO port]

### Development mode

```bash
docker compose -f docker-compose.dev.yml up --build
```

<!-- TODO: explain what the dev compose file does (hot reload? different env?) -->

## Testing

```bash
# TODO: replace with your real commands
npm run test
```

> Current status: [TODO: be honest here, e.g. "unit tests in progress, see roadmap"].

## Roadmap

- [ ] Unit and e2e tests
- [ ] CI with GitHub Actions
- [ ] Add the frontend to Docker Compose
- [ ] [TODO: other ideas]

## How I used AI in this project

<!-- Be specific and honest. Recruiters want to know what you delegated and what you decided. -->

- **Tools used:** [TODO: e.g. Claude Code, Copilot, ChatGPT]
- **What I delegated:** [TODO: e.g. boilerplate, Prisma schema drafts, test scaffolding]
- **What I decided and wrote myself:** [TODO: e.g. architecture, queue design, data model]
- **How I reviewed AI output:** [TODO: e.g. read every diff, ran the app, wrote tests]
- **Agent instructions:** see [`AGENTS.md`](./AGENTS.md) <!-- TODO: create this file -->

## Author

**Alexander Assón**, Backend / Full Stack Engineer, Mendoza, Argentina.
[LinkedIn](https://linkedin.com/in/devvitto) · [GitHub](https://github.com/VittoLym)