/**
 * Create a new user in the database.
 *
 * Usage:
 *   node scripts/create-user.mjs
 *
 * Edit the USER_CONFIG below with the desired values, then run.
 * Or import and call createUser() from another script.
 */

import { fileURLToPath } from 'node:url'
import { PrismaClient } from '../generated/prisma/client.js'
import { loadEnv } from './helpers/load-env.mjs'
import bcrypt from 'bcrypt'

loadEnv()

// ─── CONFIG – edit these values ─────────────────────────────────────────────
const USER_CONFIG = {
  email: 'omi@gmail.com',
  password: 'omiomi@123',
  name: 'OMI',
  role: 'CUSTOMER',        // CUSTOMER | SELLER | ADMIN
  avatar: null,             // URL string or null
}
// ──────────────────────────────────────────────────────────────────────────────

const prisma = new PrismaClient()

export async function createUser(config = USER_CONFIG) {
  const exists = await prisma.user.findUnique({ where: { email: config.email } })
  if (exists) {
    console.log(`User already exists: ${config.email} (${exists.id})`)
    return exists
  }

  const hashed = await bcrypt.hash(config.password, 10)

  const user = await prisma.user.create({
    data: {
      email: config.email,
      password: hashed,
      name: config.name,
      role: config.role,
      avatar: config.avatar,
    },
  })

  console.log(`User created: ${user.email} (${user.id}, role: ${user.role})`)
  return user
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createUser().catch(err => {
    console.error('Error:', err.message)
    process.exit(1)
  }).finally(() => prisma.$disconnect())
}
