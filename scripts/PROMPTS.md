# Seed Scripts — Prompts & Usage

All scripts are in `scripts/` and auto-load `.env` — no manual env setup needed.

---

## 1. Create a User

```bash
node scripts/create-user.mjs
```

Edit `USER_CONFIG` at the top of the file to set email, password, role.

---

## 2. Seed All Categories (60)

```bash
node scripts/seed-categories.mjs
```

Upserts 60 categories — 10 roots, 18 subcategories, 32 leaf categories. Safe to re-run.

---

## 3. Seed All Products (~4,342)

```bash
node scripts/seed-products.mjs
```

**Prerequisites:** User `omi@gmail.com` must exist (run `create-user.mjs`) and categories must be seeded (run `seed-categories.mjs`).

Products are created with:
- Generated descriptions, prices (INR), stock (10-500)
- Empty `images` array — upload via API after creation
- Auto-generated slugs from product names

---

## 4. Full Setup (Everything)

```bash
node scripts/create-user.mjs
node scripts/seed-categories.mjs
node scripts/seed-products.mjs
```

---

## 5. Upload Images (via API)

After seeding, upload product images via the API endpoint:

```
POST /api/v1/products/:id/images
Content-Type: multipart/form-data
Body: image file
```

This uploads to Cloudinary and adds the URL to the product's `images` array.

---

## 6. Verify Data

```bash
# Count products
node --import @swc-node/register/esm-register -e "import { PrismaClient } from '../generated/prisma/client.js'; const p = new PrismaClient(); console.log('Products:', await p.product.count()); await p.\$disconnect()"

# Count categories
node --import @swc-node/register/esm-register -e "import { PrismaClient } from '../generated/prisma/client.js'; const p = new PrismaClient(); console.log('Categories:', await p.category.count()); await p.\$disconnect()"
```

---

## File Reference

| File | Description |
|------|-------------|
| `scripts/helpers/load-env.mjs` | Shared env loader — loads `.env` into `process.env` |
| `scripts/create-user.mjs` | Creates a user with configurable email/password/role |
| `scripts/seed-categories.mjs` | Seeds all 60 categories (upsert, safe to re-run) |
| `scripts/product-data.mjs` | Complete product list — ~4,342 products across 39 categories |
| `scripts/seed-products.mjs` | Seeds all products into database |
| `scripts/seed-products-plan.md` | Full product listing by category and brand |
