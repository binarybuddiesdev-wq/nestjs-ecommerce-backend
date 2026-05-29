# Logseq Namespaces & Sub-pages Guide

This document outlines how Logseq namespaces (sub-pages) work, how they can be managed via MCP tools, and how we can restructure the `nestjs-ecommerce-backend` project memory to avoid a single bloated file.

---

## 1. Logseq Namespaces Concept
Logseq natively supports hierarchical page structures using namespaces. A namespace is created by using a slash (`/`) in the page title.

* **Format**: `Parent/Child` or `Parent/Child/Grandchild`
* **Example**:
  * `projects/nestjs-ecommerce-backend` (Main Index & Roadmap)
  * `projects/nestjs-ecommerce-backend/architecture` (Global patterns & schemas)
  * `projects/nestjs-ecommerce-backend/phase-6-products` (Active feature specifications)

---

## 2. MCP Tool Support for Namespaces
The `logseq` MCP server has dedicated tools to query and manage namespaces:

* **`get_pages_from_namespace`**: Returns all pages belonging to a specific namespace (e.g. searching `projects/nestjs-ecommerce-backend` returns all child pages).
* **`get_pages_tree_from_namespace`**: Returns a structured tree of the namespace, showing parent-child relationships.
* **`create_page` / `update_page`**: Direct creation or appending of content using markdown.

---

## 3. Proposed Project Restructuring Plan

Instead of keeping everything in `projects/nestjs-ecommerce-backend`, we split it into the following sub-pages:

### Page 1: `projects/nestjs-ecommerce-backend`
* **Purpose**: Project index and roadmap.
* **Content**:
  * Core stack summary.
  * Active/completed phase trackers.
  * Links to other child pages.

### Page 2: `projects/nestjs-ecommerce-backend/architecture`
* **Purpose**: General conventions and static design guidelines.
* **Content**:
  * TypeScript & ESM imports rules.
  * Custom exception filters and response shapes.
  * Core database schemas (Prisma & MongoDB mappings).
  * Pino logging and Swagger rules.

### Page 3: `projects/nestjs-ecommerce-backend/phase-6-products` (Active Phase)
* **Purpose**: Active feature-specific design and tracking.
* **Content**:
  * User stories, API routes, and payload examples for Phase 6.
  * Current checklist tasks.
  * Bug fixes, design decisions, and test logs.
  * *Note: When Phase 6 is complete, this page remains as static history, and we spawn a new page `projects/nestjs-ecommerce-backend/phase-7-cart`.*

---

## 4. Updates Required in `GEMINI.md`
If we adopt this structure, we should update the `Logseq Memory` section of `GEMINI.md` to:

```markdown
## Logseq Memory (MANDATORY — HIGHEST PRIORITY)

### BEFORE responding to ANY message related to this project:
1. Read `projects/nestjs-ecommerce-backend` (Main index & roadmap).
2. Read `projects/nestjs-ecommerce-backend/architecture` (Global standards).
3. Read `projects/nestjs-ecommerce-backend/phase-[X]-[name]` (Active phase sub-page).
4. Read `global/preferences` from Logseq.

### AFTER every meaningful PROJECT-RELATED action:
* Update the active phase sub-page (e.g., `projects/nestjs-ecommerce-backend/phase-6-products`) immediately with new designs, bugs fixed, or API contract changes.
* Do not store unrelated conversations or casual discussions.
```

---

## 5. Trade-offs Analysis

| Dimension | Single Page Structure | Namespace (Sub-pages) Structure |
| :--- | :--- | :--- |
| **Token Usage** | High (grows larger with each phase). | Low (only loads the active phase). |
| **Tool Execution** | 1 read call. | 3–4 read calls (slightly slower startup). |
| **File Bloat** | High risk of hitting prompt limits. | Clean, highly focused files. |
| **Maintainability** | Hard to find specific phase decisions. | Extremely easy (each phase has its own history page). |
