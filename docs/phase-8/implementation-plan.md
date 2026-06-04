# Phase 8 — Orders & State Machine Implementation Plan

## Goal
Order placement from cart with atomic inventory reservation. Order state machine with valid transitions only. Most complex business logic phase.

## Order State Machine

```
PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
   |          |                                      |
   |          +---→ CANCELLED ←---+                  |
   |                ↓             |                  |
   |            REFUNDED          |                  |
   +---→ CANCELLED ---------------+                  |
                                    +---→ REFUNDED
```

### Valid transitions:
| Transition | Who can trigger |
|------------|-----------------|
| PENDING → CONFIRMED | System (payment webhook) |
| PENDING → CANCELLED | CUSTOMER, ADMIN |
| CONFIRMED → PROCESSING | SELLER, ADMIN |
| CONFIRMED → CANCELLED | CUSTOMER, ADMIN |
| PROCESSING → SHIPPED | SELLER, ADMIN |
| PROCESSING → CANCELLED | ADMIN only |
| SHIPPED → DELIVERED | CUSTOMER, ADMIN |
| DELIVERED → REFUNDED | ADMIN only |
| CANCELLED → REFUNDED | ADMIN only |

## Prisma Schema Additions

### Order Model
```prisma
model Order {
  id              String        @id @default(auto()) @map("_id") @db.ObjectId
  customerId      String        @db.ObjectId
  items           OrderItem[]
  status          String        @default("PENDING")
  totalAmount     Float
  shippingAddress ShippingAddress (embedded)
  couponId        String?       @db.ObjectId
  discountAmount  Float         @default(0)
  timeline        StatusChange[]
  notes           String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}

type OrderItem {
  productId  String
  sellerId   String
  name       String
  price      Float
  quantity   Int
  image      String?
}

type ShippingAddress {
  label   String
  street  String
  city    String
  state   String
  zipCode String
  country String
}

type StatusChange {
  from      String
  to        String
  changedBy String
  timestamp DateTime
  note      String?
}

model Coupon {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  code            String   @unique
  discountType    String   // PERCENTAGE or FLAT
  discountValue   Float
  minOrderValue   Float    @default(0)
  maxUses         Int      @default(0)  // 0 = unlimited
  usedCount       Int      @default(0)
  expiresAt       DateTime?
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
}
```

## API Endpoints (5 total)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/v1/orders | CUSTOMER | Place order from cart |
| GET | /api/v1/orders | CUSTOMER, ADMIN | List orders (paginated) |
| GET | /api/v1/orders/:id | CUSTOMER, SELLER, ADMIN | Order detail |
| PATCH | /api/v1/orders/:id/status | Varies | Update status |
| GET | /api/v1/orders/:id/timeline | CUSTOMER, ADMIN | Status history |

## Implementation Order

1. Order schema in Prisma + generate client
2. OrderStatus enum + types
3. ApiRoutes, ApiOperation, ApiTags, messages in api.constants.ts
4. DTOs (PlaceOrderDto, UpdateOrderStatusDto)
5. OrderService (state machine, inventory, coupon logic)
6. OrderController (HTTP endpoints with Swagger)
7. Swagger response schemas
8. Unit tests
9. Type check + build + test
10. Update ROUTES.md and docs

## Key Design Decisions

1. **No price snapshot**: Prices resolved live from Products on read (same as Cart). OrderItem stores name/price at time of placement as an audit record.
2. **Inventory atomicity**: Stock decrement happens in same DB operation as order creation. If stock check passes but decrement fails, the entire operation rolls back.
3. **Cart clearance**: Cart is cleared in the same operation as order creation — no orphan carts.
4. **Coupon validation**: Validated at order time (not at read time). Used count incremented atomically.
5. **BullMQ integration**: Order confirmation job queued but worker can be implemented in Phase 11. The queue call is fire-and-forget for now.
