# Redis Caching Patterns

## The Core Problem: When to Cache?

Not everything should be cached. Caching is useful when:

| Cache When | Don't Cache When |
|------------|-----------------|
| Data is read frequently | Data is written more often than read |
| Data changes infrequently | Data changes every few seconds |
| Data is expensive to compute/query | Data is cheap to fetch |
| Stale data (seconds old) is acceptable | Data must be perfectly up-to-date |
| Many users see the same data | Every user sees unique data |

### Applying to Our E-Commerce App

| Endpoint | Read Frequency | Changes | Cache? |
|----------|---------------|---------|--------|
| GET /products | Very high (every visitor) | Low (new products added hourly) | ✅ Yes |
| GET /categories | High (every page load) | Very low (rarely changes) | ✅ Yes |
| GET /products/:slug | High (product detail pages) | Low | ✅ Maybe (with invalidation) |
| POST /products | Low (sellers only) | — | ❌ No |
| PATCH /products/:id | Medium | — | ❌ No |
| GET /cart/:id | Low (only the owner) | Medium | ❌ No (unique per user) |

## Caching Pattern: Cache-Aside (The Standard)

Also called **lazy loading**. This is the pattern we use. The flow:

```
                    ┌─────────────────────┐
                    │  Request arrives     │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Check Redis for key │
                    └──────────┬──────────┘
                               │
                     ┌─────────┴─────────┐
                     │                   │
                  HIT (found)          MISS (not found)
                     │                   │
                     ▼                   ▼
              ┌──────────────┐  ┌─────────────────────┐
              │ Return cached │  │ Query MongoDB        │
              │ data directly │  │ for fresh data       │
              └──────────────┘  └──────────┬──────────┘
                                           │
                                ┌──────────▼──────────┐
                                │ Store result in Redis│
                                │ Set TTL (auto-expire)│
                                └──────────┬──────────┘
                                           │
                                ┌──────────▼──────────┐
                                │ Return fresh data    │
                                └─────────────────────┘
```

### In Code (Pseudocode)

```typescript
async function getProductList(filters: QueryDto) {
    const cacheKey = `cache:products:list:${hash(filters)}`;

    // Step 1: Try Redis first
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
        return cached;  // Cache HIT — return immediately
    }

    // Step 2: Cache MISS — query database
    const data = await this.productsService.findAll(filters);

    // Step 3: Store in Redis with TTL
    await this.cacheManager.set(cacheKey, data, 300_000); // 5 minutes TTL

    return data;
}
```

### Why This Pattern?

1. **Redis only stores data that's actually requested** — if nobody requests a product list, it never gets cached (unlike pre-warming which fills cache with everything upfront)
2. **No complex synchronization logic** — the cache naturally stays fresh within the TTL window
3. **Self-healing** — if Redis crashes, it just means more cache misses until it recovers (app still works)

## TTL (Time To Live) — Why Data Auto-Expires

Every cached value should have a TTL. This is non-negotiable.

```typescript
// Set with 5-minute TTL
await this.cacheManager.set(key, data, 300_000);

// Redis will auto-delete this key after 300 seconds
```

### Why TTL is Mandatory

| Without TTL | With TTL |
|-------------|----------|
| Cache grows unbounded → runs out of RAM | Old data cleaned up automatically |
| Stale data lives forever | Data eventually refreshes from DB |
| Manual cleanup code needed | Zero maintenance |

### Choosing the Right TTL

| Data Type | TTL | Rationale |
|-----------|-----|-----------|
| Product list (public) | 5 minutes | New products don't appear instantly — acceptable delay |
| Category tree | 1 hour | Categories rarely change |
| Product detail | 10 minutes | Price/stock updates are bounded by this window |
| User session | 24 hours | Session should persist across a day |
| Rate limit counter | 1 minute | Auto-cleans after rate limit window ends |

## Cache Invalidation — The Hard Part

> "There are only two hard things in computer science: cache invalidation and naming things." — Phil Karlton

Cache invalidation is the process of removing or updating cached data when the underlying data changes.

### Strategy 1: TTL-Only (Simplest — What We Start With)

Don't invalidate anything. Let TTL handle staleness.

```
Product created at 10:00
Cache at 10:00 → stores old list (no new product)
Cache TTL expires at 10:05
Cache at 10:05 → new request fetches fresh list (includes new product)
```

**Downside:** Users see stale data for up to 5 minutes. Acceptable for Phase 6.

### Strategy 2: Manual Invalidation (Our Phase 7+ Approach)

When data changes, explicitly delete the cache key.

```
10:00 — Seller creates new product
10:00 — Backend creates product in MongoDB
10:00 — Backend calls cacheManager.del('cache:products:list:*')
10:01 — User requests products
10:01 — Cache MISS → queries MongoDB → returns fresh data with new product
```

**Real invalidation code:**

```typescript
async createProduct(userId: string, dto: CreateProductDto) {
    const product = await this.prisma.product.create({ ... });

    // Invalidate product list cache
    await this.cacheManager.del('cache:products:list');

    this.logger.info({ product }, 'Product created successfully');
    return product;
}
```

### Strategy 3: Tag-Based Invalidation (Advanced)

When you cache many related keys, invalidating all of them is hard:

```
cache:products:list:{"category":"electronics","page":"1"}
cache:products:list:{"category":"electronics","page":"2"}
cache:products:list:{"category":"laptops","page":"1"}
```

If a new laptop is added, you want to invalidate only laptop-related caches, not electronics caches. With `@nestjs/cache-manager`, you'd store keys in a set and iterate:

```typescript
await this.cacheManager.store.keys('cache:products:list:*');
// Delete matching keys...
```

This is more advanced and not needed for Phase 6.

## Our Invalidation Strategy for Phase 6

| Event | Cache Keys Affected | Action |
|-------|-------------------|--------|
| Product created | Product list cache | Delete cache (list is now stale) |
| Product updated | Product list cache + product detail cache | Delete both |
| Product deleted | Product list cache | Delete cache |
| Product image changed | Product list + detail cache | Delete both |

We use **TTL + Manual Invalidation**:
- Primary invalidation: Manual (delete cache on mutation)
- Safety net: TTL (5 minutes max stale data even if manual invalidation fails)

This gives us the best of both: near-immediate freshness when data changes, with a safety net in case our code has bugs.
