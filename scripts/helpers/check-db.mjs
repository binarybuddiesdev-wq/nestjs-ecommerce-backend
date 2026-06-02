import { PrismaClient } from '../../generated/prisma/client.js'
const p = new PrismaClient()
try {
  const u = await p.user.findUnique({ where: { email: 'omi@gmail.com' } })
  console.log('User:', u?.email, u?.role)
  const c = await p.category.count()
  console.log('Categories:', c)
} finally {
  await p.$disconnect()
}
