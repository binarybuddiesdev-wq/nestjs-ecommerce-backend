# Implementation Plan - Phase 3 (Auth)

This document details the plan for introducing authentication and authorization mechanisms, establishing JWT access and refresh token flows, and implementing Role-Based Access Control (RBAC).

## Goal
Implement a security foundation based on JWT access and refresh token rotation with RBAC containing Customer, Seller, and Admin roles.

## Proposed Changes

### Database Layer (Prisma)
- Introduce `User` model containing `id`, `email`, `password`, `role` (default: `"CUSTOMER"`), `createdAt`, and `updatedAt`.
- Introduce `RefreshToken` model containing `id`, `token`, `userId`, `expiresAt`, `isRevoked`, and `createdAt` (for token rotation).

### Auth Module
- **DTOs:** Create validation schemas for register, login, and token refresh.
- **Service:** Implement password hashing (bcrypt), credentials validation, access/refresh token generation, refresh token rotation (revocation on use), and logout (revocation of all tokens).
- **Controller:** Map HTTP endpoints:
  - `POST /auth/register` (Public)
  - `POST /auth/login` (Public)
  - `POST /auth/refresh` (Public)
  - `POST /auth/logout` (Bearer Auth)
  - `GET /auth/me` (Bearer Auth)

### Common Guards & Decorators
- **Strategies:** Implement Passport `JwtStrategy`.
- **Guards:** Create `JwtAuthGuard` (applied globally) and `RolesGuard`.
- **Decorators:**
  - `@Public()` to bypass global authentication.
  - `@Roles(...)` to configure allowed roles.
  - `@CurrentUser(...)` to extract user payload from JWT request.
