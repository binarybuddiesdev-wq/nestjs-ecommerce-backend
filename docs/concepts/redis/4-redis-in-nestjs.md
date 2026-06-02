# Redis in NestJS

## How We Connect NestJS to Redis

We use `@nestjs/cache-manager` which wraps `cache-manager` and `ioredis` to provide a clean API. We never interact with Redis directly.

### The Stack

```
Your Service Code
       ↓
@nestjs/cache-manager (unified cache API)
       ↓
cache-manager (cache orchestration)
       ↓
ioredis (Redis client — manages TCP connections to Redis server)
       ↓
Redis Server (in-memory data store)
```

### Why @nestjs/cache-manager?

Without it, you'd write:

```typescript
// Direct ioredis — DON'T do this
import Redis from 'ioredis';
const redis = new Redis({ host: 'localhost', port: 6379 });

await redis.set('key', 'value', 'EX', 300);
const value = await redis.get('key');
```

With `@nestjs/cache-manager`, you write:

```typescript
// Unified API — DO this
await this.cacheManager.set('key', value, 300_000);
const cached = await this.cacheManager.get('key');
await this.cacheManager.del('key');
```

The advantage: if you later switch from Redis to Memcached or an in-memory cache, **zero code changes** — just swap the module config.

## The Two Ways to Cache in NestJS

### Way 1: Declarative (Decorator-Based)

```typescript
@Cacheable('products')  // ← Auto-caches the return value
async findAll() {
    // This only runs on cache miss
    return this.prisma.product.findMany(...);
}
```

**Pros:** Zero boilerplate. **Cons:** No control over TTL, no conditional caching, harder to invalidate.

### Way 2: Programmatic (Inject CacheManager)

```typescript
export class ProductsService {
    constructor(
        private readonly cacheManager: Cache,  // ← Injected
    ) {}
}
```

**Pros:** Full control over TTL, conditional caching, easy invalidation. **Cons:** Slightly more code.

### What We Use

We use **Way 2 (programmatic)** because we need:
- Fine-grained TTL control
- Cache invalidation on product mutations
- Conditional caching (skip cache for certain queries)

## Setup: Registering the Cache Module

### Step 1: Install Dependencies

```bash
pnpm add @nestjs/cache-manager cache-manager ioredis
pnpm add -D @types/cache-manager
```

### Step 2: Configure in AppModule

```typescript
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';

@Module({
    imports: [
        CacheModule.registerAsync({
            isGlobal: true,
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                store: await redisStore({
                    host: configService.get('REDIS_HOST'),
                    port: configService.get('REDIS_PORT'),
                    password: configService.get('REDIS_PASSWORD'),
                    ttl: 300_000,  // Default TTL: 5 minutes
                }),
            }),
        }),
    ],
})
export class AppModule {}
```

### Step 3: Configure Environment Variables

```
# .env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

Also add to the Zod validation schema so the app refuses to start if Redis config is missing.

## Using the Cache in a Service

### Injecting the Cache

```typescript
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

export class ProductsService {
    constructor(
        @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    ) {}
}
```

### Cache-Aside Pattern in Practice

```typescript
const CACHE_TTL = 300_000; // 5 minutes
const CACHE_PREFIX = 'cache:products:list';

async findAll(query: ProductQueryDto) {
    const cacheKey = `${CACHE_PREFIX}:${JSON.stringify(query)}`;

    // Try cache
    const cached = await this.cacheManager.get<{ products: Product[]; cursor: string | null; hasMore: boolean; total: number }>(cacheKey);
    if (cached) {
        this.logger.debug({ cacheKey }, 'Cache hit');
        return cached;
    }

    // Cache miss — query database
    const data = await this.findProductsWithQuery({ isActive: true }, query);

    // Store in cache
    await this.cacheManager.set(cacheKey, data, CACHE_TTL);
    this.logger.debug({ cacheKey }, 'Cache miss — stored');

    return data;
}
```

### Invalidating the Cache on Mutation

```typescript
async createProduct(userId: string, dto: CreateProductDto) {
    const product = await this.prisma.product.create({ ... });

    // Invalidate product list cache (all variants)
    await this.cacheManager.del(`${CACHE_PREFIX}:*`);
    // Note: cache-manager doesn't support wildcard deletion natively.
    // You may need to use ioredis directly for this:
    // const redis = this.cacheManager.store.getClient();
    // const keys = await redis.keys(`${CACHE_PREFIX}:*`);
    // for (const key of keys) await redis.del(key);

    this.logger.info({ product }, 'Product created');
    return product;
}
```

## Key Design Decisions

### 1. Cache Key Pattern

Use consistent, descriptive keys:

```typescript
// Product list cache
`cache:products:list:${JSON.stringify(queryParams)}`

// Category tree cache
`cache:categories:tree`

// Product detail cache
`cache:products:detail:${slug}`
```

### 2. Serialization

`cache-manager` automatically serializes objects to JSON. When reading back, it deserializes. But the type information is lost — you get plain objects. Use generics:

```typescript
const cached = await this.cacheManager.get<ReturnType>(cacheKey);
```

### 3. Error Handling

Never let a Redis error crash your request. Wrap cache operations:

```typescript
async findAll(query: ProductQueryDto) {
    try {
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) return cached;
    } catch (error) {
        this.logger.warn({ error }, 'Redis cache read failed — falling through to DB');
    }

    // Always fall through to database
    return this.findProductsWithQuery({ isActive: true }, query);
}
```

This ensures the app still works even if Redis is down — it just runs slower.

## Cache Invalidation in Our Controllers

### What to Invalidate and When

| Endpoint | Invalidates |
|----------|-------------|
| POST /products | Product list cache |
| PATCH /products/:id | Product list cache + product detail cache |
| DELETE /products/:id | Product list cache |
| POST /products/:id/images | Product detail cache |
| DELETE /products/:id/images/:index | Product detail cache |
| POST /products/:id/related | Product detail cache |
| DELETE /products/:id/related/:relatedId | Product detail cache |

### Invoke Invalidation in the Service

Since the service knows when data changed, it's the natural place to invalidate:

```typescript
async createProduct(userId: string, dto: CreateProductDto) {
    const product = await this.prisma.product.create({ ... });
    await this.invalidateProductListCache();
    return product;
}

private async invalidateProductListCache() {
    await this.cacheManager.del(`${CACHE_PREFIX}:*`);
}
```

This keeps the controller clean — it just calls the service method and returns the response, unaware of caching.
