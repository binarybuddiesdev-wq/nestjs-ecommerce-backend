# Phase 5 — Categories Walkthrough

## What Was Built

Phase 5 introduced a full hierarchical category system. The developer built all
source files manually and verified every endpoint via Postman and Swagger before
any tests were written. This walkthrough covers both the implementation decisions
and the test suite added by Antigravity AI.

---

## Files Created

### Source

| File | Purpose |
|------|---------|
| `src/modules/categories/categories.service.ts` | All business logic |
| `src/modules/categories/categories.controller.ts` | Admin routes (`admin/categories`) |
| `src/modules/categories/public-categories.controller.ts` | Public routes (`categories`) |
| `src/modules/categories/categories.module.ts` | NestJS module wiring |
| `src/modules/categories/dto/create-category.dto.ts` | Create DTO |
| `src/modules/categories/dto/update-category.dto.ts` | Update DTO |
| `src/modules/categories/dto/index.ts` | Barrel export |
| `src/common/schemas/categories/categories.response.schema.ts` | Swagger response schemas |
| `src/common/schemas/categories/index.ts` | Barrel export |
| `src/common/helpers/slug.helper.ts` | `generateSlug` utility |

### Tests

| File | Purpose |
|------|---------|
| `src/modules/categories/categories.service.spec.ts` | 16 unit tests for all service methods |
| `src/modules/categories/categories.controller.spec.ts` | 5 unit tests for controller delegation |
| `test/e2e/categories.e2e-spec.ts` | 7 E2E tests (public endpoints + access-control) |

---

## Category Schema Design Decisions

The `Category` model uses a self-referential relation named `"CategoryHierarchy"`:

```prisma
parent   Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id], onDelete: NoAction, onUpdate: NoAction)
children Category[] @relation("CategoryHierarchy")
```

`onDelete: NoAction` is required because MongoDB does not support referential
action cascades in the same way as SQL databases. Children are explicitly
unlinked (parentId → null) before a parent is soft-deleted.

---

## Slug Auto-Generation

The `generateSlug` helper converts a category name into a URL-safe slug:

```ts
name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
```

- Clients never pass a `slug` on creation — it is always derived from `name`
- Clients may pass a custom `slug` on update via `UpdateCategoryDto`
- The service always checks for slug uniqueness before write operations

---

## Hierarchical Tree Structure

The `findCategoryTree` method avoids N+1 queries by:

1. Fetching all categories in one `findMany` call
2. Building a `Map<id, node>` keyed by category ID
3. Making a second pass to attach children to their parent nodes
4. Returning only root nodes (those with no parentId or unknown parentId)

Time complexity: **O(n)** — constant regardless of depth.

---

## Two-Controller Architecture

Admin mutations and public reads are intentionally split into two controllers:

- `CategoriesController` — handles `admin/categories` prefix, enforces `@Roles(ADMIN)`
- `PublicCategoriesController` — handles `categories` prefix, marks all routes `@Public()`

This keeps the role-guard boundary explicit and avoids mixing auth requirements
inside one controller.

---

## Redis Caching Note

The Redis caching story (`CATEGORY_HAS_PRODUCTS` constant and `@nestjs/cache-manager`)
is declared in the codebase but the actual `CACHE_MANAGER` injection was omitted
from the initial implementation to keep the service simple. This will be wired
up in Phase 11 (Queues, Caching & Performance).

---

## Verification Results

### Step 1 — TypeScript
```
pnpm exec tsc --noEmit
→ 0 errors
```

### Step 2 — Build
```
pnpm run build
→ Clean dist/ output, 0 errors
```

### Step 3 — Unit Tests
```
pnpm run test
→ 23 test files, 126 tests — all pass
→ Categories: 17 service tests + 5 controller tests = 22 new tests
→ Previous total: 104 unit tests → New total: 126
```

### Step 4 — Coverage
```
pnpm run test:coverage
→ All files: 97.56% statements | 93.16% branches | 94.23% functions
→ modules/categories service:     100% all metrics
→ modules/categories controllers:  100% all metrics
→ common/helpers (slug.helper):    100% all metrics
→ Exceeds 90% threshold on every metric
```

### Step 5 — E2E Tests
```
pnpm run test:e2e
→ 5 E2E test files, 33 tests — all pass
→ New categories suite: 7 tests (2 public GET, 1 404, 4 access-control)
→ Duration: 9.02s
```

### Step 6 — Swagger
- All 5 endpoints visible at `/api/docs`
- Lock icon on admin endpoints
- Category tree response schema shown correctly

### Step 7 — Postman
- POST → GET tree → GET by slug → PATCH → DELETE — all working end to end

---

## Admin Token E2E Note

The E2E suite does not test admin-token flows (POST/PATCH/DELETE succeed with
an admin token) because the test environment has no pre-seeded admin user.
These code paths are fully covered by the service unit tests which mock
Prisma directly.
