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

## Concepts

Key concepts and patterns used in this project are documented in
[docs/concepts/](docs/concepts/). Each concept gets its own markdown file
with real-world examples and in-depth explanations — useful when you're
learning a pattern for the first time.

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
| 6 | Products | 🔴 |
| 7 | Cart | 🔴 |
| 8 | Orders & State Machine | 🔴 |
| 9 | Payments | 🔴 |
| 10 | Reviews & Coupons | 🔴 |
| 11 | Queues, Caching & Performance | 🔴 |
| 12 | Observability & Health | 🔴 |
| 13 | Full Test Suite & Final Polish | 🔴 |