# Walkthrough - Phase 3 (Auth)

This walkthrough details the design decisions, implemented features, and verification of the Phase 3 (Auth) security foundation.

## Features Implemented

### 1. Database & Security Foundation
- Created `User` and `RefreshToken` schemas inside MongoDB using Prisma v6.19.
- Integrated `bcrypt` password hashing for registration and credentials verification.
- Enforced JWT Access Token expiry of 15 minutes and Refresh Token rotation of 7 days.
- Implemented **Refresh Token Rotation (RTR)**: when a refresh token is used, it is immediately revoked (`isRevoked: true`), and a new pair of access/refresh tokens is generated.

### 2. Guards & Decorators
- Created custom `JwtAuthGuard` applied as a global APP_GUARD.
- Created custom `@Public()` decorator to allow selected endpoints to bypass auth.
- Created custom `@CurrentUser('key')` parameter decorator to retrieve the user's payload safely.
- Created custom `RolesGuard` applied globally to verify role-based permissions via `@Roles('ADMIN', 'SELLER')`.

### 3. Structured Logging & Rate Limiting
- Configured Pino logger via `@InjectPinoLogger` to track key auth events (registrations, logins, token refreshes, logouts) without logging PII (email, tokens).
- Integrated path-based rate-limiting rules in `@fastify/rate-limit` configuration, restricting auth endpoints `/api/v1/auth/*` to a maximum of 10 requests per minute.

### 4. Startup Zod Validation
- Configured Zod-based validation schema on startup inside `ConfigModule.forRoot` to verify all required configuration environment variables (with conditional fallback for tests).

## Verification Results

All automated tests passed successfully with 100% coverage:
- **Unit and integration tests:** 61 tests passed.
- **E2E tests:** 10 tests passed.
- **TypeScript compilation:** Completed with zero errors.
