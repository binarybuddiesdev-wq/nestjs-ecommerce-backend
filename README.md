# NestJS E-Commerce Backend

Production-grade e-commerce REST API built with NestJS, Fastify, Prisma v6.19,
MongoDB Atlas, and TypeScript strict mode. Built as a senior-level backend
reference project covering auth, RBAC, order state machine, payments, queues,
caching, WebSockets, and Swagger docs.

## Tech Stack

- NestJS + Fastify adapter
- Prisma v6.19 + MongoDB Atlas
- TypeScript strict mode + ESM
- Pino structured logging
- Zod environment validation
- Swagger / OpenAPI docs
- Vitest + supertest for testing
- @swc-node/register for dev runner
- @fastify/helmet, @fastify/cors, @fastify/rate-limit

## Project Setup

1. Install dependencies:
    pnpm install

2. Create .env file from template:
    cp .env.example .env

   Fill in the required variables:
   - PORT — server port (default: 3000)
   - NODE_ENV — development, production, or test
   - DATABASE_URL — MongoDB Atlas connection string
   - CORS_ORIGIN — allowed CORS origin

3. Generate Prisma client:
    pnpm exec prisma generate

## Development & Build

Start dev server:
    pnpm run start:dev

Production build:
    pnpm run build

Start production server:
    pnpm run start

## Testing

Unit and integration tests:
    pnpm run test

Test coverage (target 90%+):
    pnpm run test:coverage

E2E tests:
    pnpm run test:e2e

## API Documentation

Available in development only:
- Swagger UI: http://localhost:PORT/api/docs
- OpenAPI JSON: http://localhost:PORT/api/docs-json

## Project Structure

    src/
      common/        — shared filters, guards, interceptors, decorators, constants
      config/        — bootstrap split into configure-app, fastify, middleware, swagger
      prisma/        — PrismaService and PrismaModule
      modules/       — feature modules: auth, users, products, cart, orders, payments etc.
      types/         — all TypeScript interfaces and types

## Seed Scripts

Standalone ESM scripts in `scripts/` for setting up demo data. Each script
auto-loads `.env` — no manual configuration needed.

| Script | Purpose |
|--------|---------|
| `create-user.mjs` | Create a user (edit `USER_CONFIG` at top, then run) |
| `seed-categories.mjs` | Upsert 60 categories (10 roots, safe to re-run) |
| `seed-products.mjs` | Seed ~3,890 products with real names & prices |
| `seed-products-plan.md` | Full product listing reference for review |
| `PROMPTS.md` | Prompts & instructions for AI-assisted seeding |

All scripts run with: `node scripts/<name>.mjs`

The product seeder (`seed-products.mjs`) also handles image sourcing —
searches the web for real product images, uploads to Cloudinary, and links
them to the product records. See `scripts/PROMPTS.md` for the full workflow.

## Concepts

Key concepts and patterns used in this project are documented in
[docs/concepts/](docs/concepts/). Each concept gets its own markdown file
with real-world examples and in-depth explanations — useful when you're
learning a pattern for the first time.

## Seed Scripts

| Script | Description |
|--------|-------------|
| `scripts/create-user.mjs` | Create a user (edit config at top) |
| `scripts/seed-categories.mjs` | Seed 60 categories (upsert, safe to re-run) |
| `scripts/seed-products.mjs` | Seed ~4,342 products across 39 leaf categories |
| `scripts/product-data.mjs` | Complete product listing data |

**Full setup:** `node scripts/create-user.mjs && node scripts/seed-categories.mjs && node scripts/seed-products.mjs`

Products are seeded with empty `images` array. Upload images via `POST /api/v1/products/:id/images` multipart endpoint.

---

## API Response Shape

All business endpoints return:
    { "success": true, "message": "...", "data": { } }

All errors return:
    { "success": false, "message": "...", "statusCode": 400, "path": "...", "timestamp": "..." }

Health endpoint returns:
    { "status": "ok" }

## Phases

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Project Scaffold & Package Installation | 🟢 |
| 2 | Base Setup & Health API | 🟢 |
| 3 | Auth | 🟢 |
| 4 | Users & Seller Onboarding | 🟢 |
| 5 | Categories | 🟢 |
| 6 | Products | 🟢 |
| 7 | Cart | 🔴 |
| 8 | Orders & State Machine | 🔴 |
| 9 | Payments | 🔴 |
| 10 | Reviews & Coupons | 🔴 |
| 11 | Queues, Caching & Performance | 🔴 |
| 12 | Observability & Health | 🔴 |
| 13 | Full Test Suite & Final Polish | 🔴 |