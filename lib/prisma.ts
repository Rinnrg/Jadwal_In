import { PrismaClient } from '@/src/generated/prisma'

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined
}

// Create Prisma Client with retry logic extension
function createPrismaClient() {
  // Ensure DATABASE_URL uses pgbouncer pooler (port 6543)
  const databaseUrl = process.env.DATABASE_URL
  
  // Log connection info (remove sensitive data in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('[Prisma] Using DATABASE_URL:', databaseUrl?.replace(/:[^:@]+@/, ':***@'))
  }
  
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: databaseUrl, // Must use pooled connection with pgbouncer (port 6543)
      },
    },
  })

  return client.$extends({
    query: {
      $allOperations({ operation, model, args, query }) {
        // Add connection timeout and retry logic at Prisma level
        const maxRetries = 3
        let lastError: any
        
        const executeWithRetry = async (attempt: number): Promise<any> => {
          try {
            return await query(args)
          } catch (error: any) {
            lastError = error
            
            // Retry on connection errors
            if (
              attempt < maxRetries &&
              (error.code === 'P1001' || // Can't reach database server
               error.code === 'P1002' || // Database server timeout
               error.code === 'P1008' || // Operations timed out
               error.code === 'P1017' || // Server has closed the connection
               error.message?.includes('Connection') ||
               error.message?.includes('timeout'))
            ) {
              const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 3000)
              await new Promise(resolve => setTimeout(resolve, waitTime))
              return executeWithRetry(attempt + 1)
            }
            
            throw error
          }
        }
        
        return executeWithRetry(1)
      },
    },
  })
}

// Configure Prisma Client for Supabase pgbouncer
// Key: Set pgbouncer=true in DATABASE_URL to use transaction mode
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

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
