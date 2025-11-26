import { PrismaClient } from '@/src/generated/prisma'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Configure Prisma Client for Supabase pgbouncer
// Key: Set pgbouncer=true in DATABASE_URL to use transaction mode
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL, // Use pooled connection with pgbouncer
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Graceful cleanup on shutdown to prevent connection leaks
const cleanup = async () => {
  try {
    await prisma.$disconnect()
    console.log('Prisma disconnected successfully')
  } catch (e) {
    console.error('Error disconnecting Prisma:', e)
  }
}

// Register cleanup handlers for all termination scenarios
if (typeof process !== 'undefined') {
  process.on('beforeExit', cleanup)
  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
  process.on('SIGUSR2', cleanup) // nodemon restart
}

export default prisma
