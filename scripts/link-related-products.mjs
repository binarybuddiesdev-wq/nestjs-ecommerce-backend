import { fileURLToPath } from 'node:url'
import { PrismaClient } from '../generated/prisma/client.js';
import { loadEnv } from './helpers/load-env.mjs';

loadEnv()

const prisma = new PrismaClient()
const BATCH_SIZE = 50

export async function linkRelatedProducts() {
  const categories = await prisma.category.findMany({
    where: { parentId: { not: null } },
    select: { id: true, slug: true },
  })

  console.log(`Linking related products in ${categories.length} leaf categories...`)

  let total = 0

  for (const cat of categories) {
    const products = await prisma.product.findMany({
      where: { categoryId: cat.id },
      select: { id: true },
    })

    if (products.length < 2) {
      total += products.length
      continue
    }

    const updates = products.map(product => {
      const others = products.filter(p => p.id !== product.id)
      others.sort(() => Math.random() - 0.5)
      const relatedIds = others.slice(0, 3 + Math.floor(Math.random() * 3)).map(p => p.id)
      return prisma.product.update({
        where: { id: product.id },
        data: { relatedProductIds: relatedIds },
      })
    })

    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const chunk = updates.slice(i, i + BATCH_SIZE)
      await prisma.$transaction(chunk)
    }

    total += products.length
    console.log(`  ${cat.slug}: ${products.length} products linked`)
  }

  console.log(`\nDone! ${total} products updated with related links.`)
  return total
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  linkRelatedProducts()
    .then(() => prisma.$disconnect())
    .catch(err => {
      console.error('Fatal:', err.message)
      prisma.$disconnect()
      process.exit(1)
    })
}
