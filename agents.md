# agents.md — nestjs-ecommerce-backend

## Agent Team

This project is built by a team of AI agents. Every agent must read this file before writing a single line of code. No exceptions.

---

## Agents

### Agent 1 — Architect
- Reads phases.md and plans the implementation for the current phase
- Designs folder structure, module boundaries, and data flow
- Writes the implementation plan to docs/phase-X/implementation-plan.md
- Never writes application code — only plans

### Agent 2 — Backend Developer
- Reads agents.md and phases.md before starting
- Reads the implementation plan written by Architect
- Implements all backend code following every rule in this file strictly
- Never skips rules — not even one

### Agent 3 — Test Engineer
- Writes unit tests, integration tests, and E2E tests
- Follows the same TypeScript and coding rules as Backend Developer
- Never mocks what does not need to be mocked
- Ensures coverage target of 90%+ per phase

### Agent 4 — Reviewer
- Reviews all code written in the phase
- Checks every rule in this file is followed
- Checks Swagger decorators are present on every endpoint
- Checks no console.log exists anywhere
- Reports violations — never silently ignores them

---

## Stack — Locked, Never Change

Runtime:         Node.js (latest LTS)
Language:        TypeScript 5 — strict mode
Framework:       NestJS (latest)
HTTP Adapter:    Fastify (@nestjs/platform-fastify)
ORM:             Prisma v6.19 — PINNED, never upgrade to v7
Database:        MongoDB Atlas
Module system:   ESM — package.json type: "module"
Package manager: pnpm — never npm, never yarn
Logging:         Pino via nestjs-pino — never console.log anywhere
Docs:            Swagger (@nestjs/swagger)
Validation:      class-validator + class-transformer
HTTP client:     ky — never axios, never node fetch directly
Caching:         Redis via @nestjs/cache-manager
Queues:          BullMQ
Testing:         Vitest + supertest
E2E:             Vitest + supertest full flow
Dev Runner:      @swc-node/register — never tsx, never ts-node without swc

---

## Critical — Prisma Version Rule

Prisma is pinned to v6.19. This is non-negotiable.

MongoDB support was dropped in Prisma v7. If any agent runs pnpm update without pinning, the project breaks.

Always install Prisma like this:

    pnpm add prisma@6.19 @prisma/client@6.19

Never run pnpm update without explicitly checking prisma version stays at 6.19.

---

## Critical — ESM Rule

This project uses ESM. package.json has "type": "module". CommonJS is banned entirely.

CORRECT:
    import { UserService } from './user.service.js'
    import { PrismaService } from '@/prisma/prisma.service.js'

WRONG — never do this:
    const UserService = require('./user.service')
    module.exports = { UserService }
    import { UserService } from './user.service'   ← missing .js extension

Every import in TypeScript source files must include the .js extension. Without it Node will throw at runtime. No exceptions.

---

## Critical — Dev Runner Rule

This project uses @swc-node/register for the dev server. Never use tsx or ts-node without swc.

tsx uses esbuild which does not support emitDecoratorMetadata. This causes NestJS decorators to silently fail — dependencies inject as undefined and the app crashes at runtime with no clear error.

CORRECT in package.json scripts:
    "start:dev": "node --require @swc-node/register/esm-register src/main.ts"

WRONG — never use these:
    "start:dev": "tsx watch src/main.ts"
    "start:dev": "ts-node src/main.ts"

---

## Critical — Never Use Reflect.defineMetadata Manually

Never patch dependency injection with Reflect.defineMetadata in any file. If DI is broken, the root cause is always the dev runner or tsconfig — fix that instead.

WRONG — never do this:
    Reflect.defineMetadata('design:paramtypes', [PrismaService], HealthController)

CORRECT — fix tsconfig or dev runner instead.

---

## TypeScript Rules — Zero Tolerance

- strict mode — enabled in tsconfig, never disable any strict flag
- zero use of any — if you don't know the type, figure it out
- zero inline interfaces — all interfaces go in src/types/
- all interfaces prefixed with I — example: IUserPayload, IOrderState
- all types prefixed with T — example: TRole, TOrderStatus
- all enums PascalCase — example: OrderStatus, UserRole
- one class per file — never two classes in the same file
- named exports only — never default exports
- path aliases @/ only — never relative imports like ../../
- every folder with more than one file must have index.ts barrel file

---

## Naming Conventions

Files:           kebab-case — user.service.ts, order.controller.ts
Classes:         PascalCase — UserService, OrderController
Interfaces:      PascalCase with I prefix — IUserPayload, ICreateOrderDto
Types:           PascalCase with T prefix — TRole, TJwtPayload
Enums:           PascalCase — OrderStatus, UserRole
Variables:       camelCase — userId, orderTotal
Constants:       SCREAMING_SNAKE_CASE — JWT_SECRET, MAX_RETRY_COUNT
Decorators:      PascalCase — @CurrentUser(), @Roles(), @Public()

---

## NestJS Architecture Rules

- every feature is its own module — never mix concerns across modules
- controllers handle HTTP only — no business logic in controllers
- all business logic lives in services
- every module that has a controller must have a service — no exceptions
- controllers never contain try/catch for DB calls — that belongs in services
- controllers never inject PrismaService directly — only inject the module's own service
- services never call other module's controllers — only other services
- guards handle auth and RBAC only
- interceptors handle response transformation only
- pipes handle validation and transformation
- filters handle exceptions globally
- never use @Inject(TOKEN) without defining the provider in the module
- every module must be self-contained — import what you need, export what others need

---

## Bootstrap Architecture Rules

The app bootstrap is split into separate config files. Never dump everything into main.ts.

src/config/
  configure-app.ts     — orchestrator, calls everything in order
  fastify.config.ts    — registers helmet, cors, rate-limit, request-id hook
  middleware.config.ts — registers global filter, interceptor, validation pipe
  swagger.config.ts    — sets up Swagger UI and JSON endpoint
  index.ts             — barrel export

main.ts must stay minimal — create app, call configureApp(), get port, listen, log. Nothing else.

---

## Response Shape Rules

Business API endpoints — ALL modules except health — return this shape via TransformInterceptor:

    {
      "success": true,
      "message": "Products retrieved successfully",
      "data": { }
    }

Error responses via GlobalExceptionFilter:

    {
      "success": false,
      "message": "Unauthorized",
      "statusCode": 401,
      "path": "/api/v1/products",
      "timestamp": "2026-01-01T00:00:00.000Z"
    }

Health endpoint returns simple shape — no wrapping:

    { "status": "ok" }

Controllers return data in this shape so TransformInterceptor can wrap it:

    return {
      message: 'Products retrieved successfully',
      data: products,
    }

---

## Constants and Enums Rules

All hardcoded strings — API tags, route paths, operation descriptions,
success/error messages — must live in src/common/constants/api.constants.ts.
Never hardcode strings directly in controllers.

CORRECT:
    @ApiTags(ApiTags.PRODUCTS)
    @ApiOperation({ summary: ApiOperation.GET_ALL_PRODUCTS })

WRONG:
    @ApiTags('products')
    @ApiOperation({ summary: 'Get all products' })

The successResponseSchema helper in api.constants.ts is the standard
for all Swagger @ApiResponse decorators on business endpoints.

---

## DTO Rules

- every request body has a DTO class — never accept raw objects
- every DTO uses class-validator decorators for validation
- every DTO uses class-transformer for transformation
- DTOs live in src/modules/[feature]/dto/
- DTOs are named descriptively — CreateProductDto, UpdateOrderStatusDto
- never reuse a DTO for two different endpoints if their shape differs
- response DTOs use @Exclude() and @Expose() from class-transformer

Example:

    import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator'
    import { ApiProperty } from '@nestjs/swagger'

    export class CreateProductDto {
      @ApiProperty({ description: 'Product name', example: 'iPhone 15 Pro' })
      @IsString()
      @IsNotEmpty()
      name: string

      @ApiProperty({ description: 'Price in cents', example: 99900 })
      @IsNumber()
      @Min(0)
      price: number
    }

---

## Swagger Rules — Non-Negotiable

Every single endpoint must have Swagger decorators. No endpoint ships without them.

Example:

    @ApiTags(ApiTags.PRODUCTS)
    @ApiBearerAuth()
    @ApiOperation({ summary: ApiOperation.GET_ALL_PRODUCTS })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiResponse({ status: 200, ...successResponseSchema(productSchema, 'Products retrieved successfully') })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @Get()
    findAll() {}

Swagger UI must be available at /api/docs in development.
OpenAPI JSON must be available at /api/docs-json.

Additional rules:
- every endpoint must have @ApiResponse with schema — never description-only
- nested response objects must be separate classes with @ApiProperty()
- Swagger config options: persistAuthorization: true, displayRequestDuration: true,
  docExpansion: list, filter: true, showExtensions: true, tryItOutEnabled: true

---

## Logging Rules

- Pino is the only logger — never use console.log, console.error, console.warn
- every request gets a unique requestId (UUID) via onRequest Fastify hook
- log levels: error for failures, warn for degraded states, info for key events, debug for dev
- never log passwords, tokens, credit card numbers, or any sensitive data
- structured logs only — always log as JSON object, never plain strings

CORRECT:
    this.logger.info({ userId, orderId }, 'Order placed successfully')

WRONG:
    console.log('Order placed', orderId)
    this.logger.info('Order placed successfully')   ← no context object

---

## Error Handling Rules

- global exception filter catches all unhandled errors
- never throw raw Error — use NestJS built-in exceptions
- use HttpException, NotFoundException, UnauthorizedException, ForbiddenException, BadRequestException, ConflictException
- every exception must include a descriptive message
- never expose stack traces or internal error details to the client
- validation errors from class-validator return 400 with field-level details

---

## Auth Rules

- JWT access token — short expiry (15 minutes)
- JWT refresh token — long expiry (7 days), stored in DB, rotated on every use
- refresh token rotation — old token invalidated immediately on use
- @Public() decorator marks endpoints that skip JWT guard
- @Roles() decorator marks endpoints that require specific roles
- @CurrentUser() decorator extracts user from JWT payload in controllers
- never trust client-sent userId — always extract from JWT

---

## Security Rules

- Helmet enabled globally via @fastify/helmet
- CORS — wildcard in development, explicit CORS_ORIGIN env var in production
- @fastify/rate-limit — max 100 requests per minute globally, stricter on auth endpoints
- all passwords hashed with bcrypt — never store plain text
- environment variables validated on startup via Zod — app refuses to start if any required var is missing or wrong type
- never log sensitive data — tokens, passwords, card numbers

---

## Performance Rules

- Redis caching on all frequently-read endpoints — products list, category tree
- cursor-based pagination — never offset pagination for large datasets
- database query projection — never fetch fields you don't need
- indexes defined in Prisma schema on all fields used in where/orderBy
- BullMQ for all async work — emails, notifications, invoice generation
- never do blocking work in request handlers

---

## Testing Rules

- Vitest for all unit and integration tests
- supertest for HTTP integration tests against real Fastify app
- unit tests: test services in isolation — mock Prisma, mock external services
- integration tests: test full request to response flow
- E2E tests: test complete user journeys — register, login, place order, payment
- never test implementation details — test behavior and outcomes
- coverage target: 90%+ per phase
- test files live next to source files: user.service.spec.ts beside user.service.ts
- E2E tests live in test/e2e/

---

## Git Rules

- agents never run git commands — ever
- git is done manually by the developer after each phase passes verification
- never commit node_modules, .env, dist, generated files

---

## Verification After Every Phase (non-negotiable, run in this exact order)

1. pnpm exec tsc --noEmit               — zero TypeScript errors
2. pnpm run build                        — clean build, zero errors
3. pnpm run test                         — all unit and integration tests pass
4. pnpm run test:coverage                — coverage at 90%+
5. pnpm run test:e2e                     — all E2E tests pass
6. Manual Swagger check at /api/docs     — all endpoints documented, auth works
7. Manual Postman smoke test             — happy path flows work end to end

No phase is complete until all 7 steps pass. Never start the next phase until current phase is fully verified.

---

## Folder Structure

nestjs-ecommerce-backend/
├── src/
│   ├── common/
│   │   ├── constants/           # ApiTags, ApiRoutes, ApiOperation, successResponseSchema
│   │   ├── decorators/          # @CurrentUser(), @Roles(), @Public()
│   │   ├── filters/             # GlobalExceptionFilter
│   │   ├── guards/              # JwtAuthGuard, RolesGuard
│   │   ├── interceptors/        # TransformInterceptor
│   │   ├── pipes/               # ValidationPipe config
│   │   └── index.ts
│   ├── config/
│   │   ├── configure-app.ts
│   │   ├── fastify.config.ts
│   │   ├── middleware.config.ts
│   │   ├── swagger.config.ts
│   │   └── index.ts
│   ├── prisma/
│   │   ├── prisma.service.ts
│   │   ├── prisma.module.ts
│   │   └── index.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── dto/
│   │   │   ├── strategies/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.module.ts
│   │   │   └── index.ts
│   │   ├── users/
│   │   │   ├── dto/
│   │   │   ├── entities/
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.module.ts
│   │   │   └── index.ts
│   │   ├── categories/
│   │   ├── products/
│   │   ├── cart/
│   │   ├── orders/
│   │   ├── payments/
│   │   ├── reviews/
│   │   ├── coupons/
│   │   ├── notifications/
│   │   └── health/
│   │       ├── health.controller.ts
│   │       ├── health.module.ts
│   │       └── index.ts
│   ├── types/                   # All interfaces and types — IUserPayload, TRole etc.
│   │   └── index.ts
│   ├── app.module.ts
│   └── main.ts
├── test/
│   └── e2e/
├── docs/
│   └── phase-X/
│       ├── implementation-plan.md
│       └── walkthrough.md
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── agents.md
├── phases.md
├── ROUTES.md
├── README.md
├── PROMPTS.md
├── .env
├── .env.example
├── package.json
├── tsconfig.json
└── pnpm-lock.yaml

---

## Banned — Never Use These

- console.log / console.error / console.warn — use Pino
- axios — was compromised March 2026, use ky
- npm / yarn — use pnpm only
- require() / module.exports — ESM only, use import/export
- any — figure out the correct type
- default exports — named exports only
- relative imports like ../../ — use @/ path aliases
- Prisma v7+ — pinned to v6.19 for MongoDB support
- offset pagination — use cursor-based pagination
- storing plain text passwords — always bcrypt
- inline interfaces — all interfaces in src/types/
- tsx or ts-node without swc — use @swc-node/register
- Reflect.defineMetadata manually — fix the root cause instead

---

## Docs Rules — Updated After Every Phase

- README.md lives at project root from Phase 1 — updated after every phase with what was built
- PROMPTS.md lives at project root from Phase 1 — updated after every phase with the exact prompt used
- ROUTES.md lives at project root from Phase 1 — updated after every phase with all new routes added
- docs/phase-X/ created after every phase with two files:
  - implementation-plan.md — what the agent planned before coding
  - walkthrough.md — what was actually built, decisions made, any issues faced
- Agents never skip docs — docs are part of phase completion, not optional

---

*Every agent reads this file before writing any code. Rules are non-negotiable. When in doubt, re-read this file.*