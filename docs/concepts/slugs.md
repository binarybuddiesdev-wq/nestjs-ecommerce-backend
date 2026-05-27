# Slugs — In-Depth Explanation

## What Is a Slug?

A **slug** is a URL-friendly identifier for a resource, derived from its name. It's the part of a URL that tells you what the page is about in human-readable form.

```
https://example.com/categories/electronics
                                    └─────────┘
                                       slug
```

Instead of:
```
https://example.com/categories/67a2b3c4d5e6f7a8b9c0d1e2
                                    └─────────────────────┘
                                               id
```

The slug `electronics` tells a human what this page is. The ID `67a2b3c4d5e6f7a8b9c0d1e2` tells a machine what this page is.

## Why Use Slugs?

### 1. Readability

A slug tells the user where they are:

| URL | What you expect |
|-----|-----------------|
| `/products/iphone-15-pro` | I know this is an iPhone page |
| `/products/67a2b3c4d5e6f7a8b9c0d1e2` | No idea until the page loads |
| `/categories/gaming-laptops` | Gaming laptop category |
| `/categories/a1b2c3d4` | Mystery category |

### 2. SEO (Search Engine Optimization)

Search engines (Google, Bing) use URL keywords as a ranking signal. A URL like `/categories/gaming-laptops` tells Google the page is about gaming laptops. `/categories/a1b2c3d4` tells Google nothing.

### 3. Shareability

A human-readable URL is easier to:
- Remember: "Go to our site, click on `/products/macbook-pro-m4`"
- Type manually
- Share verbally in a meeting: "Check out the page at `/blog/why-we-use-fastify`"

### 4. No Information Leakage

With auto-increment IDs, URLs reveal business information:
- `/users/1` — probably the admin
- `/orders/1000` — we've had 1000 orders
- `/orders/1001` vs `/orders/1002` — competitors can scrape to estimate volume

Slugs don't leak this data.

---

## Real-World Examples

### 1. Product Slugs (our e-commerce use case)

```
https://shop.example.com/products/iphone-15-pro-128gb-deep-blue
                                      └─────────────────────────┘
```

A product slug typically includes:
- Product name: `iphone-15-pro`
- Key variant info: `128gb`
- Distinguishing attribute: `deep-blue`

### 2. Category Slugs (our immediate use case)

```
https://shop.example.com/categories/electronics
https://shop.example.com/categories/laptops
https://shop.example.com/categories/gaming-laptops
```

Category slugs are usually short — just the category name in lowercase with hyphens.

### 3. Blog Post Slugs

```
https://blog.example.com/how-to-build-a-slug-function-in-javascript
                      └────────────────────────────────────────────
```

Blog post slugs often include the full title with stop words removed or kept.

### 4. User Profile Slugs

```
https://social.example.com/@john-doe
                           └───────┘
```

Username-based slugs (often with `@` prefix to distinguish from routes).

### 5. City or Location Slugs

```
https://travel.example.com/destinations/new-york
                                        └───────┘
https://travel.example.com/destinations/san-francisco
                                        └─────────────┘
```

Geographic slugs use the location name.

---

## Slug Generation Rules

### The Standard Algorithm

A standard slug function does these steps in order:

```
Input: "Gaming Laptops (2026 Edition) — Best Picks!"
                                              ↓
Step 1: Convert to lowercase
         "gaming laptops (2026 edition) — best picks!"
                                              ↓
Step 2: Replace spaces with hyphens
         "gaming-laptops-(2026-edition)---best-picks!"
                                              ↓
Step 3: Remove all non-alphanumeric characters except hyphens
         "gaming-laptops-2026-edition--best-picks"
                                              ↓
Step 4: Collapse multiple hyphens into one
         "gaming-laptops-2026-edition-best-picks"
                                              ↓
Step 5: Trim leading/trailing hyphens
         "gaming-laptops-2026-edition-best-picks"
                                              ↓
Output: "gaming-laptops-2026-edition-best-picks"
```

### Slug Generation Code

```typescript
function createSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // spaces → hyphens
    .replace(/[^\w\-]+/g, '')       // remove non-word chars (except hyphens)
    .replace(/\-\-+/g, '-')         // collapse multiple hyphens
    .replace(/^-+/, '')             // trim leading hyphens
    .replace(/-+$/, '');            // trim trailing hyphens
}
```

### Edge Cases

| Input | Output | Why? |
|-------|--------|------|
| `"Electronics"` | `"electronics"` | Simple lowercase |
| `"Gaming Laptops"` | `"gaming-laptops"` | Spaces → hyphens |
| `"Hello! World?"` | `"hello-world"` | Special chars removed |
| `"  Spaces   Everywhere  "` | `"spaces-everywhere"` | Trimmed + collapsed |
| `"---hello---"` | `"hello"` | Leading/trailing hyphens trimmed |
| `"CAFÉ"` | `"caf"` | NFD normalization needed (see below) |
| `"日本語"` | `""` | Non-Latin chars removed — needs transliteration |

### International Characters (Transliteration)

For non-ASCII characters, use Unicode NFD normalization to decompose accented characters:

```typescript
function createSlug(text: string): string {
  return text
    .normalize('NFD')               // é → e + combining accent
    .replace(/[\u0300-\u036f]/g, '') // remove combining accents
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// createSlug("Café") → "cafe"
// createSlug("São Paulo") → "sao-paulo"
// createSlug("München") → "munchen"
```

For non-Latin scripts (Cyrillic, Chinese, Arabic), use a transliteration library like `transliteration` or `@sindresorhus/slugify`:

```typescript
import { slugify } from 'transliteration';

slugify('Москва');     // → "moskva"
slugify('北京');        // → "bei-jing"
slugify('东京');        // → "dong-jing"
```

---

## Uniqueness Strategies

This is the most important decision when designing slugs. What happens when two items want the same slug?

### Problem: Name Collision

```
Category 1: "Laptops"      → slug: "laptops"
Category 2: "Laptops"      → slug: "laptops"  ← CONFLICT! Must be unique.
```

### Strategy 1: Append a Suffix (Most Common)

```typescript
async function generateUniqueSlug(name: string): Promise<string> {
  let slug = createSlug(name);
  let counter = 1;

  while (await prisma.category.findUnique({ where: { slug } })) {
    slug = `${createSlug(name)}-${counter}`;
    counter++;
  }

  return slug;
}
```

Result:
```
"laptops"          → "laptops"          (first one — no conflict)
"laptops"          → "laptops-1"        (second one)
"laptops"          → "laptops-2"        (third one)
```

### Strategy 2: Append a Random Suffix

```typescript
function generateSlug(name: string): string {
  const base = createSlug(name);
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}
```

Result:
```
"laptops"          → "laptops-a3f8"
"laptops"          → "laptops-x2k1"
```

**Pros:** No DB lookup needed. **Cons:** Ugly URLs.

### Strategy 3: Use a Short UUID as Slug

```typescript
import { nanoid } from 'nanoid';

function generateSlug(name: string): string {
  return nanoid(8);  // → "a3f8x2k1"
}
```

**Pros:** Always unique, no collisions, fast. **Cons:** Zero readability (defeats purpose of slugs).

### Strategy 4: Timestamp-Based

```typescript
function generateSlug(name: string): string {
  return `${createSlug(name)}-${Date.now()}`;
}
```

**Pros:** Always unique, no collision checks. **Cons:** Long, ugly, reveals creation time.

### What We Use in This Project

We use **Strategy 1** (counter suffix) because:
1. The first item always gets a clean slug (`laptops`)
2. Conflicts are rare (same category name unlikely)
3. When conflicts happen, `laptops-1` is still readable
4. It's the standard for e-commerce platforms

---

## Slug vs ID: When to Use What

| Use Case | Use Slug | Use ID |
|----------|----------|--------|
| URL path for users | ✅ `/categories/laptops` | ❌ `/categories/a1b2c3` |
| API response body | ✅ `{ slug: "laptops", name: "Laptops" }` | ✅ `{ id: "a1b2c3", slug: "laptops" }` |
| Database foreign key | ❌ Can change | ✅ Fixed forever |
| Internal join/lookup | ❌ Relies on uniqueness | ✅ Primary key by design |
| SEO-friendly URLs | ✅ Essential | ❌ Useless |

### Cardinal Rule

**Never use slug as a foreign key.** Slugs can change (rename "Laptops" to "Notebooks" → slug changes). If other tables reference the slug, you must update every reference — that's a nightmare.

Foreign keys must always use `id`. Slugs are for **human-facing URLs only**.

```
Category table:           Product table:
┌──────────────────┐     ┌────────────────────────────┐
│ id: ObjectId     │────→│ categoryId: ObjectId (FK)  │
│ name: "Laptops"  │     │ slug: "laptops" (URL only) │
│ slug: "laptops"  │     │ name: "Gaming Laptop X"    │
└──────────────────┘     └────────────────────────────┘
```

---

## How Slugs Work in Our URLs

### Route Design

In our API, slugs are used as route parameters:

```
GET /api/v1/categories/:slug
```

The controller extracts `:slug` and passes it to the service:

```typescript
// categories.controller.ts
@Get(':slug')
findBySlug(@Param('slug') slug: string) {
  return this.categoriesService.findBySlug(slug);
}
```

### The `findBySlug` Query

```typescript
// categories.service.ts
async findBySlug(slug: string) {
  const category = await this.prisma.category.findUnique({
    where: { slug },
  });

  if (!category) {
    throw new NotFoundException(`Category with slug "${slug}" not found`);
  }

  return {
    message: 'Category retrieved successfully',
    data: category,
  };
}
```

### Why `findUnique` over `findFirst`?

- `findUnique` uses the database's unique index → **O(1)** lookup time
- `findFirst` does a table scan unless there's an index → **O(n)** lookup time
- Because `slug` has `@unique` in Prisma, `findUnique` is available

---

## Implementation in Our Category Service

### Create with Auto-Generated Slug

```typescript
async create(dto: CreateCategoryDto) {
  const slug = await this.generateUniqueSlug(dto.name);

  const category = await this.prisma.category.create({
    data: {
      name: dto.name,
      slug,
      parentId: dto.parentId ?? null,
    },
  });

  return {
    message: 'Category created successfully',
    data: category,
  };
}

private async generateUniqueSlug(name: string): Promise<string> {
  let slug = createSlug(name);
  let counter = 1;

  while (await this.prisma.category.findUnique({ where: { slug } })) {
    slug = `${createSlug(name)}-${counter}`;
    counter++;
  }

  return slug;
}
```

### Update with Slug Regeneration

```typescript
async update(id: string, dto: UpdateCategoryDto) {
  const existing = await this.prisma.category.findUnique({ where: { id } });

  if (!existing) {
    throw new NotFoundException(`Category with id "${id}" not found`);
  }

  const data: Prisma.CategoryUpdateInput = {};

  if (dto.name && dto.name !== existing.name) {
    data.name = dto.name;
    data.slug = await this.generateUniqueSlug(dto.name);
  }

  if (dto.parentId !== undefined) {
    data.parent = dto.parentId
      ? { connect: { id: dto.parentId } }
      : { disconnect: true };
  }

  const category = await this.prisma.category.update({
    where: { id },
    data,
  });

  return {
    message: 'Category updated successfully',
    data: category,
  };
}
```

### Why Regenerate Slug on Name Change?

If a user renames "Gaming Laptops" → "Gaming Notebooks", the slug should change too:
```diff
- /categories/gaming-laptops
+ /categories/gaming-notebooks
```

This means: **old URLs break.** This is expected behavior. If you need old URLs to work:
- Set up URL redirects (301 redirect from old slug → new slug)
- Use a slug history table (see Advanced Patterns below)

---

## Prisma Schema Considerations

```prisma
model Category {
  id        String     @id @default(auto()) @map("_id") @db.ObjectId
  name      String
  slug      String     @unique           ← ensures database-level uniqueness
  parentId  String?    @db.ObjectId
  isActive  Boolean    @default(true)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  parent    Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children  Category[] @relation("CategoryHierarchy")
}
```

### Why `@unique`?

The `@unique` constraint creates a **unique index** in MongoDB. This gives us two guarantees:

1. **Database-level protection**: Even if application code has a bug, the DB prevents duplicate slugs
2. **Fast lookups**: `findUnique({ where: { slug } })` is O(1), just like looking up by `id`

### What Happens Without `@unique`?

```
Scenario: Two "Gaming Laptops" categories exist
Request:  GET /categories/gaming-laptops
Result:   Which one do we return? Neither? Both?
          → Ambiguity. API returns wrong data or crashes.
```

**Always put `@unique` on slug fields.** Non-unique slugs are not slugs — they're just fancy strings.

---

## Advanced Patterns

### 1. Slug History (Permanent URL Redirects)

When a slug changes, old bookmarks break. A slug history table solves this:

```prisma
model SlugHistory {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  oldSlug    String   @unique
  categoryId String   @db.ObjectId
  category   Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())
}
```

On slug change, insert the old slug into this table. On 404, check this table and redirect:

```typescript
async findBySlug(slug: string) {
  let category = await this.prisma.category.findUnique({ where: { slug } });

  if (!category) {
    const history = await this.prisma.slugHistory.findUnique({
      where: { oldSlug: slug },
      include: { category: true },
    });

    if (history) {
      // Return 301 Moved Permanently with new slug
      throw new MovedPermanentlyException(history.category.slug);
    }

    throw new NotFoundException(`Category with slug "${slug}" not found`);
  }

  return category;
}
```

### 2. Hierarchical Slugs

Instead of `/categories/laptops`, you might want `/categories/electronics/laptops/gaming-laptops`:

```typescript
async getFullPath(category: Category): Promise<string> {
  const slugs: string[] = [category.slug];
  let current = category;

  while (current.parentId) {
    current = await this.prisma.category.findUnique({
      where: { id: current.parentId },
    });
    slugs.unshift(current.slug);
  }

  return '/' + slugs.join('/');
}
```

**Tradeoff:** More complex routing, deeper URLs, but great for SEO breadcrumbs.

### 3. Slug Validation in DTOs

```typescript
import { IsOptional, IsString, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Category name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Custom slug (auto-generated from name if omitted)' })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase alphanumeric with hyphens only (e.g. "gaming-laptops")',
  })
  slug?: string;

  @ApiPropertyOptional({ description: 'Parent category ID' })
  @IsOptional()
  @IsString()
  parentId?: string;
}
```

This allows users to optionally provide a custom slug while enforcing format rules.

### 4. Bulk Slug Uniqueness Check

When importing many categories at once, batch-check uniqueness:

```typescript
async function makeSlugsUnique(names: string[]): Promise<string[]> {
  // Generate all slugs
  const slugs = names.map(name => createSlug(name));

  // Find which already exist
  const existing = await prisma.category.findMany({
    where: { slug: { in: slugs } },
    select: { slug: true },
  });
  const existingSet = new Set(existing.map(e => e.slug));

  // Append counter only to conflicts
  const counters = new Map<string, number>();

  return slugs.map(slug => {
    if (!existingSet.has(slug) && !counters.has(slug)) {
      return slug;  // No conflict
    }

    const count = (counters.get(slug) ?? 0) + 1;
    counters.set(slug, count);
    return `${slug}-${count}`;
  });
}
```

### 5. Immutable Slugs

Some systems make slugs **immutable** — once created, they never change, even if the name changes.

```typescript
async update(id: string, dto: UpdateCategoryDto) {
  const category = await this.prisma.category.update({
    where: { id },
    data: {
      name: dto.name ?? undefined,
      // slug: NEVER updated — stays as originally generated
    },
  });
  // ...
}
```

**Pros:** Old URLs never break. **Cons:** Slug and name can diverge (name is "Gaming Notebooks" but slug is still "gaming-laptops").

This is a valid design choice — many large platforms do this (Medium, GitHub).

---

## SEO Best Practices

| Rule | Example |
|------|---------|
| Keep slugs short | `gaming-laptops` not `best-gaming-laptops-for-2026-reviewed` |
| Use hyphens, not underscores | `gaming-laptops` ✅, `gaming_laptops` ❌ |
| Lowercase only | `Gaming-Laptops` ❌ (can cause duplicate content issues) |
| Remove stop words | Omitting "the", "and", "for", "in" is common but not required |
| Include primary keyword | `apple-iphone-15` not `a-new-smartphone-from-apple` |
| Avoid dates unless content is time-sensitive | `gaming-laptops-2026` implies content is only relevant for 2026 |
| Keep consistent structure across same site | All categories: `/<category-name>`, all products: `/products/<product-name>` |

---

## Performance: Querying by Slug

### Compare: Query by ID vs Slug

```typescript
// Query by ID (O(1) — primary key lookup)
await prisma.category.findUnique({ where: { id } });

// Query by slug (O(1) — unique index lookup)
await prisma.category.findUnique({ where: { slug } });
```

Both are the same speed because both use unique indexes. There is **no performance penalty** for using slugs.

### But What About Querying by Both?

```typescript
// This is fine for unique lookups
await prisma.category.findUnique({
  where: { slug },
  include: { parent: true, children: true },
});

// This is wrong — using slug for joins
await prisma.product.findMany({
  where: { categorySlug: slug },  // ❌ Never do this
});
```

---

## The 80/20 Decision Framework

```
Do you need slugs?
│
├─ Is this a user-facing web URL?  → Yes → Use slugs
│
├─ Is this an API endpoint?        → Yes → Use slugs for readability
│
├─ Is this a CLI tool or SDK?      → Probably not → Use IDs
│
├─ Is this an internal reference?  → No → Use IDs
│
└─ Is this a database foreign key? → No → Never use slugs as FKs
```

---

## Diagram Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│                       SLUG DECISION MAP                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   Name: "Gaming Laptops"                                            │
│         │                                                           │
│         ▼                                                           │
│  createSlug() → "gaming-laptops"                                    │
│         │                                                           │
│         ▼                                                           │
│  Is "gaming-laptops" taken?                                         │
│         │                                                           │
│   YES ──┼──→ "gaming-laptops-1"                                     │
│         │         │                                                 │
│         │         ▼                                                 │
│         │  Is "gaming-laptops-1" taken?                             │
│         │         │                                                 │
│         │   YES ──┼──→ "gaming-laptops-2"   ...and so on            │
│         │         │                                                 │
│         │   NO ───┘                                                 │
│         │                                                           │
│    NO ──┘                                                           │
│         │                                                           │
│         ▼                                                           │
│  Store in database with @unique index                               │
│         │                                                           │
│         ▼                                                           │
│  Use in URL: /categories/gaming-laptops                             │
│         │                                                           │
│         ▼                                                           │
│  Query via findUnique({ where: { slug } })                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

```
╔════════════════════════════════════════════════════════════════╗
║                Category Document in Database                    ║
╠════════════════════════════════════════════════════════════════╣
║  _id:  ObjectId("67a2b3c4d5e6f7a8b9c0d1e2")                  ║
║  name: "Gaming Laptops"                                       ║
║  slug: "gaming-laptops"              ← unique, URL-friendly   ║
║  parentId: ObjectId("...")           ← FK to parent category  ║
║  isActive: true                                               ║
╚════════════════════════════════════════════════════════════════╝
                              │
                              ▼
              ┌─────────────────────────────┐
              │  URL: /categories/gaming-   │
              │         laptops             │
              │                             │
              │  Route: @Get(':slug')       │
              │                             │
              │  Query: findUnique(slug)    │
              │         → O(1) via index    │
              └─────────────────────────────┘
```

---

## Common Mistakes

### Mistake 1: Slug as Foreign Key

```prisma
model Product {
  categorySlug String  // ← Stores slug instead of category ID
}
```

**Why it's wrong:** Rename "Laptops" → "Notebooks" and the slug changes. Now every product with `categorySlug: "laptops"` is orphaned. Use `categoryId` (the actual ID) instead.

### Mistake 2: Non-Unique Slugs

```prisma
model Category {
  slug String  // ← No @unique!
}
```

**Why it's wrong:** Two categories can have `slug: "laptops"`. When a user visits `/categories/laptops`, which one do you return?

### Mistake 3: Regenerating Slug on Every Update

```typescript
async update(id: string, dto: UpdateCategoryDto) {
  const data = {
    name: dto.name,
    slug: createSlug(dto.name),  // ← Regenerates even if name didn't change
  };
}
```

**Why it's wrong:** If someone updates `isActive` or `parentId`, the slug gets regenerated. Any bookmarked URL using the old slug breaks. Only regenerate slug when `name` changes.

### Mistake 4: Not Handling International Characters

```typescript
createSlug("Café"); // → "café" → invalid URL
```

**Why it's wrong:** Non-ASCII characters in URLs may not be handled correctly by all browsers, CDNs, or proxies. Always normalize and transliterate.

### Mistake 5: Silent Slug Collision

```typescript
async create(dto) {
  const slug = createSlug(dto.name);  // Never checks if slug exists
  return prisma.category.create({ data: { ...dto, slug } });
}
```

**Why it's wrong:** If "Laptops" already exists, this either throws a Prisma unique constraint error (ugly 500 response to client) or silently creates a duplicate depending on whether `@unique` is set.

---

## The Golden Rule

> **Slugs are for humans. IDs are for machines. Never confuse the two.**

Slugs make your URLs readable, shareable, and SEO-friendly. IDs make your database relationships reliable and safe. Use both — each for its own purpose.
