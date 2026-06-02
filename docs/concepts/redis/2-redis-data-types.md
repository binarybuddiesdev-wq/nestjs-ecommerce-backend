# Redis Data Types

Redis is more than just a simple key-value store. It supports several data structures that make it powerful for different use cases.

## Strings (The Simplest)

A string maps a key to a value — exactly like a JavaScript object property.

```
Key: "product:123:views"
Value: "1500"
```

```bash
SET product:123:views 1500     # Store
GET product:123:views          # Read → "1500"
INCR product:123:views         # Increment → 1501
EXPIRE product:123:views 3600  # Auto-delete after 1 hour
```

**Used for:** Simple caching, counters, rate limiting.

## Hashes (Like JavaScript Objects)

A hash maps a key to multiple field-value pairs.

```
Key: "product:123"
Fields: { name: "iPhone 15 Pro", price: "99900", stock: "50" }
```

```bash
HSET product:123 name "iPhone 15 Pro" price 99900 stock 50
HGET product:123 name              # → "iPhone 15 Pro"
HGETALL product:123                # → { name, price, stock }
HDEL product:123 stock             # Remove a field
```

**Used for:** Storing related data together (like a product detail).

## Lists (Ordered, Mutable Arrays)

A list maintains insertion order. You can push to either end.

```
Key: "latest-products"
Values: [A, B, C, D, E]  (newest first)
```

```bash
LPUSH latest-products A    # Push to front: [A]
LPUSH latest-products B    # Push to front: [B, A]
RPUSH latest-products Z    # Push to end:   [B, A, Z]
LRANGE latest-products 0 2 # Get first 3:   [B, A, Z]
LPOP latest-products       # Remove from front: [A, Z]
```

**Used for:** Recent items lists, activity feeds, message queues.

## Sets (Unordered, No Duplicates)

A set is like a JavaScript Set — every value appears at most once.

```
Key: "product:123:tags"
Values: {"new-arrival", "best-seller", "premium"}
```

```bash
SADD product:123:tags "new-arrival" "best-seller"
SADD product:123:tags "new-arrival"    # No effect — already exists
SMEMBERS product:123:tags              # Get all tags
SISMEMBER product:123:tags "premium"   # Check if exists → 0 (false)
SREM product:123:tags "premium"        # Remove
```

**Used for:** Tags, categories, unique visitor tracking.

## Sorted Sets (Sets with Scores)

Like a set, but every member has a score that determines its order.

```
Key: "top-products"
Members: [A: 1500, B: 1200, C: 800, D: 500]
```

```bash
ZADD top-products 1500 A    # Add A with score 1500
ZADD top-products 1200 B    # Add B with score 1200
ZRANGE top-products 0 2     # Get lowest 3: D(500), C(800), B(1200)
ZREVRANGE top-products 0 2  # Get highest 3: A(1500), B(1200), C(800)
ZINCRBY top-products 100 A  # Increment A's score → 1600
```

**Used for:** Leaderboards, top-selling products, priority queues.

## Which Data Types We Use in This Project?

In our current Phase 6 implementation, we primarily need:

| Data Type | Use Case | Example |
|-----------|----------|---------|
| **String** | Cache serialized JSON | Cache product list response as JSON string |
| **String with TTL** | Auto-expiring cache | Cache lives for 5 minutes, then auto-deletes |

In later phases, we'll also use:

| Data Type | Phase | Use Case |
|-----------|-------|----------|
| **Sorted Set** | Phase 7+ | Track top-selling products |
| **String** | Phase 9 | Idempotency keys for Stripe webhooks |
| **List/Stream** | Phase 11 | BullMQ job queue backend |

## Key Naming Convention

Redis is a flat namespace (all keys live at the same level). A good naming convention prevents collisions:

```
cache:products:list:{hash-of-query-params}   # Cached product list
cache:categories:tree                         # Cached category tree
rate-limit:auth:127.0.0.1                    # Rate limit counter
session:user:abc123                          # User session
bull:orders:queue                            # BullMQ internal keys
```

We use colons to create logical namespaces. This is a convention — Redis doesn't actually create folders — but tools like RedisInsight will display them as folders.
