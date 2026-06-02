# Redis in Our E-Commerce Project

## What We're Building

In Phase 6, we add Redis caching to `GET /api/v1/products` (the public product listing endpoint).

## The Problem

```
GET /api/v1/products?category=electronics&minPrice=50000

Response time (no cache):   ~30-80ms (MongoDB query + serialization)
Concurrent users before DB chokes: ~500
```

With 10,000 visitors browsing products, MongoDB gets 10,000 queries for the same data pattern. Most visitors see the same products (with slight variations from pagination and filters).

## The Solution

Cache the product list response in Redis.

```
GET /api/v1/products?category=electronics&minPrice=50000

First request (cache miss):  ~35ms (MongoDB + store in Redis)
Next 10,000 requests:        ~2ms (Redis) each
MongoDB queries saved:       9,999 out of 10,000
```

## Implementation Plan

### Step 1: Install Dependencies

```bash
pnpm add @nestjs/cache-manager cache-manager ioredis
```

### Step 2: Configure in AppModule

Register `CacheModule` globally so any service can inject `Cache`.

```typescript
// app.module.ts
import { CacheModule } from '@nestjs/cache-manager';

@Module({
    imports: [
        CacheModule.registerAsync({
            isGlobal: true,
            inject: [ConfigService],
            useFactory: async (config: ConfigService) => ({
                store: await redisStore({
                    host: config.get('REDIS_HOST', 'localhost'),
                    port: config.get('REDIS_PORT', 6379),
                    ttl: 300_000,  // Default 5 minutes
                }),
                isGlobal: true,
            }),
        }),
    ],
})
```

### Step 3: Add Redis to Environment Config

```env
# .env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

Add these to the Zod validation schema so the app fails early if they're missing.

### Step 4: Inject CacheManager in ProductsService

```typescript
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';

@Injectable()
export class ProductsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: PinoLogger,
        private readonly uploadsService: UploadsService,
        @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    ) {}
}
```

### Step 5: Cache the findAll Method

```typescript
private readonly CACHE_PREFIX = 'cache:products:list';
private readonly CACHE_TTL = 300_000; // 5 minutes

async findAll(query: ProductQueryDto) {
    const cacheKey = `${this.CACHE_PREFIX}:${JSON.stringify(query)}`;

    try {
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            this.logger.debug({ cacheKey }, 'Product list cache hit');
            return cached;
        }
    } catch (error) {
        this.logger.warn({ error }, 'Redis read failed — falling through to DB');
    }

    const data = await this.findProductsWithQuery({ isActive: true }, query);

    try {
        await this.cacheManager.set(cacheKey, data, this.CACHE_TTL);
    } catch (error) {
        this.logger.warn({ error }, 'Redis write failed');
    }

    return data;
}
```

### Step 6: Invalidate Cache on Mutations

Every mutation endpoint in the service must invalidate the product list cache.

```typescript
private async invalidateProductListCache() {
    try {
        // cache-manager doesn't support wildcard natively
        // We need the underlying ioredis client for this
        const client = (this.cacheManager.store as any).getClient();
        const keys = await client.keys(`${this.CACHE_PREFIX}:*`);
        if (keys.length > 0) {
            await client.del(...keys);
            this.logger.debug({ count: keys.length }, 'Product list cache invalidated');
        }
    } catch (error) {
        this.logger.warn({ error }, 'Cache invalidation failed');
    }
}
```

Add `invalidateProductListCache()` calls to:

- `createProduct` — new product → list is stale
- `updateProduct` — product changed → list could be stale
- `deleteProduct` — product removed → list is stale
- `addImages` — images changed → list could be stale
- `setRelatedProducts` — related products changed → list could be stale

For `removeImage` and `removeRelatedProduct`, only the detail page is affected — list cache doesn't need invalidation (images/related products aren't shown in list view).

## Cache Key Strategy

### Product List Cache Keys

Each unique query combination produces a different cache key:

```
cache:products:list:{"category":"electronics","sort":"price_asc","limit":20}
cache:products:list:{"category":"electronics","sort":"price_asc","limit":20,"cursor":"abc123"}
cache:products:list:{"category":"laptops","brand":"dell","inStock":true}
cache:products:list:{"search":"iphone"}
```

### Why JSON.stringify?

`cache-manager` accepts string keys only. `JSON.stringify(query)` is the simplest way to create a unique, deterministic string from the query object.

**Caveat:** The order of properties in `JSON.stringify` matters. `{a:1, b:2}` → `{"a":1,"b":2}` produces a different key than `{b:2, a:1}` → `{"b":2,"a":1}`. NestJS's `@Query()` decorator preserves property order from the class definition, so this is deterministic.

## Cache Invalidation Problem

The `cache-manager` package does not support wildcard key deletion. So `cacheManager.del('cache:products:list:*')` won't work.

### Solution: Access ioredis Directly for Invalidation

```typescript
private async invalidateProductListCache() {
    try {
        const redisClient = (this.cacheManager.store as any).getClient();
        const keys = await redisClient.keys(`${this.CACHE_PREFIX}:*`);
        if (keys.length > 0) {
            await redisClient.del(...keys);
        }
    } catch (error) {
        this.logger.warn({ error }, 'Cache invalidation failed');
    }
}
```

### Alternative: Simpler Approach (Skip Wildcard)

Store the cache key in a Redis Set when creating it, then iterate the set on invalidation:

```typescript
async findAll(query: ProductQueryDto) {
    const cacheKey = `${this.CACHE_PREFIX}:${JSON.stringify(query)}`;

    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const data = await this.findProductsWithQuery({ isActive: true }, query);
    await this.cacheManager.set(cacheKey, data, this.CACHE_TTL);

    // Track this key for later invalidation
    await this.cacheManager.set(`${cacheKey}:track`, true, this.CACHE_TTL); // Not great

    return data;
}
```

This is overly complex. The wildcard approach with direct ioredis access is cleaner for our use case.

## Testing Cache Behavior

### What to Test

1. **First request is a cache miss** — response comes from DB, takes longer
2. **Second request is a cache hit** — response comes from Redis, takes <5ms
3. **After mutation, cache is invalidated** — next request is a miss again
4. **After TTL expires, cache auto-clears** — next request is a miss
5. **App survives Redis restart** — cache miss → queries DB → works fine

### Example Test Assertions

```typescript
it('returns cached response on second request', async () => {
    // First request
    const response1 = await request(app).get('/api/v1/products');
    expect(response1.status).toBe(200);

    // Second request — should be from cache
    const response2 = await request(app).get('/api/v1/products');
    expect(response2.status).toBe(200);
    expect(response2.body).toEqual(response1.body);
});

it('invalidates cache after product creation', async () => {
    await request(app).post('/api/v1/products').send({ ... }).set('Authorization', sellerToken);

    const response = await request(app).get('/api/v1/products');
    // Should include the newly created product
    expect(response.body.data.products.some(p => p.name === 'New Product')).toBe(true);
});
```

## Production Considerations

### 1. Redis Memory Limits

Set a maxmemory policy on Redis:

```
maxmemory 512mb
maxmemory-policy allkeys-lru  // Evict least recently used keys when full
```

This prevents Redis from consuming all server RAM. Old cache entries are evicted automatically.

### 2. Cache Warming (Optional)

When deploying new code, the cache is empty (cold). Consider warming critical endpoints:

```typescript
// main.ts — after app starts
async function warmCache(app: NestApplication) {
    const productsService = app.get(ProductsService);
    await productsService.findAll({}); // Populates cache for default query
    logger.info('Product list cache warmed');
}
```

### 3. Monitoring

Add cache hit/miss metrics:

```typescript
// In findAll
if (cached) {
    metrics.increment('cache.hit.products.list');
    return cached;
}
metrics.increment('cache.miss.products.list');
```

This helps you know if your cache is effective (high hit rate) or useless (low hit rate).
