# nestjs-ecommerce-backend — GEMINI.md

## Core Rules
All architecture rules, stack decisions, naming conventions, agent workflows,
and coding standards are defined in `agents.md`. Read that file fully before
doing anything in this project. It is non-negotiable.

Also read `phases.md` to understand current phase and what's been completed.
Also read `ROUTES.md` to understand all existing routes.

---


## Logseq Memory (MANDATORY — HIGHEST PRIORITY)

This project uses Logseq as the persistent knowledge base via the logseq MCP tool.

### BEFORE responding to ANY message — no exceptions:

* Read `projects/nestjs-ecommerce-backend` from Logseq
* Read `global/preferences` from Logseq
* If Logseq is unreachable, say so immediately and ask the user to open it before continuing

### AFTER every meaningful action — no exceptions:

* Any important decision made → update `projects/nestjs-ecommerce-backend` immediately
* Any bug fixed → update with root cause and exact fix applied
* Any new pattern, architecture, or backend workflow → update `projects/nestjs-ecommerce-backend`
* Any API contract, validation rule, or DTO change → update `projects/nestjs-ecommerce-backend`
* Any database schema, migration, or Prisma model change → update `projects/nestjs-ecommerce-backend`
* Any authentication, authorization, or security-related implementation → update `projects/nestjs-ecommerce-backend`
* Any performance optimization or caching strategy → update `projects/nestjs-ecommerce-backend`
* Any correction or preference from the user → update `global/preferences` immediately
* Never wait until end of session — update continuously as work progresses

### DURING implementation and reviews:

* Track module boundaries and responsibility decisions
* Track service-layer and repository-layer conventions
* Track error-handling patterns and reasoning
* Track validation and transformation strategies
* Track API response structure conventions
* Track dependency decisions and why they were chosen
* Track reusable utilities, guards, interceptors, decorators, and middleware patterns
* Track testing approaches and important edge cases covered
* Track rejected approaches when they are important for future context

### BEFORE ending any session:

* Write a complete summary of everything done during the session to `projects/nestjs-ecommerce-backend`
* Include pending tasks, blockers, known issues, and recommended next steps
* Confirm to the user that Logseq memory has been updated before closing

### FAILURE CONDITION:

* If you skip reading memory before starting, you have failed
* If you fail to update important decisions during the session, you have failed
* If session learnings are not persisted before ending, you have failed

---