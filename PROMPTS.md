# Prompt History — nestjs-ecommerce-backend

---

## Phase 1 — Project Scaffold & Package Installation 🟢

This phase was completed manually by the developer.

### What was done manually
- Created folder structure under src/ following hybrid architecture
- Installed all packages with pnpm
- Configured package.json, tsconfig.json, tsconfig.build.json
- Configured vitest.config.ts and vitest.config.e2e.ts with SWC
- Pinned Prisma to 6.19
- Initialized prisma/schema.prisma targeting MongoDB
- Created .env.example
- Set dev runner to @swc-node/register

### Key decisions made
- Switched from tsx to @swc-node/register — tsx uses esbuild which does not
  support emitDecoratorMetadata, causing NestJS decorators to silently fail
- Hybrid folder structure adopted — modules/ wrapper kept for scale,
  entities/ folder inside each module from friend's project pattern
- Bootstrap split into configure-app.ts, fastify.config.ts,
  middleware.config.ts, swagger.config.ts — keeps main.ts minimal
- Response shape for business APIs: { success, message, data }
- Error shape: { success: false, message, statusCode, path, timestamp }
- Health endpoint returns simple { status: 'ok' } — no wrapping
- Constants and enums centralized in src/common/constants/api.constants.ts
- Never use Reflect.defineMetadata manually — fix root cause instead

### Lessons learned
- tsx does not support emitDecoratorMetadata — never use it with NestJS
- Prisma v7 dropped MongoDB support — must pin to 6.19
- Nesting code blocks inside markdown code blocks breaks formatting —
  avoid that in all future docs

---

## Phase 2 — Base Setup & Health API 🟢

### Prompt used for test suite

Read agents.md and phases.md carefully before doing anything.

Context: Phase 2 base setup is already complete and working. The developer
built everything manually. The server starts, health endpoint works, Swagger
loads. Do not touch any existing code. Your only job is to write the test
suite for Phase 2.

Tests written:
- src/common/filters/http-exception.filter.spec.ts
- src/common/interceptors/transform.interceptor.spec.ts
- src/prisma/prisma.service.spec.ts
- src/modules/health/health.controller.spec.ts
- src/common/constants/api.constants.spec.ts
- test/e2e/health.e2e-spec.ts

Results: all passed, 96.66% branch coverage, 100% everything else.

---

## Phase 3 — Auth 🔴

Prompts will be recorded here when phase starts.

---

## Phase 4 — Users & Seller Onboarding 🔴

Prompts will be recorded here when phase starts.

---

## Phase 5 — Categories 🔴

Prompts will be recorded here when phase starts.

---

## Phase 6 — Products 🔴

Prompts will be recorded here when phase starts.

---

## Phase 7 — Cart 🔴

Prompts will be recorded here when phase starts.

---

## Phase 8 — Orders & State Machine 🔴

Prompts will be recorded here when phase starts.

---

## Phase 9 — Payments 🔴

Prompts will be recorded here when phase starts.

---

## Phase 10 — Reviews & Coupons 🔴

Prompts will be recorded here when phase starts.

---

## Phase 11 — Queues, Caching & Performance 🔴

Prompts will be recorded here when phase starts.

---

## Phase 12 — Observability & Health 🔴

Prompts will be recorded here when phase starts.

---

## Phase 13 — Full Test Suite & Final Polish 🔴

Prompts will be recorded here when phase starts.