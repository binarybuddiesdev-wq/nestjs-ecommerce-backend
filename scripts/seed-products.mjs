/**
 * Seed all ~4,342 products across 39 leaf categories.
 *
 * Usage:
 *   node scripts/seed-products.mjs
 *
 * Prerequisites:
 *   1. Run scripts/create-user.mjs (creates omi@gmail.com seller)
 *   2. Run scripts/seed-categories.mjs (creates all categories)
 *   3. User OMI must have SELLER role or ADMIN role
 */
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '../generated/prisma/client.js'
import { loadEnv } from './helpers/load-env.mjs'
import { PRODUCTS } from './product-data.mjs'

loadEnv()

const prisma = new PrismaClient()
const SELLER_EMAIL = 'omi@gmail.com'

// ─── Price Ranges Per Category (min, max in INR) ────────────────────────────

const PRICE_RANGES = {
  smartphones:       [10000, 150000],
  'mobile-accessories': [300, 5000],
  laptops:           [30000, 250000],
  tablets:           [15000, 120000],
  headphones:        [1000, 35000],
  'wireless-speakers': [1500, 80000],
  'mens-tshirts':    [500, 5000],
  'mens-jeans':      [1000, 8000],
  'womens-dresses':  [1000, 15000],
  'womens-tops':     [500, 6000],
  sneakers:          [2000, 25000],
  sandals:           [500, 12000],
  sofas:             [15000, 200000],
  'coffee-tables':   [5000, 80000],
  beds:              [10000, 150000],
  wardrobes:         [8000, 100000],
  'skin-care':       [200, 5000],
  'hair-care':       [200, 4000],
  fragrances:        [1500, 25000],
  dumbbells:         [500, 15000],
  'yoga-mats':       [500, 8000],
  'camping-tents':   [3000, 50000],
  backpacks:         [1000, 25000],
  cookware:          [1000, 40000],
  dinnerware:        [1000, 30000],
  mixers:            [2000, 60000],
  'coffee-makers':   [2000, 80000],
  'fiction-books':   [200, 2000],
  'non-fiction-books': [200, 2500],
  stationery:        [50, 3000],
  'board-games':     [500, 8000],
  'educational-toys': [500, 15000],
  'outdoor-play':    [500, 25000],
  'car-accessories': [300, 15000],
  'car-electronics': [2000, 60000],
  'motorcycle-gear': [3000, 60000],
  'dog-supplies':    [200, 5000],
  'cat-supplies':    [200, 5000],
  'pet-food':        [200, 5000],
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function roundToNearest(value, nearest) {
  return Math.round(value / nearest) * nearest
}

function generatePrice(categorySlug) {
  const [min, max] = PRICE_RANGES[categorySlug] || [500, 5000]
  const price = Math.random() * (max - min) + min
  return roundToNearest(price, 99) + 1 // ends in .99 pattern
}

// ─── Known Multi-Word Brands ──────────────────────────────────────────────────

const KNOWN_BRANDS = [
  'American Eagle',
  'Audio-Technica',
  'Bang & Olufsen',
  'Bang and Olufsen',
  'Baseus',
  'Birkenstock',
  'Calvin Klein',
  'Crate & Barrel',
  'Crate and Barrel',
  'Dolce & Gabbana',
  'Dolce and Gabbana',
  'Giorgio Armani',
  'Interior Define',
  'Jack & Jones',
  'Jack and Jones',
  'Jo Malone',
  'La Roche-Posay',
  'Levi\'s',
  'Maiden Home',
  'New Balance',
  'Paula\'s Choice',
  'Pepe Jeans',
  'Room & Board',
  'Room and Board',
  'The North Face',
  'The Ordinary',
  'Tommy Hilfiger',
  'Ultimate Ears',
  'Under Armour',
  'Villeroy & Boch',
  'Villeroy and Boch',
  'Walker Edison',
  'West Elm',
  '& Other Stories',
]

function extractBrand(name) {
  for (const brand of KNOWN_BRANDS) {
    if (name.startsWith(brand)) return brand
  }
  return name.split(' ')[0]
}

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function generateDescription(name, categorySlug) {
  const adjectives = ['Premium', 'High-quality', 'Top-rated', 'Durable', 'Elegant', 'Professional', 'Versatile', 'Reliable']
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  return `${name} — ${adj} ${categorySlug.replace(/-/g, ' ')}. Features excellent build quality, great performance, and exceptional value for money.`
}

// ─── Tags Per Category ───────────────────────────────────────────────────────

const CATEGORY_TAGS = {
  smartphones:        ['new-arrival', 'best-seller', 'premium'],
  'mobile-accessories': ['accessory', 'best-seller'],
  laptops:            ['premium', 'best-seller', 'professional'],
  tablets:            ['new-arrival', 'portable'],
  headphones:         ['audio', 'wireless'],
  'wireless-speakers': ['audio', 'wireless', 'premium'],
  'mens-tshirts':     ['casual', 'essential'],
  'mens-jeans':       ['essential', 'denim'],
  'womens-dresses':   ['fashion', 'trending'],
  'womens-tops':      ['fashion', 'essential'],
  sneakers:           ['new-arrival', 'best-seller', 'sports'],
  sandals:            ['summer', 'casual'],
  sofas:              ['furniture', 'premium'],
  'coffee-tables':    ['furniture', 'essential'],
  beds:               ['furniture', 'essential'],
  wardrobes:          ['furniture', 'storage'],
  'skin-care':        ['beauty', 'essential'],
  'hair-care':        ['beauty', 'essential'],
  fragrances:         ['beauty', 'premium', 'luxury'],
  dumbbells:          ['fitness', 'equipment'],
  'yoga-mats':        ['fitness', 'essential'],
  'camping-tents':    ['outdoor', 'camping'],
  backpacks:          ['travel', 'essential'],
  cookware:           ['kitchen', 'essential'],
  dinnerware:         ['kitchen', 'essential'],
  mixers:             ['kitchen', 'appliance'],
  'coffee-makers':    ['kitchen', 'appliance'],
  'fiction-books':    ['books', 'fiction'],
  'non-fiction-books': ['books', 'non-fiction'],
  stationery:         ['office', 'essential'],
  'board-games':      ['games', 'family'],
  'educational-toys': ['toys', 'educational'],
  'outdoor-play':     ['toys', 'outdoor'],
  'car-accessories':  ['automotive', 'accessory'],
  'car-electronics':  ['automotive', 'electronics'],
  'motorcycle-gear':  ['automotive', 'safety'],
  'dog-supplies':     ['pets', 'dogs'],
  'cat-supplies':     ['pets', 'cats'],
  'pet-food':         ['pets', 'food'],
}

function generateTags(categorySlug) {
  return CATEGORY_TAGS[categorySlug] || ['general']
}

// ─── Compare-At Price (30% of products get a discount) ──────────────────────

function generateCompareAtPrice(actualPrice) {
  if (Math.random() > 0.3) return null
  const markup = 0.1 + Math.random() * 0.3 // 10-40% higher
  return roundToNearest(actualPrice * (1 + markup), 99) + 1
}

// ─── Weight & Dimensions (only for physical goods) ──────────────────────────

const PHYSICAL_CATEGORIES = new Set([
  'smartphones', 'mobile-accessories', 'laptops', 'tablets', 'headphones',
  'wireless-speakers', 'sneakers', 'sandals', 'sofas', 'coffee-tables',
  'beds', 'wardrobes', 'dumbbells', 'yoga-mats', 'camping-tents',
  'backpacks', 'cookware', 'dinnerware', 'mixers', 'coffee-makers',
  'mens-tshirts', 'mens-jeans', 'womens-dresses', 'womens-tops',
  'car-accessories', 'car-electronics', 'motorcycle-gear',
  'dog-supplies', 'cat-supplies', 'pet-food',
])

const CATEGORY_WEIGHT = {
  smartphones:        { w: 0.2, dim: '15x7x0.8 cm' },
  'mobile-accessories': { w: 0.1, dim: '10x5x2 cm' },
  laptops:            { w: 2.0, dim: '35x25x2 cm' },
  tablets:            { w: 0.5, dim: '25x17x0.7 cm' },
  headphones:         { w: 0.3, dim: '20x18x8 cm' },
  'wireless-speakers': { w: 1.0, dim: '25x15x12 cm' },
  sneakers:           { w: 1.2, dim: '32x20x12 cm' },
  sandals:            { w: 0.5, dim: '30x18x5 cm' },
  sofas:              { w: 45, dim: '200x90x85 cm' },
  'coffee-tables':    { w: 20, dim: '120x60x45 cm' },
  beds:               { w: 50, dim: '200x180x40 cm' },
  wardrobes:          { w: 60, dim: '180x80x55 cm' },
  dumbbells:          { w: 10, dim: '40x15x15 cm' },
  'yoga-mats':        { w: 1.5, dim: '180x60x0.5 cm' },
  'camping-tents':    { w: 5, dim: '60x20x20 cm' },
  backpacks:          { w: 0.8, dim: '50x30x20 cm' },
  cookware:           { w: 2.5, dim: '35x25x15 cm' },
  dinnerware:         { w: 3.0, dim: '40x30x25 cm' },
  mixers:             { w: 5.0, dim: '35x20x25 cm' },
  'coffee-makers':    { w: 3.0, dim: '30x25x35 cm' },
  'mens-tshirts':     { w: 0.2, dim: '30x20x2 cm' },
  'mens-jeans':       { w: 0.5, dim: '35x25x3 cm' },
  'womens-dresses':   { w: 0.3, dim: '40x25x2 cm' },
  'womens-tops':      { w: 0.2, dim: '30x20x2 cm' },
  'car-accessories':  { w: 0.5, dim: '20x15x10 cm' },
  'car-electronics':  { w: 0.8, dim: '25x18x5 cm' },
  'motorcycle-gear':  { w: 2.0, dim: '50x30x20 cm' },
  'dog-supplies':     { w: 0.5, dim: '30x20x10 cm' },
  'cat-supplies':     { w: 0.3, dim: '25x15x8 cm' },
  'pet-food':         { w: 2.0, dim: '30x20x10 cm' },
}

function generateWeightDimensions(categorySlug) {
  const info = CATEGORY_WEIGHT[categorySlug]
  if (!info) return { weight: null, dimensions: null }
  return { weight: info.w + (Math.random() - 0.5) * 0.2, dimensions: info.dim }
}

// ─── Warranty Info (electronics only) ────────────────────────────────────────

const WARRANTY_CATEGORIES = new Set([
  'smartphones', 'mobile-accessories', 'laptops', 'tablets', 'headphones',
  'wireless-speakers', 'mixers', 'coffee-makers', 'car-electronics',
])

function generateWarranty(categorySlug) {
  if (!WARRANTY_CATEGORIES.has(categorySlug)) return null
  const periods = ['1 year manufacturer warranty', '2 years manufacturer warranty', '3 years extended warranty', '1 year limited warranty']
  return periods[Math.floor(Math.random() * periods.length)]
}

// ─── Expiry Date (pet food only) ─────────────────────────────────────────────

function generateExpiryDate(categorySlug) {
  if (categorySlug !== 'pet-food') return null
  const future = new Date()
  future.setFullYear(future.getFullYear() + 1 + Math.floor(Math.random() * 2))
  return future
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

export async function seedProducts() {
  const seller = await prisma.user.findUnique({ where: { email: SELLER_EMAIL } })
  if (!seller) {
    throw new Error(`Seller not found: ${SELLER_EMAIL}. Run scripts/create-user.mjs first.`)
  }

  const categories = await prisma.category.findMany({
    where: { slug: { in: Object.keys(PRODUCTS) } },
  })
  const catMap = Object.fromEntries(categories.map(c => [c.slug, c.id]))
  const missingCats = Object.keys(PRODUCTS).filter(s => !catMap[s])
  if (missingCats.length > 0) {
    throw new Error(`Missing categories: ${missingCats.join(', ')}. Run scripts/seed-categories.mjs first.`)
  }

  console.log(`Seller: ${seller.email} (${seller.role})`)
  console.log(`Categories found: ${categories.length}`)
  console.log(`Total products to seed: ${Object.values(PRODUCTS).reduce((s, p) => s + p.length, 0)}`)

  let count = 0
  const total = Object.values(PRODUCTS).reduce((s, p) => s + p.length, 0)

  for (const [slug, products] of Object.entries(PRODUCTS)) {
    const categoryId = catMap[slug]
    console.log(`\n${slug} (${products.length} products)...`)

    const batch = products.map(name => {
      const price = generatePrice(slug)
      const { weight, dimensions } = generateWeightDimensions(slug)
      return {
        name,
        slug: slugify(name),
        description: generateDescription(name, slug),
        price,
        stock: randomInt(10, 500),
        images: [],
        brand: extractBrand(name),
        tags: generateTags(slug),
        compareAtPrice: generateCompareAtPrice(price),
        weight,
        dimensions,
        warrantyInfo: generateWarranty(slug),
        expiryDate: generateExpiryDate(slug),
        categoryId,
        sellerId: seller.id,
        isActive: true,
      }
    })

    const BATCH_SIZE = 50
    for (let i = 0; i < batch.length; i += BATCH_SIZE) {
      const chunk = batch.slice(i, i + BATCH_SIZE)
      await prisma.$transaction(
        chunk.map(data => prisma.product.create({ data }))
      )
      count += chunk.length
    }

    console.log(`  ✓ ${batch.length} created (${count}/${total})`)
  }

  console.log(`\nDone! ${count} products seeded.`)
  return count
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedProducts()
    .then(() => prisma.$disconnect())
    .catch(err => {
      console.error('Fatal:', err.message)
      prisma.$disconnect()
      process.exit(1)
    })
}
