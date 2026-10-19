# Job Tracker API

NestJS API for the Job Tracker app: applications CRUD, an optional Gmail integration, a BullMQ notifications queue, Prometheus metrics and health checks.

Setup, environment variables and the endpoint list are in the [main README](../../README.md).

```bash
cp .env.example .env
npm ci
npx prisma migrate deploy
npm run start:dev
```

Other scripts: `npm test`, `npm run test:e2e`, `npm run lint`, `npm run build`.