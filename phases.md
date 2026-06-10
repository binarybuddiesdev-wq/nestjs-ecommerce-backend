# phases.md — nestjs-ecommerce-backend

## Status Legend
🔴 Not Started
🟡 In Progress
🟢 Complete

---

## Phase 1 — Project Scaffold & Package Installation 🟢

### Goal
Create the correct folder structure, install all required packages, and configure
TypeScript, ESM, Vitest, and Prisma. No business logic. No application code.
Just a clean foundation with the right tools installed and configured.

### What Was Done
- Created folder structure under src/ following hybrid architecture
- Installed all required packages with pnpm
- Configured package.json — type: "module", scripts for dev/build/test
- Configured tsconfig.json — strict mode, NodeNext, path aliases @/
- Configured tsconfig.build.json — excludes test files
- Configured vitest.config.ts and vitest.config.e2e.ts with SWC
- Pinned Prisma to 6.19 — pnpm add prisma@6.19 @prisma/client@6.19
- Initialized prisma/schema.prisma targeting MongoDB
- Created .env.example with all required variables documented
- Dev runner set to @swc-node/register — never tsx

### Folder Structure Created
    src/
      common/
        constants/
        decorators/
        filters/
        guards/
        interceptors/
        pipes/
        index.ts
      config/
        configure-app.ts
        fastify.config.ts
        middleware.config.ts
        swagger.config.ts
        index.ts
      prisma/
        prisma.service.ts
        prisma.module.ts
        index.ts
      modules/
        auth/
        users/
        categories/
        products/
        cart/
        orders/
        payments/
        reviews/
        coupons/
        notifications/
        health/
      types/
        index.ts
      app.module.ts
      main.ts
    test/
      e2e/
    prisma/
      schema.prisma

### Verification
- [x] Folder structure created correctly
- [x] All packages installed
- [x] tsconfig.json strict mode and NodeNext configured
- [x] Prisma pinned to 6.19
- [x] .env.example created

---

## Phase 2 — Base Setup & Health API 🟢

### Goal
Write the actual application code for the foundation. This phase is done manually
by the developer — not by AI agents. It establishes the patterns every future
phase will follow.

### Tasks

#### main.ts
- NestFactory with Fastify adapter and bufferLogs: true
- Call configureApp(app)
- Get port from ConfigService
- Listen on 0.0.0.0
- Log server started with Pino Logger

#### src/config/configure-app.ts
- app.useLogger(app.get(Logger))
- registerGlobalMiddleware(app)
- await registerFastifyPlugins(app)
- app.setGlobalPrefix('api/v1', { exclude: ['health'] })
- app.enableShutdownHooks()
- setupSwagger(app) only when NODE_ENV !== 'production'

#### src/config/fastify.config.ts
- Register @fastify/helmet with contentSecurityPolicy
- Register @fastify/cors — wildcard in dev, CORS_ORIGIN in prod
- Register @fastify/rate-limit — max 100, timeWindow 1 minute
- onRequest hook — generate UUID x-request-id on every request

#### src/config/middleware.config.ts
- Register GlobalExceptionFilter on app instance
- Register TransformInterceptor on app instance
- Register ValidationPipe — whitelist, forbidNonWhitelisted, transform

#### src/config/swagger.config.ts
- Title, description, version, addBearerAuth
- swaggerOptions — persistAuthorization, displayRequestDuration,
  docExpansion list, filter, showExtensions, tryItOutEnabled
- UI at /api/docs, JSON at /api/docs-json

#### src/common/filters/global-exception.filter.ts
- private readonly logger = new Logger(GlobalExceptionFilter.name)
- catch() extracts status and message
- Response shape: { success: false, message, statusCode, path, timestamp }
- 5xx logged as error with stack, 4xx logged as warn
- extractMessage() handles string, array, object messages

#### src/common/interceptors/transform.interceptor.ts
- TransformInterceptor wraps all responses
- Shape: { success: true, message: data?.message || 'Success', data: data?.data }
- Export IResponse<T> interface from this file

#### src/common/constants/api.constants.ts
- enum ApiTags
- enum ApiRoutes
- enum ApiOperation
- successResponseSchema() helper function
- HEALTH_SUCCESS_MESSAGE constant

#### src/types/common.types.ts
- IApiResponse<T> — { success, message, data }
- IErrorResponse — { success, message, statusCode, path, timestamp }

#### src/prisma/prisma.service.ts
- Extends PrismaClient
- Implements OnModuleInit — calls $connect()
- Implements OnModuleDestroy — calls $disconnect()

#### src/prisma/prisma.module.ts
- @Global() module
- Provides and exports PrismaService

#### src/app.module.ts
- ConfigModule with Zod env validation — strict schema
- Required vars: PORT, NODE_ENV, DATABASE_URL, CORS_ORIGIN
- App refuses to start if any var is missing or wrong type
- PrismaModule registered
- LoggerModule (nestjs-pino) registered

#### src/modules/health/health.controller.ts
- GET /health
- @Public() — no auth required
- Returns { status: 'ok' }
- Full Swagger decorators using ApiTags and ApiOperation enums

#### src/modules/health/health.module.ts
- Registers HealthController

### Test Tasks
- Unit test for GlobalExceptionFilter
- Unit test for TransformInterceptor
- Unit test for env validation — missing vars throw on startup
- Unit test for PrismaService connection lifecycle
- Unit test for HealthController
- E2E test — GET /health returns 200 with { status: 'ok' }
- E2E test — invalid route returns { success: false, message, statusCode, path, timestamp }

### Verification
- [x] pnpm exec tsc --noEmit
- [x] pnpm run build
- [x] pnpm run test
- [x] pnpm run test:coverage — 90%+
- [x] pnpm run test:e2e
- [x] GET http://localhost:3000/health returns { status: 'ok' }
- [x] http://localhost:3000/api/docs loads in browser
- [x] Non-existent route returns correct error shape
- [x] Missing env var blocks app startup

---

## Phase 3 — Auth 🟢

### Goal
JWT access + refresh token rotation. RBAC with Customer, Seller, Admin roles.
Custom decorators. This is the security foundation everything else depends on.

### Tasks
- User schema in Prisma — id, email, password, role, createdAt, updatedAt
- RefreshToken schema — id, token, userId, expiresAt, isRevoked
- Register endpoint POST /api/v1/auth/register
- Login endpoint POST /api/v1/auth/login — returns access token + refresh token
- Refresh endpoint POST /api/v1/auth/refresh — rotates refresh token, old one invalidated immediately
- Logout endpoint POST /api/v1/auth/logout — revokes refresh token
- Get current user GET /api/v1/auth/me
- Passport JWT strategy — validates access token
- JwtAuthGuard — global, applied to all routes by default
- @Public() decorator — marks endpoints that skip auth
- RolesGuard — checks roles on protected endpoints
- @Roles() decorator — UserRole.ADMIN, UserRole.SELLER, UserRole.CUSTOMER
- @CurrentUser() decorator — extracts IUserPayload from JWT in controllers
- bcrypt password hashing
- Access token expiry: 15 minutes
- Refresh token expiry: 7 days
- Rate limiting on auth endpoints — stricter than global
- Full Swagger docs on all auth endpoints

### Test Tasks
- Register with valid data creates user and returns tokens
- Register with duplicate email returns 409
- Login with correct credentials returns tokens
- Login with wrong password returns 401
- Refresh with valid token rotates successfully
- Refresh with revoked token returns 401
- Logout revokes token
- Protected endpoint without token returns 401
- Protected endpoint with wrong role returns 403
- @Public() endpoint accessible without token

### Verification
- [x] pnpm exec tsc --noEmit
- [x] pnpm run build
- [x] pnpm run test
- [x] pnpm run test:coverage
- [x] pnpm run test:e2e
- [x] All auth endpoints visible in Swagger with lock icon
- [x] Token rotation verified in Postman

---

## Phase 4 — Users & Seller Onboarding 🟢

### Goal
User profile management. Address management. Seller onboarding flow.
Admins can manage all users.

### Tasks
- GET /api/v1/users/me — get own profile
- PATCH /api/v1/users/me — update own profile (name, avatar)
- DELETE /api/v1/users/me — soft delete own account
- POST /api/v1/users/me/addresses — add address
- GET /api/v1/users/me/addresses — list addresses
- PATCH /api/v1/users/me/addresses/:id — update address
- DELETE /api/v1/users/me/addresses/:id — delete address
- POST /api/v1/users/me/become-seller — customer requests seller role
- GET /api/v1/admin/users — Admin only, list all users with filters and cursor pagination
- PATCH /api/v1/admin/users/:id/role — Admin only, change user role
- DELETE /api/v1/admin/users/:id — Admin only, soft delete user
- Address embedded document in User schema
- Cloudinary image upload for avatar

### Test Tasks
- User can update own profile
- User cannot update another user's profile
- Address CRUD works correctly
- Seller onboarding changes role correctly
- Admin can list and manage all users
- Non-admin cannot access admin endpoints

### Verification
- [x] pnpm exec tsc --noEmit
- [x] pnpm run build
- [x] pnpm run test
- [x] pnpm run test:coverage
- [x] pnpm run test:e2e
- [x] All endpoints in Swagger

---

## Phase 5 — Categories 🟢

### Goal
Hierarchical category tree. Admin only for mutations. Public for reads.

### Tasks
- Category schema — id, name, slug, parentId (self-relation), isActive
- POST /api/v1/admin/categories — create category, optional parentId for subcategory
- GET /api/v1/categories — public, returns full category tree
- GET /api/v1/categories/:slug — public, single category with children
- PATCH /api/v1/admin/categories/:id — update name, slug, isActive
- DELETE /api/v1/admin/categories/:id — soft delete, only if no active products
- Slug auto-generated from name, must be unique
- Redis cache on GET /api/v1/categories — invalidated on any category mutation
- Full Swagger docs

### Test Tasks
- Category tree returns correct hierarchical structure
- Subcategory correctly linked to parent
- Slug uniqueness enforced
- Category with active products cannot be deleted
- Cache invalidated after mutation
- Only admin can create/update/delete

### Verification
- [x] pnpm exec tsc --noEmit
- [x] pnpm run build
- [x] pnpm run test
- [x] pnpm run test:coverage
- [x] pnpm run test:e2e
- [x] Category tree visible in Swagger response

---

## Phase 6 — Products 🟢

### Goal
Full product CRUD for Sellers. Public search, filter, pagination for Customers.
Sellers can only manage their own products.

### Tasks (12 API Endpoints + 1 Enhancement)

**API Endpoints (12/12)**
- POST /api/v1/products — Create (Seller/Admin, multipart) ✅
- GET /api/v1/products — List (Public, filters: category, brand, tag, price range, inStock, full-text search name+description, cursor pagination, sort) ✅
- GET /api/v1/products/:slug — Detail (Public, active only) ✅
- PATCH /api/v1/products/:id — Update (Seller/Admin, multipart, all fields, ADMIN bypasses ownership) ✅
- DELETE /api/v1/products/:id — Soft delete (Seller/Admin, idempotent, ADMIN bypass) ✅
- GET /api/v1/seller/products — Own products (Seller, cursor pagination) ✅
- GET /api/v1/admin/products — All products (Admin, includes inactive, cursor pagination) ✅
- POST /api/v1/products/:id/images — Add images (Seller/Admin, multipart, appends) ✅
- DELETE /api/v1/products/:id/images/:index — Remove image by index (Seller/Admin, validates bounds) ✅
- GET /api/v1/products/:id/related — Related products (Public, resolves IDs to full objects, active only) ✅
- POST /api/v1/products/:id/related — Set related (Seller/Admin, validates IDs exist) ✅
- DELETE /api/v1/products/:id/related/:relatedId — Remove related (Seller/Admin) ✅

**Enhancements**
- Redis cache on GET /api/v1/products — invalidated on mutation 🟢

### Test Tasks
- Seller can create and manage own products
- Seller cannot modify another seller's product
- Public search returns correct results
- Filters work correctly in combination
- Cursor pagination returns correct pages
- Out of stock products filtered correctly
- Cache invalidated on product update
- Tag filter returns correct results
- Image management endpoints work for existing products
- Related products endpoints return correct data
- Seller can add/remove related product links

### Verification
- [x] pnpm exec tsc --noEmit
- [x] pnpm run build
- [x] pnpm run test
- [x] pnpm run test:coverage
- [x] pnpm run test:e2e
- [x] Search and filters tested in Postman
- [x] Swagger shows all query params

---

## Phase 7 — Cart 🟢

### Goal
Cart management for Customers. Price calculation with stock validation.

### Tasks (4 API Endpoints)

- Cart schema — embedded items[] with productId, quantity
- CartItem type — productId, quantity, product (runtime resolved)
- POST /api/v1/cart/items — add item to cart, creates cart if first item, validates stock ✅
- GET /api/v1/cart — get own cart with live prices and computed totals ✅
- PATCH /api/v1/cart/items/:productId — update item quantity, validates stock ✅
- DELETE /api/v1/cart/items — remove one or more items by productIds ✅
- Stock validation on add and update ✅
- Price and product info resolved on read — always live ✅
- Cart total calculated on read ✅
- One cart per user — lookup by userId ✅
- Full Swagger docs on all endpoints ✅
- 189 unit tests passing across 29 test files ✅

### Test Tasks
- CartController delegates correctly to CartService (5 unit tests)
- CartService addItem — creates cart if not exists, increments quantity on repeated add
- CartService addItem — rejects overselling (stock < requested)
- CartService getCart — returns cart with computed totals
- CartService getCart — returns empty cart shape when no cart exists
- CartService getCart — throws ProductNotFoundException for inactive/deleted products
- CartService removeItems — removes items and recalculates totals
- CartService removeItems — throws CartNotFoundException when cart empty
- CartService updateCartItem — updates quantity and recalculates totals
- CartService updateCartItem — validates stock on update
- CartService updateCartItem — throws ProductNotFoundException for missing items
- Cart enums and types exported correctly
- DTOs validate correctly (empty productId, zero quantity, missing fields)
- All success/error messages match api.constants.ts constants

### Verification
- [x] pnpm exec tsc --noEmit
- [x] pnpm run build
- [x] pnpm run test — 189 passed
- [ ] pnpm run test:coverage
- [ ] pnpm run test:e2e
- [ ] Cart flow tested end to end in Postman

---

## Phase 8 — Orders & State Machine 🟡

### Goal
Order placement from cart. Inventory reservation. Order state machine with valid
transitions only. Most complex business logic phase.

### Tasks
- Order schema — id, customerId, items[], status, totalAmount, shippingAddress, couponId, createdAt
- OrderItem embedded — productId, sellerId, name, price, quantity
- OrderStatus enum — PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED
- POST /api/v1/orders — place order from cart, reserve inventory atomically
- GET /api/v1/orders — Customer: own orders. Admin: all orders
- GET /api/v1/orders/:id — order detail, customer can only see own
- PATCH /api/v1/orders/:id/status — status transition with role-based validation
- Valid state transitions enforced — no jumping states
- Inventory reservation on order placement — decrement stock
- Inventory release on cancellation — increment stock back
- Cart cleared after successful order placement
- Coupon applied and validated at order time if provided
- BullMQ job queued on order placement
- Cursor-based pagination on order lists
- Full Swagger docs

### Test Tasks
- Order placement decrements stock correctly
- Order placement clears cart
- Invalid state transition rejected
- Customer cannot transition to seller-only states
- Seller cannot transition to admin-only states
- Cancellation restores inventory
- Order with insufficient stock rejected
- Coupon validation works at order time

### Verification
- [ ] pnpm exec tsc --noEmit
- [ ] pnpm run build
- [ ] pnpm run test
- [ ] pnpm run test:coverage
- [ ] pnpm run test:e2e
- [ ] Full order flow tested in Postman
- [ ] State machine transitions verified

---

## Phase 9 — Payments 🔴

### Goal
Stripe payment integration. Webhook handling. Idempotency.

### Tasks
- Payment schema — id, orderId, stripePaymentIntentId, amount, currency, status, createdAt
- PaymentStatus enum — PENDING, SUCCEEDED, FAILED, REFUNDED
- POST /api/v1/payments/create-intent — create Stripe PaymentIntent for an order
- POST /api/v1/payments/webhook — Stripe webhook handler with signature verification
- Idempotency — webhook handler safe to receive same event multiple times
- GET /api/v1/payments/:orderId — get payment status for an order
- Full Swagger docs

### Test Tasks
- PaymentIntent created correctly for order amount
- Webhook succeeds — order status updated to CONFIRMED
- Webhook fails — order cancelled, inventory restored
- Duplicate webhook event handled idempotently
- Invalid Stripe signature rejected with 400
- Customer can only view own payment status

### Verification
- [ ] pnpm exec tsc --noEmit
- [ ] pnpm run build
- [ ] pnpm run test
- [ ] pnpm run test:coverage
- [ ] pnpm run test:e2e
- [ ] Stripe webhook tested with Stripe CLI
- [ ] Idempotency verified with duplicate events

---

## Phase 10 — Reviews & Coupons 🔴

### Goal
Product reviews with one-per-customer-per-product enforcement.
Coupon system with validation rules.

### Tasks

### Reviews
- Review schema — id, productId, customerId, rating, comment, createdAt
- POST /api/v1/products/:id/reviews — customer posts review, must have delivered order
- GET /api/v1/products/:id/reviews — public, paginated
- PATCH /api/v1/reviews/:id — customer edits own review
- DELETE /api/v1/reviews/:id — customer deletes own, admin deletes any
- One review per customer per product enforced
- Product average rating updated on review create/update/delete

### Coupons
- Coupon schema — id, code, discountType, discountValue, minOrderValue, maxUses, usedCount, expiresAt, isActive
- POST /api/v1/admin/coupons — Admin creates coupon
- GET /api/v1/admin/coupons — Admin lists all coupons
- PATCH /api/v1/admin/coupons/:id — Admin updates coupon
- DELETE /api/v1/admin/coupons/:id — Admin deactivates coupon
- POST /api/v1/coupons/validate — Customer validates coupon before applying

### Test Tasks
- Customer cannot review product without delivered order
- Duplicate review rejected
- Average rating recalculated correctly
- Coupon validation rejects expired coupons
- Coupon validation rejects over-limit coupons
- Flat and percentage discounts calculated correctly
- Min order value enforced

### Verification
- [ ] pnpm exec tsc --noEmit
- [ ] pnpm run build
- [ ] pnpm run test
- [ ] pnpm run test:coverage
- [ ] pnpm run test:e2e
- [ ] Review and coupon flows in Postman

---

## Phase 11 — Queues, Caching & Performance 🔴

### Goal
BullMQ queues for async work. Redis caching strategy. Rate limiting.
Performance optimization across the board.

### Tasks

### BullMQ Queues
- Email queue — order confirmation, password reset, seller onboarding
- Notification queue — order status change alerts
- Queue dashboard — Bull Board at /admin/queues (Admin only)
- Dead letter handling — failed jobs retried 3 times with backoff
- Workers as NestJS processors

### Redis Caching
- Product list cache — TTL 5 minutes, invalidated on product mutation
- Category tree cache — TTL 1 hour, invalidated on category mutation
- Cache keys pattern: cache:{resource}:{params-hash}
- @nestjs/cache-manager consistently — never raw Redis calls in services

### Rate Limiting
- Global: 100 requests per minute per IP
- Auth endpoints: 10 requests per minute per IP
- @Throttle() decorator for per-endpoint overrides

### Performance
- Database indexes reviewed and finalized across all schemas
- Query projection on all Prisma queries — no over-fetching
- Compression middleware enabled

### Test Tasks
- Queue jobs created correctly on order placement
- Failed jobs retried with correct backoff
- Cache returns cached response on second request
- Cache invalidated after mutation
- Rate limiting returns 429 after threshold
- Auth rate limiting stricter than global

### Verification
- [ ] pnpm exec tsc --noEmit
- [ ] pnpm run build
- [ ] pnpm run test
- [ ] pnpm run test:coverage
- [ ] pnpm run test:e2e
- [ ] Bull Board accessible at /admin/queues
- [ ] Cache behavior verified in Postman
- [ ] Rate limiting verified with rapid requests

---

## Phase 12 — Observability & Health 🔴

### Goal
Production-grade logging, request tracing, and health checks.
Every request traceable end to end.

### Tasks
- Pino logger finalized — correct log levels per environment
- Structured log format verified — all logs parseable as JSON
- GET /health enhanced — database status, redis status, uptime
- GET /health/ready — readiness probe
- GET /health/live — liveness probe
- Graceful shutdown — drain in-flight requests before closing

### Test Tasks
- Every response has X-Request-Id header
- /health returns all subsystem statuses
- Graceful shutdown completes in-flight requests

### Verification
- [ ] pnpm exec tsc --noEmit
- [ ] pnpm run build
- [ ] pnpm run test
- [ ] pnpm run test:coverage
- [ ] Health endpoints verified in Postman
- [ ] Logs verified as valid JSON in terminal

---

## Phase 13 — Full Test Suite & Final Polish 🔴

### Goal
Complete unit, integration, and E2E test coverage. 90%+ coverage.
Clean codebase ready for resume and interviews.

### Tasks

### Testing
- Unit tests for all services — mocked Prisma, mocked Redis, mocked external services
- Integration tests for all controllers — real Fastify app, mocked DB
- E2E tests covering full user journeys:
  - Customer: register → login → browse products → add to cart → place order → pay → track order
  - Seller: register → become seller → create product → manage inventory → fulfill order
  - Admin: login → manage users → manage categories → manage coupons → view all orders
- Coverage report verified at 90%+

### Final Polish
- All Swagger docs reviewed — every endpoint has summary, response schemas, auth requirement
- .env.example updated with all variables
- README.md finalized — setup guide, env vars, how to run, how to test, API overview
- PROMPTS.md finalized — all prompts used per phase
- Seed script finalized — realistic data for all entities
- Dead code removed
- No console.log anywhere — verified by grep
- No any types — verified by tsc

### Verification
- [ ] pnpm exec tsc --noEmit — zero errors
- [ ] pnpm run build — clean build
- [ ] pnpm run test — all pass
- [ ] pnpm run test:coverage — 90%+
- [ ] pnpm run test:e2e — all pass
- [ ] Swagger UI reviewed end to end
- [ ] README verified — someone new can set up from scratch
- [ ] grep -r "console.log" src/ — returns nothing
- [ ] grep -r ": any" src/ — returns nothing

---

## Progress Tracker

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Project Scaffold & Package Installation | 🟢 |
| 2 | Base Setup & Health API | 🟢 |
| 3 | Auth | 🟢 |
| 4 | Users & Seller Onboarding | 🟢 |
| 5 | Categories | 🟢 |
| 6 | Products | 🟢 |
| 7 | Cart | 🟢 |
| 8 | Orders & State Machine | 🟡 |
| 9 | Payments | 🔴 |
| 10 | Reviews & Coupons | 🔴 |
| 11 | Queues, Caching & Performance | 🔴 |
| 12 | Observability & Health | 🔴 |
| 13 | Full Test Suite & Final Polish | 🔴 |

---

*Never start a phase until the previous one passes all verification steps. Git push after every phase.*