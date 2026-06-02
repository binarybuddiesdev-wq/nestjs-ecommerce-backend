/**
 * Seed all product categories (10 roots, 29 subcategories, 39 leaf categories).
 *
 * Usage:
 *   node scripts/seed-categories.mjs
 *
 * Safe to run multiple times — categories are upserted by slug.
 */

import { PrismaClient } from '../generated/prisma/client.js'
import { loadEnv } from './helpers/load-env.mjs'

loadEnv()

const prisma = new PrismaClient()

const CATEGORIES = [
  // ── Roots (level 0) ─────────────────────────────────────────────────────
  { name: 'Electronics',           slug: 'electronics',           parentSlug: null },
  { name: 'Fashion & Apparel',     slug: 'fashion-apparel',       parentSlug: null },
  { name: 'Home & Furniture',      slug: 'home-furniture',        parentSlug: null },
  { name: 'Beauty & Personal Care',slug: 'beauty-personal-care',  parentSlug: null },
  { name: 'Sports & Fitness',      slug: 'sports-fitness',        parentSlug: null },
  { name: 'Kitchen & Dining',      slug: 'kitchen-dining',        parentSlug: null },
  { name: 'Books & Media',         slug: 'books-media',           parentSlug: null },
  { name: 'Toys & Games',          slug: 'toys-games',            parentSlug: null },
  { name: 'Automotive',            slug: 'automotive',            parentSlug: null },
  { name: 'Pet Supplies',          slug: 'pet-supplies',          parentSlug: null },

  // ── Electronics children (level 1) ─────────────────────────────────────
  { name: 'Mobile Phones & Accessories', slug: 'mobile-phones-accessories', parentSlug: 'electronics' },
  { name: 'Computers & Laptops',        slug: 'computers-laptops',          parentSlug: 'electronics' },
  { name: 'Audio',                      slug: 'audio',                      parentSlug: 'electronics' },

  // ── Electronics grandchildren (level 2) ────────────────────────────────
  { name: 'Smartphones',        slug: 'smartphones',        parentSlug: 'mobile-phones-accessories' },
  { name: 'Mobile Accessories', slug: 'mobile-accessories', parentSlug: 'mobile-phones-accessories' },
  { name: 'Laptops',           slug: 'laptops',            parentSlug: 'computers-laptops' },
  { name: 'Tablets',           slug: 'tablets',            parentSlug: 'computers-laptops' },
  { name: 'Headphones',        slug: 'headphones',         parentSlug: 'audio' },
  { name: 'Wireless Speakers', slug: 'wireless-speakers',  parentSlug: 'audio' },

  // ── Fashion children (level 1) ─────────────────────────────────────────
  { name: "Men's Clothing",   slug: 'mens-clothing',   parentSlug: 'fashion-apparel' },
  { name: "Women's Clothing", slug: 'womens-clothing', parentSlug: 'fashion-apparel' },
  { name: 'Footwear',         slug: 'footwear',        parentSlug: 'fashion-apparel' },

  // ── Fashion grandchildren (level 2) ────────────────────────────────────
  { name: "Men's T-Shirts", slug: 'mens-tshirts',   parentSlug: 'mens-clothing' },
  { name: "Men's Jeans",    slug: 'mens-jeans',      parentSlug: 'mens-clothing' },
  { name: "Women's Dresses",slug: 'womens-dresses',  parentSlug: 'womens-clothing' },
  { name: "Women's Tops",   slug: 'womens-tops',     parentSlug: 'womens-clothing' },
  { name: 'Sneakers',       slug: 'sneakers',        parentSlug: 'footwear' },
  { name: 'Sandals',        slug: 'sandals',         parentSlug: 'footwear' },

  // ── Home & Furniture children (level 1) ─────────────────────────────────
  { name: 'Living Room Furniture', slug: 'living-room-furniture', parentSlug: 'home-furniture' },
  { name: 'Bedroom Furniture',     slug: 'bedroom-furniture',     parentSlug: 'home-furniture' },

  // ── Home & Furniture grandchildren (level 2) ───────────────────────────
  { name: 'Sofas',        slug: 'sofas',         parentSlug: 'living-room-furniture' },
  { name: 'Coffee Tables',slug: 'coffee-tables', parentSlug: 'living-room-furniture' },
  { name: 'Beds',         slug: 'beds',          parentSlug: 'bedroom-furniture' },
  { name: 'Wardrobes',    slug: 'wardrobes',     parentSlug: 'bedroom-furniture' },

  // ── Beauty children (level 1, leaves) ───────────────────────────────────
  { name: 'Skin Care',    slug: 'skin-care',    parentSlug: 'beauty-personal-care' },
  { name: 'Hair Care',    slug: 'hair-care',    parentSlug: 'beauty-personal-care' },
  { name: 'Fragrances',   slug: 'fragrances',   parentSlug: 'beauty-personal-care' },

  // ── Sports children (level 1) ───────────────────────────────────────────
  { name: 'Gym Equipment', slug: 'gym-equipment', parentSlug: 'sports-fitness' },
  { name: 'Outdoor Sports', slug: 'outdoor-sports', parentSlug: 'sports-fitness' },

  // ── Sports grandchildren (level 2) ──────────────────────────────────────
  { name: 'Dumbbells',    slug: 'dumbbells',    parentSlug: 'gym-equipment' },
  { name: 'Yoga Mats',    slug: 'yoga-mats',    parentSlug: 'gym-equipment' },
  { name: 'Camping Tents',slug: 'camping-tents',parentSlug: 'outdoor-sports' },
  { name: 'Backpacks',    slug: 'backpacks',    parentSlug: 'outdoor-sports' },

  // ── Kitchen children (level 1) ──────────────────────────────────────────
  { name: 'Cookware',         slug: 'cookware',          parentSlug: 'kitchen-dining' },
  { name: 'Dinnerware',       slug: 'dinnerware',        parentSlug: 'kitchen-dining' },
  { name: 'Small Appliances', slug: 'small-appliances',  parentSlug: 'kitchen-dining' },

  // ── Kitchen grandchildren (level 2) ─────────────────────────────────────
  { name: 'Mixers',       slug: 'mixers',       parentSlug: 'small-appliances' },
  { name: 'Coffee Makers',slug: 'coffee-makers',parentSlug: 'small-appliances' },

  // ── Books children (level 1, leaves) ────────────────────────────────────
  { name: 'Fiction Books',    slug: 'fiction-books',    parentSlug: 'books-media' },
  { name: 'Non-Fiction Books',slug: 'non-fiction-books',parentSlug: 'books-media' },
  { name: 'Stationery',       slug: 'stationery',       parentSlug: 'books-media' },

  // ── Toys children (level 1, leaves) ─────────────────────────────────────
  { name: 'Board Games',     slug: 'board-games',     parentSlug: 'toys-games' },
  { name: 'Educational Toys',slug: 'educational-toys',parentSlug: 'toys-games' },
  { name: 'Outdoor Play',    slug: 'outdoor-play',    parentSlug: 'toys-games' },

  // ── Automotive children (level 1, leaves) ───────────────────────────────
  { name: 'Car Accessories', slug: 'car-accessories', parentSlug: 'automotive' },
  { name: 'Car Electronics', slug: 'car-electronics', parentSlug: 'automotive' },
  { name: 'Motorcycle Gear', slug: 'motorcycle-gear', parentSlug: 'automotive' },

  // ── Pet Supplies children (level 1, leaves) ─────────────────────────────
  { name: 'Dog Supplies', slug: 'dog-supplies', parentSlug: 'pet-supplies' },
  { name: 'Cat Supplies', slug: 'cat-supplies', parentSlug: 'pet-supplies' },
  { name: 'Pet Food',     slug: 'pet-food',     parentSlug: 'pet-supplies' },
]

export async function seedCategories() {
  const slugToId = {}
  let created = 0

  for (const cat of CATEGORIES) {
    const parentId = cat.parentSlug ? slugToId[cat.parentSlug] : null

    const result = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, parentId, isActive: true },
      create: { name: cat.name, slug: cat.slug, parentId, isActive: true },
    })

    slugToId[cat.slug] = result.id
    created++
  }

  console.log(`Categories seeded: ${created} total`)
  return created
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedCategories().catch(err => {
    console.error('Error:', err.message)
    process.exit(1)
  }).finally(() => prisma.$disconnect())
}
