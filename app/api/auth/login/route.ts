import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

// Mark as dynamic route
export const dynamic = 'force-dynamic'
export const maxDuration = 10 // Allow up to 10 seconds for serverless function

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// Helper function to retry database queries with exponential backoff
async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string = 'Database operation',
  maxRetries = 3
): Promise<T> {
  let lastError: any
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 ${operationName} (attempt ${attempt}/${maxRetries})`)
      const result = await operation()
      console.log(`✅ ${operationName} successful`)
      return result
    } catch (error) {
      lastError = error
      console.error(`❌ ${operationName} failed (attempt ${attempt}/${maxRetries}):`, error)
      
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
        console.log(`⏳ Waiting ${waitTime}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }
  
  console.error(`❌ ${operationName} failed after ${maxRetries} attempts`)
  throw lastError
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Login attempt started')
    const body = await request.json()
    console.log('📧 Email:', body.email)
    const { email, password } = loginSchema.parse(body)

    // Test database connection first with retry
    try {
      await withRetry(
        () => prisma.$queryRaw`SELECT 1`,
        'Database connection test',
        2
      )
      console.log('✅ Database connection successful')
    } catch (dbError: any) {
      console.error('❌ Database connection failed after retries:', dbError)
      return NextResponse.json(
        { 
          error: 'Database tidak dapat diakses saat ini. Silakan coba lagi atau gunakan login Google.',
          details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
        },
        { status: 503 }
      )
    }

    // Find user by email with retry logic
    const user = await withRetry(
      () => prisma.user.findUnique({
        where: { email },
      }),
      'Find user by email'
    )

    // User not found in database
    if (!user) {
      return NextResponse.json(
        { error: 'Email tidak terdaftar. Silakan hubungi admin untuk membuat akun.' },
        { status: 404 }
      )
    }

    // Validate password
    let isPasswordValid = false
    
    // For super admin, check hardcoded password
    if (user.role === 'super_admin') {
      isPasswordValid = password === 'gacorkang'
    } else {
      // For other users, check if password is set
      if (!user.password) {
        return NextResponse.json(
          { 
            error: 'Akun ini dibuat melalui Google Sign-In dan belum memiliki password. Silakan login menggunakan tombol "Google" atau hubungi admin untuk mengatur password.' 
          },
          { status: 401 }
        )
      }
      
      // Check if password is hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
      if (user.password.startsWith('$2')) {
        // Use bcrypt compare for hashed passwords
        isPasswordValid = await bcrypt.compare(password, user.password)
      } else {
        // Plain text comparison for legacy passwords
        isPasswordValid = user.password === password
      }
    }

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Password salah' },
        { status: 401 }
      )
    }

    // Create session token
    const sessionToken = randomBytes(32).toString('hex')
    // Note: Session stored in cookie only, not in database
    // Database session model not available in current schema

    // Create response
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        image: user.image,
        prodi: user.prodi,
      },
    })

    // Set session cookie
    response.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })

    // Set user ID cookie for session validation (non-httpOnly so client can read)
    response.cookies.set('user_id', user.id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('❌ Login error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: error.errors },
        { status: 400 }
      )
    }
    
    // Provide more specific error messages
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Error details:', errorMessage)
    
    // Check for prepared statement errors (pgbouncer issues)
    if (errorMessage.includes('prepared statement') || errorMessage.includes('P2010') || errorMessage.includes('26000')) {
      console.error('⚠️ Prepared statement error detected - pgbouncer configuration issue')
      return NextResponse.json(
        { error: 'Error koneksi database. Silakan coba lagi dalam beberapa saat.' },
        { status: 503 }
      )
    }
    
    // Check for database-related errors
    if (errorMessage.includes('prisma') || errorMessage.includes('database') || errorMessage.includes('connection')) {
      return NextResponse.json(
        { error: 'Koneksi database bermasalah. Silakan coba lagi atau gunakan login Google.' },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat login. Silakan coba lagi atau gunakan login Google.' },
      { status: 500 }
    )
  }
}
