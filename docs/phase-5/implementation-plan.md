# Phase 5 — Categories Implementation Plan

## Goal

Build a hierarchical category system with:
- Admin-only mutations (create, update, soft-delete)
- Public reads (full tree, single category by slug)
- Slug auto-generation from category name
- Redis-backed cache on the category tree endpoint

---

## Prisma Schema — Category Model

```prisma
model Category {
  id        String    @id @default(auto()) @map("_id") @db.ObjectId
  name      String
  slug      String    @unique
  parentId  String?   @db.ObjectId
  isActive  Boolean   @default(true)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  parent    Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  children  Category[] @relation("CategoryHierarchy")
}
```

Self-referential relation using `parentId` — top-level categories have `parentId: null`.

---

## Planned Endpoints

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | /api/v1/admin/categories | Yes | ADMIN | Create a category |
| GET | /api/v1/categories | No | Public | Full category tree |
| GET | /api/v1/categories/:slug | No | Public | Category by slug |
| PATCH | /api/v1/admin/categories/:id | Yes | ADMIN | Update category |
| DELETE | /api/v1/admin/categories/:id | Yes | ADMIN | Soft delete category |

---

## Module Design

**Controllers:**
- `CategoriesController` — handles admin routes at `admin/categories`
- `PublicCategoriesController` — handles public routes at `categories`

**Service:** `CategoriesService` — all business logic here

**DTOs:**
- `CreateCategoryDto` — `name` (required), `parentId` (optional)
- `UpdateCategoryDto` — `name`, `slug`, `isActive` (all optional)

---

## Slug Auto-Generation

The slug is derived from the category `name` using a shared `generateSlug` helper:

```ts
name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
```

The service checks for slug uniqueness before creating. Clients cannot pass a custom slug on creation — only on update via `UpdateCategoryDto`.

---

## Hierarchical Tree Strategy

All categories are fetched in one query (`findMany`). A Map is then used to build parent→children references in O(n), avoiding recursive DB queries or N+1 issues.

---

## Redis Caching Strategy

- Cache key: `category-tree`
- TTL: 1 hour
- Cache invalidated on: `createCategory`, `updateCategory`, `deleteCategory`
- Implementation: `@nestjs/cache-manager` injected into the service

> **Note:** The developer chose to omit Redis caching from the initial implementation to prioritize correctness. The architecture allows adding it non-invasively via the `CacheModule` in a later phase.

---

## Verification Plan

### Automated Tests
1. `pnpm exec tsc --noEmit` — zero type errors
2. `pnpm run build` — clean dist output
3. `pnpm run test` — all unit tests pass
4. `pnpm run test:coverage` — ≥90% coverage across categories module
5. `pnpm run test:e2e` — all E2E tests pass

### Manual Verification
- Swagger at `/api/docs` — all 5 endpoints listed with correct auth badges
- Postman: POST → GET tree → GET by slug → PATCH → DELETE smoke test
