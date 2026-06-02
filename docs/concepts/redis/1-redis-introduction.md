# Redis — Introduction

## What Is Redis?

**Redis** (Remote Dictionary Server) is an in-memory data store. Think of it as a supercharged hash map that lives in your server's RAM instead of on disk like a traditional database.

```
Traditional Database (PostgreSQL, MongoDB)
┌─────────────────────────────────────┐
│  Data stored on DISK (SSD/HDD)      │
│  Read: ~1-10ms per query            │
│  Write: ~5-50ms per write           │
│  Capacity: Terabytes                │
└─────────────────────────────────────┘

Redis
┌─────────────────────────────────────┐
│  Data stored in RAM                 │
│  Read: ~0.1-0.5ms per query         │
│  Write: ~0.1-1ms per write          │
│  Capacity: Gigabytes (RAM is expensive)│
└─────────────────────────────────────┘
```

The speed difference (10-100x faster) comes from physics: reading from RAM is fundamentally faster than reading from disk, even SSDs.

## What Problem Does Redis Solve?

### The Database Bottleneck Problem

Every time a user loads your product listing page, your backend:

1. Receives the HTTP request
2. Parses query parameters (category, price range, search, etc.)
3. Builds a Prisma query
4. Sends it to MongoDB
5. MongoDB reads from disk, processes the query, returns results
6. Your server transforms and returns the response

For a single user, step 5 takes ~10-50ms — acceptable. But with 1,000 concurrent users:

| Users | Total DB Queries | Average Response Time |
|-------|-----------------|----------------------|
| 1     | 1               | 30ms                 |
| 100   | 100             | 150ms (queueing)     |
| 1,000 | 1,000           | 2-5 seconds (overloaded) |
| 10,000| 10,000          | Timeout / crash      |

Your database is a shared resource. Every query competes for disk I/O and CPU. At scale, this becomes the bottleneck.

### The Redis Solution

Instead of every user querying MongoDB, **the first user queries MongoDB and stores the result in Redis**. All subsequent users read from Redis:

```
Without Redis:
User → Backend → MongoDB (disk read) → Backend → User  (30ms)

With Redis:
User 1: Backend → MongoDB (disk read) → Store in Redis → User  (35ms - slightly slower due to cache write)
User 2: Backend → Redis (RAM read) → User  (2ms)
User 3: Backend → Redis (RAM read) → User  (2ms)
...
User 10,000: Backend → Redis (RAM read) → User  (2ms)
```

Result: **MongoDB gets 1 query instead of 10,000.** Users get responses in 2ms instead of seconds.

## The Core Trade-Off

Redis is not a replacement for your database. It's a supplement with specific trade-offs:

| Feature | Database (MongoDB) | Cache (Redis) |
|---------|-------------------|---------------|
| Speed | 10-50ms | 0.1-1ms |
| Storage | Terabytes (cheap) | Gigabytes (expensive) |
| Data Persistence | Survives restart | Can lose data (volatile) |
| Query Capabilities | Complex queries, joins, aggregations | Simple key-value lookups |
| Purpose | Source of truth | Speed layer |

## Common Redis Use Cases

### 1. Caching (Our Use Case)
Store frequently-read, rarely-changed data (product lists, category trees) in Redis. Invalidate when data changes.

### 2. Session Storage
Store user sessions instead of using memory or database. Fast reads on every request.

### 3. Rate Limiting
Track how many requests an IP has made in a time window. Redis's `INCR` + `EXPIRE` make this trivial.

### 4. Job Queues
BullMQ (which we use) uses Redis as its backend to manage job queues.

### 5. Real-Time Counters
Product view counts, like counts, online user counts — things that update frequently.

### 6. Leaderboards
Sorted Sets make it trivial to maintain rankings (top-selling products, highest-rated sellers).

### 7. Distributed Locks
Coordinate access to shared resources across multiple server instances.

## What Redis Is NOT

- **Redis is not a primary database.** Data in Redis is volatile and can be lost on restart (even with persistence enabled).
- **Redis is not for storing large objects.** Redis works best with data in kilobytes to low megabytes.
- **Redis is not a query engine.** You cannot do complex queries or joins in Redis. It's a key-value store.

## The Golden Rule

> **Cache data, not truth. The database is the source of truth. Redis is a speed optimization.**

If Redis crashes, your app should still work — it just responds slower because every request hits the database. This is called a **cold start** and is perfectly fine.
