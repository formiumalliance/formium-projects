// lib/db/prisma.ts
// Singleton PrismaClient — cached across requests in BOTH dev and production.
// Without this, production creates a new client per request, exhausting the
// Supabase connection pool and causing intermittent crashes on all dashboards.
import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['error', 'warn']
      : ['error'],
    // Limit connections — important for Supabase transaction pooler (pgBouncer)
    // Each Next.js worker should hold at most 1-2 connections
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
}

// Re-use the client across hot reloads in dev; persist across requests in prod
export const prisma: PrismaClient = globalThis.__prisma ?? createPrismaClient()
globalThis.__prisma = prisma

export default prisma
