# Implementation Plan - Phase 4 (Users, Seller Onboarding & Admin User Management)

This document outlines the plan for building the User Profile, Addresses, Seller Onboarding, Avatar Upload, and Admin User Management features, followed by optimization and test coverage.

## Part 1 — Feature Implementation

### Proposed Changes

#### Users Module
- **DTOs**:
  - `CreateAddressDto` and `UpdateAddressDto` for managing user addresses.
  - `UpdateUserDto` for profile updates.
  - `UpdateUserRoleDto` for admin role updates.
- **Controllers**:
  - `UsersController`:
    - `GET /api/v1/users/me` — retrieve own profile.
    - `PATCH /api/v1/users/me` — update own profile name/avatar.
    - `DELETE /api/v1/users/me` — deactivate own account.
    - `POST /api/v1/users/me/become-seller` — request SELLER role.
    - `POST /api/v1/users/me/address` — add an address.
    - `GET /api/v1/users/me/address` — list addresses.
    - `PATCH /api/v1/users/me/address/:id` — update address by ID.
    - `DELETE /api/v1/users/me/address/:id` — delete address by ID.
    - `POST /api/v1/users/me/avatar` — upload avatar file (multipart).
  - `AdminUsersController`:
    - `GET /api/v1/admin/users` — list all users.
    - `PATCH /api/v1/admin/users/:id/role` — update user role.
    - `DELETE /api/v1/admin/users/:id` — soft delete user.
- **Services**:
  - `UsersService` to implement all profile, address, seller onboarding, avatar upload, and admin management logic using Prisma.

#### Cloudinary Module
- **CloudinaryService**:
  - Integrate Cloudinary SDK to handle secure image upload.

#### Prisma Schema & Types
- **Embedded Document**: Add `Address` composite type to `User` model in `prisma/schema.prisma`.
- **User Types**: Add `role` and `isActive` fields to `User` model. Define `UserRole` enum in types.

---

## Part 2 — Test Coverage & Optimization

This section outlines the plan for auditing, optimizing, and fixing the Phase 4 security and user onboarding features.

### Proposed Changes

#### Configuration
- **Swagger Options**: Update Swagger settings in `swagger.config.ts` to use `docExpansion: 'list'` and `tryItOutEnabled: true`.
- **Global Guards**: Remove duplicate manually-instantiated `useGlobalGuards` in `middleware.config.ts` to enable NestJS dependency injection using `APP_GUARD` providers.

#### API Constants & Types
- **Rename APIOperation**: Standardize uppercase naming in `api.constants.ts` by renaming `APIOperation` enum to `ApiOperation`.
- **UserRole Enum**: Define a centralized `UserRole` enum in `src/types/index.ts` to replace hardcoded `'ADMIN'`, `'SELLER'`, and `'CUSTOMER'` strings.
- **Success & Error Messages**: Extract all hardcoded exception messages and controller response strings to `api.constants.ts`.

#### Controller & Service Optimizations
- **Auth Module**: Update `AuthController` and `AuthService` to use standard messages and enums.
- **Users Module**: Add missing `@ApiTags(ApiTags.USERS)` to `UsersController` and `AdminUsersController`. Replace hardcoded route strings and controller validation parameters.
- **Cloudinary & Health Modules**: Add missing barrel `index.ts` files to cleanly expose module components.

### Verification Plan
1. `pnpm exec tsc --noEmit`
2. `pnpm run build`
3. `pnpm run test`
4. `pnpm run test:coverage`
5. `pnpm run test:e2e`
