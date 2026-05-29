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

### BEFORE responding to ANY PROJECT-RELATED message — no exceptions:
1. Read `projects/nestjs-ecommerce-backend` — project index and current phase status
2. Read `projects/nestjs-ecommerce-backend/architecture` — all static rules, patterns and conventions
3. Read `projects/nestjs-ecommerce-backend/phases` — phase history and active phase details
4. Read `global/preferences` — personal preferences and working style
- If Logseq is unreachable, say so immediately and ask the user to open it before continuing

### AFTER every meaningful PROJECT-RELATED action — no exceptions:

* Architecture decision, pattern, or convention → update `projects/nestjs-ecommerce-backend/architecture` immediately
* Bug fixed → update with root cause and exact fix in `projects/nestjs-ecommerce-backend/architecture`
* API contract, validation rule, or DTO change → update `projects/nestjs-ecommerce-backend/architecture`
* Database schema, migration, or Prisma model change → update `projects/nestjs-ecommerce-backend/architecture`
* Auth, authorization, or security implementation → update `projects/nestjs-ecommerce-backend/architecture`
* Performance optimization or caching strategy → update `projects/nestjs-ecommerce-backend/architecture`
* Phase completed → update `projects/nestjs-ecommerce-backend/phases` and update the index page status
* New phase started → create `projects/nestjs-ecommerce-backend/phase-X-name` page for active work
* User preference or correction related to coding, architecture, workflow, or response style → update `global/preferences` immediately
* Never wait until end of session — update continuously as relevant project work progresses

### DURING PROJECT implementation and reviews:

* Track module boundaries and responsibility decisions
* Track service-layer and repository-layer conventions
* Track error-handling patterns and reasoning
* Track validation and transformation strategies
* Track API response structure conventions
* Track dependency decisions and why they were chosen
* Track reusable utilities, guards, interceptors, decorators, and middleware patterns
* Track testing approaches and important edge cases covered
* Track rejected approaches when important for future context

### BEFORE ending any PROJECT-RELATED session:

* Write a complete summary of all PROJECT-RELATED work done to the active phase page
* Update `projects/nestjs-ecommerce-backend` index if phase status changed
* Include pending tasks, blockers, known issues, and recommended next steps
* Do NOT store unrelated conversations, casual discussions, or non-project topics
* Confirm to the user that relevant project memory has been updated before closing

### FAILURE CONDITION:

* If you skip reading all 4 pages before starting PROJECT-RELATED work, you have failed
* If you fail to update the right page immediately after important PROJECT-RELATED decisions, you have failed
* If relevant PROJECT-RELATED learnings are not persisted before ending the session, you have failed