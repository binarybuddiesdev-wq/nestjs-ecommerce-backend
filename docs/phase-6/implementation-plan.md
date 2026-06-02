# Phase 6 — Products Implementation Plan

## Goal
Build a complete product catalog management (CRUD) system for sellers and admins, along with robust search, query filtering, pagination, and caching for customers.
Key requirements:
- Full product CRUD (create, update, soft-delete) restricted to Sellers (owners) and Admins (bypass ownership).
- Public searches, complex filter logic, sorting, and cursor-based pagination.
- Redis-backed caching on product listings.
- Image management endpoints (multipart image uploads appending/removing images).
- Related products link management endpoints.

---

## Prisma Schema — Product Model

```prisma
model Product {
  id String @id @default(auto()) @map("_id") @db.ObjectId
  name String
  slug String @unique
  description String
  brand String?
  price Float
  compareAtPrice Float?
  stock Int
  soldCount Int @default(0)
  images String[]
  tags String[]
  weight Float?
  dimensions String?
  warrantyInfo String?
  expiryDate DateTime?
  rating Float @default(0)
  ratingCount Int @default(0)
  reviewCount Int @default(0)
  relatedProductIds String[]
  categoryId String @db.ObjectId
  sellerId String @db.ObjectId
  isActive Boolean @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([categoryId])
  @@index([sellerId])
  @@index([price])
  @@index([createdAt])
  @@index([brand])
  @@index([rating])
}
```

---

## Planned Endpoints

The Phase 6 implementation covers 12 REST API endpoints under `/api/v1/products`:

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/api/v1/products` | Yes | SELLER, ADMIN | Create product (multipart) |
| GET | `/api/v1/products` | No | Public | List & search active products |
| GET | `/api/v1/products/:slug` | No | Public | Active product detail by slug |
| PATCH | `/api/v1/products/:id` | Yes | SELLER, ADMIN | Update product details |
| DELETE | `/api/v1/products/:id` | Yes | SELLER, ADMIN | Soft delete product |
| GET | `/api/v1/products/seller/products` | Yes | SELLER, ADMIN | List current seller's own products |
| GET | `/api/v1/products/admin/products` | Yes | ADMIN | List all products (includes inactive) |
| POST | `/api/v1/products/:id/images` | Yes | SELLER, ADMIN | Upload and append images |
| DELETE | `/api/v1/products/:id/images/:index` | Yes | SELLER, ADMIN | Remove image at index |
| GET | `/api/v1/products/:id/related` | No | Public | List active related products |
| POST | `/api/v1/products/:id/related` | Yes | SELLER, ADMIN | Set related product IDs |
| DELETE | `/api/v1/products/:id/related/:relatedId` | Yes | SELLER, ADMIN | Remove related product association |

---

## Module Design

- **Controller**: `ProductsController`
- **Service**: `ProductsService`
- **DTOs**:
  - `CreateProductDto` (validation for required create fields, handles brand/tags/dimensions/etc.)
  - `UpdateProductDto` (partial create schema, all fields optional)
  - `ProductQueryDto` (query validation for filtering: search, category, brand, tag, minPrice, maxPrice, inStock, sort, limit, cursor)
  - `SetRelatedProductsDto` (array of valid ObjectIds)

---

## Redis Caching Strategy

- Cache key namespace: `cache:products:list:*`
- Listing queries are cached using the serialized `ProductQueryDto` query parameters as part of the key.
- Mutations (`createProduct`, `updateProduct`, `deleteProduct`, image uploads, related product updates) trigger prefix-based cache invalidation. To invalidate correctly, the cache manager's store iterator scan is utilized to locate and delete all query-specific product list keys.

---

## Verification Plan

### Automated Tests
1. `pnpm exec tsc --noEmit` — zero type errors
2. `pnpm run build` — clean dist output
3. `pnpm run test` — all unit tests pass (tested service, controller, and DTO validations)
4. `pnpm run test:coverage` — code coverage matches the 90%+ target (reached **94.89%** overall)
5. `pnpm run test:e2e` — integration tests covering full lifecycle and access control pass

### Manual Verification
- Swagger UI at `/api/docs` — all 12 endpoints listed with appropriate authentication lock icons
- Smoke testing endpoints via Postman or HTTP client injection
