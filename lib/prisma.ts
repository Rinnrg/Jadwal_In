import { PrismaClient } from '@/src/generated/prisma'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Use DATABASE_URL with pgbouncer for connection pooling in serverless
// Use DIRECT_URL for migrations and schema operations
const getDatabaseUrl = () => {
  // In production/serverless, use pooled connection
  if (process.env.NODE_ENV === 'production') {
    return process.env.DATABASE_URL
  }
  // In development, can use either
  return process.env.DIRECT_URL || process.env.DATABASE_URL
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Graceful shutdown handlers for both development and production
const disconnectPrisma = async () => {
  try {
    await prisma.$disconnect()
    console.log('✅ Prisma disconnected successfully')
  } catch (error) {
    console.error('❌ Error disconnecting Prisma:', error)
  }
}

// Handle process termination
if (typeof process !== 'undefined') {
  process.on('beforeExit', disconnectPrisma)
  process.on('SIGINT', disconnectPrisma)
  process.on('SIGTERM', disconnectPrisma)
}

export default prisma
