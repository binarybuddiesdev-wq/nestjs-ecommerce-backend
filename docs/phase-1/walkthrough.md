# Phase 1 Walkthrough — Project Scaffold & Package Installation

## Status: 🟢 Complete

## What Was Built
Empty folder structure and package installation only. No application code written.
All code for the base setup is written in Phase 2 manually by the developer.

## Issues Encountered

### tsx does not support emitDecoratorMetadata
The initial attempt used tsx as the dev runner. tsx uses esbuild internally which
silently drops TypeScript decorator metadata. This caused NestJS dependency injection
to fail at runtime — services were injecting as undefined with no clear error message.

Fix: switched to @swc-node/register which fully supports emitDecoratorMetadata.

### AI agent used Reflect.defineMetadata as workaround
During the first attempt the agent patched individual files with manual
Reflect.defineMetadata calls instead of fixing the root cause. This was
identified and rejected. Rule added to agents.md — never use Reflect.defineMetadata.

### Response shape mismatch
First attempt used { data, error, meta } shape. This was replaced with
{ success, message, data } for business APIs to match the pattern from
the reference project.

### Bootstrap was dumped into main.ts
First attempt put helmet, cors, swagger, validation pipe, and request ID hook
all in main.ts. Replaced with split config files following the reference project pattern.

## Lessons Learned
- Always use @swc-node/register with NestJS — never tsx
- Split bootstrap code into separate config files from the start
- Define response shapes before writing any code
- Centralize all string constants into enums before phase 1 is done