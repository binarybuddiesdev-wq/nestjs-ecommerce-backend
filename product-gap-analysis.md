# Product Gap Analysis — Phase 6

## Current State vs Requirements

### ✅ Implemented
| Item | Status |
|------|--------|
| Product model: id, name, slug, description, price, stock, images[], categoryId, sellerId, isActive, createdAt, updatedAt | ✅ |
| POST /api/v1/products — Create with multipart image upload | ✅ |
| GET /api/v1/products — List with cursor pagination | ✅ |
| Filters: category, search, minPrice, maxPrice | ✅ |
| Prisma indexes: categoryId, sellerId, price, createdAt | ✅ |
| Cloudinary image upload (via uploads module) | ✅ |
| API constants for all product routes/operations/messages | ✅ |

---

### ❌ Missing — Listed in phases.md but Not Implemented

| # | Item | Priority | Notes |
|---|------|----------|-------|
| 1 | GET /api/v1/products/:slug — Single product detail | **High** | Public endpoint, essential |
| 2 | PATCH /api/v1/products/:id — Update own product | **High** | Seller only |
| 3 | DELETE /api/v1/products/:id — Soft delete own product | **High** | Seller only |
| 4 | GET /api/v1/seller/products — Seller's own products | **High** | Seller dashboard |
| 5 | GET /api/v1/admin/products — Admin all products | **Medium** | Admin management |
| 6 | inStock filter (stock > 0) | **Medium** | Listed in phases.md |
| 7 | isActive filter | **Low** | Admin only |
| 8 | Sorting: price asc/desc, createdAt asc/desc, name asc/desc | **Medium** | Listed in phases.md |
| 9 | Redis cache on GET /api/v1/products | **Medium** | Invalidated on mutation |
| 10 | Full-text search on description (currently name only) | **Low** | listed in phases.md |

---

### ❌ Missing — Not in phases.md but Standard for Ecommerce

| # | Item | Priority | Why |
|---|------|----------|-----|
| 1 | **Related Products** — Products in same category or cross-sell | **Medium** | User requested. Drives upsells. Standard in every ecommerce site |
| 2 | **Brand field** (separate from name) | **Medium** | Currently brand is embedded in name like "Samsung Galaxy S26 Ultra". Should be `{ brand: "Samsung", name: "Galaxy S26 Ultra" }` for filtering |
| 3 | **Compare-at price / original price** | **Medium** | Needed for discount display: "Was ₹50,000, now ₹35,000" |
| 4 | **SKU** (Stock Keeping Unit) | **Medium** | Essential for inventory tracking, warehouse, and order fulfillment |
| 5 | **Tags** (string[]) | **Low** | Extra filtering: "best-seller", "new-arrival", "eco-friendly" |
| 6 | **Sold count** (number of units sold) | **Low** | Popularity metric, social proof |
| 7 | **Weight & Dimensions** (weight, length, width, height) | **Low** | Shipping cost calculation |
| 8 | **Warranty info** (warranty period string) | **Low** | Especially for electronics |

---

### ⏳ Planned in Later Phases

| Item | Phase | Status |
|------|-------|--------|
| Rating (average rating) | Phase 10 — Reviews | 🔴 Not started |
| Review count | Phase 10 — Reviews | 🔴 Not started |
| Review create/read/update/delete | Phase 10 — Reviews | 🔴 Not started |

---

### Seed Data Gaps

| # | Issue | Impact |
|---|-------|--------|
| 1 | `images` array is empty after seeding | Products show without photos. Must upload via API after seeding |
| 2 | Brand is embedded in name (e.g. "Samsung Galaxy S26 Ultra") | Cannot filter by brand separately. Migration needed later |
| 3 | No seed script for related products | Need to pair products after seeding |
| 4 | Product descriptions are generated (template-based) | Functional but not hand-written. OK for MVP |

---

## Recommended Immediate Action Items (Phase 6)

1. **Complete phases.md tasks first:**
   - GET /api/v1/products/:slug
   - PATCH /api/v1/products/:id
   - DELETE /api/v1/products/:id
   - GET /api/v1/seller/products
   - GET /api/v1/admin/products
   - Add sorting + inStock filter to findAll

2. **Then add Related Products:**
   - Add `relatedProductIds: String[]` to Product model
   - GET /api/v1/products/:id/related — returns related products
   - POST /api/v1/products/:id/related — Seller adds related products
   - Auto-suggest based on same category as fallback

3. **Seed with real images:**
   - Upload at least 1 image per product after seeding
   - Use POST /api/v1/uploads or POST /api/v1/products/:id/images

4. **Defer to later phases:**
   - Brand field (requires data migration)
   - Compare-at price (requires schema migration)
   - SKU (requires inventory system)
   - Ratings/Reviews (Phase 10)
