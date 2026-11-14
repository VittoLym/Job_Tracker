cd ~/Documents/Projects/Job_Tracker
cat > AGENTS.md <<'EOF'
# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project

Job Tracker is a personal tool to track job applications. The API can also watch a Gmail inbox and update applications from the emails it receives. Status changes are written together with an outbox event, and a scheduled dispatcher publishes those events to BullMQ. It is built for a single user and has no authentication yet.

## Layout

- `apps/api`: NestJS API. Modules in `src/`: `applications`, `gmail`, `webhooks`, `notifications` (includes the outbox and its dispatcher), `metrics`, `health`, `prisma`. Schema and migrations in `prisma/`.
- `apps/web`: Vue 3 + Pinia + Vite frontend (`src/views`, `src/stores`, `src/api`).
- `docker-compose.yml`: PostgreSQL 17, Redis and the API. `docker-compose.dev.yml`: PostgreSQL and Redis only.

## Commands

```bash
# API (apps/api)
npm run start:dev
npx jest --runInBand            # unit and database tests, run serially
npm run test:e2e
npm run lint                    # runs ESLint with --fix: it rewrites files
npx prisma migrate dev          # create a migration after changing schema.prisma

# Web (apps/web)
npm run dev
npm run type-check
npm run build
```

Run `npm run lint` on a clean working tree and review the diff afterwards.

## Rules

- Never commit `.env`, OAuth credentials, refresh tokens or dumps with personal data. Never log secrets or email content.
- When you add an environment variable, add it to `apps/api/.env.example` and to the variable table in `README.md`.
- Keep the Gmail scope read-only (`gmail.readonly`).
- Schema changes go through a Prisma migration, never by editing the database by hand.
- Keep the global `ValidationPipe` options (`whitelist`, `forbidNonWhitelisted`, `transform`). New endpoints need DTOs.
- Do not expose new public endpoints without discussing authentication first. The Gmail webhook (shared token only) and the OAuth callback are known open points.
- Gmail messages are deduplicated by their Gmail message ID. Keep that guarantee when you change the webhook flow.
- A status change must write its status history and its outbox event in the same database transaction. Do not update an application's status outside that flow.
- Outbox delivery is at-least-once, so consumers must be idempotent. `PUBLISHED` means queued in BullMQ, never delivered to the user.
- Do not delete or silence `it.todo` or `it.failing` tests: they document known gaps. When the underlying problem is fixed, turn the test into a regular one.
- Changes to the email parser keywords need tests with real examples.
- Existing logs and some comments are in Spanish. New documentation and READMEs are in English.
- Commit messages follow Conventional Commits, in English.

## Known gaps

- No end-to-end tests. Unit and database tests cover the email parser, Gmail idempotency and the outbox dispatcher; the applications service and the webhook are not covered yet.
- No authentication. CORS is open unless `CORS_ORIGIN` is set.
- The webhook checks a shared token but does not verify the Google Pub/Sub JWT.
- The Gmail watch is registered at startup and never renewed.
- The notifications worker only logs: no email or in-app delivery yet.
- The health check covers PostgreSQL only, not Redis.
- ESLint runs in CI but does not block it.
- The frontend is not in Docker Compose.

## How AI is used here

The maintainer wrote the backend and designed the database schema. AI assistants handled the visual design of the frontend. Agents must not change the Prisma schema or add a migration without the maintainer reviewing it.
EOF
git diff --stat AGENTS.md