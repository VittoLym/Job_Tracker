# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project

Job Tracker is a personal tool to track job applications. The API can also watch a Gmail inbox and update applications from the emails it receives. It is built for a single user and has no authentication yet.

## Layout

- `apps/api`: NestJS API. Modules in `src/`: `applications`, `gmail`, `webhooks`, `notifications`, `metrics`, `health`, `prisma`. Schema and migrations in `prisma/`.
- `apps/web`: Vue 3 + Pinia + Vite frontend (`src/views`, `src/stores`, `src/api`).
- `docker-compose.yml`: PostgreSQL 17, Redis and the API. `docker-compose.dev.yml`: PostgreSQL and Redis only.

## Commands

```bash
# API (apps/api)
npm run start:dev
npm test
npm run test:e2e
npm run lint
npx prisma migrate dev          # create a migration after changing schema.prisma

# Web (apps/web)
npm run dev
npm run type-check
npm run build
```

## Rules

- Never commit `.env`, OAuth credentials, refresh tokens or dumps with personal data. Never log secrets.
- Keep the Gmail scope read-only (`gmail.readonly`).
- Schema changes go through a Prisma migration, never by editing the database by hand.
- Keep the global `ValidationPipe` options (`whitelist`, `forbidNonWhitelisted`, `transform`). New endpoints need DTOs.
- Do not expose new public endpoints without discussing authentication first. The Gmail webhook and the OAuth callback are known open points.
- Existing logs and some comments are in Spanish. New documentation and READMEs are in English.
- Commit messages follow Conventional Commits, in English.

## Known gaps

- No real tests yet: only the default Nest template.
- No authentication, and CORS is open.
- The Gmail watch is registered at startup and never renewed.
- The notifications worker only logs.
- The frontend is not in Docker Compose.

## How AI is used here

The maintainer wrote the backend and designed the database schema. AI assistants handled the visual design of the frontend. Agents must not change the Prisma schema or add a migration without the maintainer reviewing it.