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

## Phase 3 — Auth 🟢

### Prompt used for implementation:
"except this can u fix all the things which u listed (Zod env validation, rate-limiting rules, folder barrel indexes, type-safety improvements, and documentation walkthroughs)."

### Results:
All tests successfully passing (61 unit/integration + 10 E2E tests) with 100% test coverage.

---

## Phase 4 — Users & Seller Onboarding 🟢

### Prompts used:

1. **Review, Optimization & Refactoring**:
   ```text
   Read agents.md and phases.md carefully before doing anything.

   Your Role
   You are Agent 4 — Reviewer first, then Agent 2 — Backend Developer 
   for optimization only. Do not add new features. Do not write test 
   cases. Only review, optimize, and fix what exists.

   What Has Been Built
   - Phase 2 — Base setup, health api, filters, interceptors, config
   - Phase 3 — Auth (register, login, refresh, logout, me, JWT, guards, decorators)
   - Phase 4 — Users and seller onboarding (profile, addresses, become-seller, admin user management)
   ```

2. **Complete Test Coverage**:
   ```text
   Write complete test coverage for Phase 4. Do not touch any existing 
   passing tests. Do not modify any source files.
   ```

### Results:
Successfully implemented unit test suites and corrected E2E tests for Phase 4. All 104 unit tests and 26 E2E tests pass with **99.46%** overall statement coverage.

---

## Phase 5 — Categories 🟢

Phase 5 was built manually by the developer.
API endpoints verified in Postman and Swagger before test suite was written.

Test suite written by Antigravity AI covering:
- Unit tests for `CategoriesService` — all CRUD methods, happy paths, error branches,
  and slug/parent validation logic
- Unit tests for `CategoriesController` (admin) and `PublicCategoriesController`
- E2E tests for public category endpoints and admin access-control (401 / 403)

### What was covered in the test suite
- `createCategory` — success, slug auto-generation, duplicate slug → 409, missing parent → 404
- `findCategoryTree` — hierarchical structure, empty result, multiple roots
- `findCategoryBySlug` — success, not found → 404, empty slug → 400
- `updateCategory` — success, not found → 404, slug conflict with other record → 409, self-slug allowed
- `deleteCategory` — success, not found → 404, children unlinked before soft-delete
- Controller delegation tests for both controllers
- E2E: public GET tree and GET by slug (live DB)
- E2E: 404 on unknown slug
- E2E: 401 with no auth on admin endpoints
- E2E: 403 with customer token on admin endpoints

---

## Ad-hoc Tooling Configuration 🟢

### Prompt used:
"can u add ChromrDevTools/devtools-logo mcp server connection"

### What was done:
- Identified `chrome-devtools-mcp` as the official MCP server for browser control.
- Added `chrome-devtools` server connection to `.mcp.json`.
- Added `chrome-devtools` server connection to `.cursor/mcp.json`.
- Added `chrome-devtools` server connection to `config/mcporter.json`.
- Command used: `npx -y chrome-devtools-mcp@latest`.

---

## Phase 6 — Products 🟢

### Prompts used:

1. **Verification & Bug Fixing**:
   ```text
   the phase6 is done so what u need to do is go through the files which we changed and fix if any issues. don't write any testcases now. just check all the phase6 changes are correct or not and if any issues fix them and ket me know.
   ```

2. **Complete Test Suite Implementation**:
   ```text
   okay now test cases we need to add test cases where ever it needed chekeck the other phases how they implemneted the test cases so we also should implement the same way for phase6. can u write all those testcases without fail and run those and make sure everything is passing.
   ```

3. **Documentation & Validation Checks**:
   ```text
   okay that's so cool did u check and update the prompts, routes, phases, readme all required files right? and ofcouse u add one file similar to implementation plan chekc how its added in phase5 same way add some implementation-plan.md for phase6 as well. i guess u were able to understand what i was telling
   ```

### Results:
Successfully implemented 24 service unit tests, 13 controller unit tests, and 8 E2E product integration scenarios. Fixed critical bugs regarding cache invalidation (Keyv prefix deletion), query boolean casting (`inStock`), and test suite setup issues (mock pollution and missing E2E module imports). Overall coverage is fully verified at **94.89%** passing.

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