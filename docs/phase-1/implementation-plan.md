# Phase 1 Implementation Plan — Project Scaffold & Package Installation

## Status: 🟢 Complete

## Goal
Create the correct folder structure, install all required packages, and configure
TypeScript, ESM, Vitest, and Prisma. No business logic. No application code.

---

## What Was Done

### Folder Structure
Created hybrid architecture under src/ combining patterns from two reference
projects — modules/ wrapper for scale, entities/ folder inside each module,
global common/ for shared guards and decorators.

### Packages Installed
- NestJS core — @nestjs/common, @nestjs/core, @nestjs/platform-fastify
- Fastify plugins — @fastify/helmet, @fastify/cors, @fastify/rate-limit, @fastify/static
- Prisma — pinned to 6.19, @prisma/client pinned to 6.19
- Pino logging — nestjs-pino, pino, pino-pretty
- Swagger — @nestjs/swagger
- Validation — class-validator, class-transformer, zod
- Auth (for Phase 3) — @nestjs/jwt, @nestjs/passport, passport, passport-jwt, bcrypt
- Dev runner — @swc-node/register, @swc/core
- Testing — vitest, @vitest/coverage-v8, supertest, unplugin-swc
- Build — tsc-alias

### Configuration Files
- package.json — type: "module", scripts for dev/build/test, pnpm onlyBuiltDependencies
- tsconfig.json — strict mode, module: NodeNext, moduleResolution: NodeNext, paths @/*
- tsconfig.build.json — excludes test files and vitest configs
- vitest.config.ts — SWC compiler, path alias resolution, coverage thresholds 90%
- vitest.config.e2e.ts — separate E2E config with SWC
- nest-cli.json — NestJS CLI configuration
- .env.example — all required variables documented
- prisma/schema.prisma — targeting MongoDB Atlas

### Key Decisions Made
- @swc-node/register chosen over tsx — tsx uses esbuild which does not support
  emitDecoratorMetadata, causing NestJS decorators to silently fail at runtime
- Never use Reflect.defineMetadata manually — if DI is broken fix the runner
- Hybrid folder structure — modules/ wrapper kept, entities/ added inside modules
- Bootstrap split into configure-app.ts, fastify.config.ts, middleware.config.ts,
  swagger.config.ts — keeps main.ts minimal and clean
- Response shape for business APIs: { success, message, data }
- Error shape: { success: false, message, statusCode, path, timestamp }
- Health endpoint: { status: 'ok' } — simple, no wrapping
- Constants and enums centralized in src/common/constants/api.constants.ts
- Prisma pinned to 6.19 — v7 dropped MongoDB support

---

## Verification
- [x] Folder structure created correctly
- [x] All packages installed via pnpm
- [x] tsconfig.json strict mode and NodeNext configured
- [x] Prisma pinned to 6.19
- [x] .env.example created with all required variables
- [x] vitest.config.ts and vitest.config.e2e.ts configured with SWC