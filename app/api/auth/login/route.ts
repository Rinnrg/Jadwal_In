import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

// Mark as dynamic route
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Increase timeout to 60 seconds for Vercel Pro
export const runtime = 'nodejs'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// Helper function to retry database queries with exponential backoff
async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string = 'Database operation',
  maxRetries = 2 // Reduce to 2 retries to avoid timeout
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
        // Faster retry: 500ms, 1s
        const waitTime = 500 * attempt
        console.log(`⏳ Waiting ${waitTime}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }
  
  console.error(`❌ ${operationName} failed after ${maxRetries} attempts`)
  throw lastError
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('🔐 Login attempt started')
    const body = await request.json()
    console.log('📧 Email:', body.email)
    const { email, password } = loginSchema.parse(body)

    console.log('⚡ Finding user in database...')

    // Find user by email with timeout protection (no retry to save time)
    let user: any = null
    try {
      user = await Promise.race([
        prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true,
            image: true,
            prodi: true,
          }
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Database query timeout')), 8000)
        )
      ])
      console.log(`✅ User query completed in ${Date.now() - startTime}ms`)
    } catch (queryError: any) {
      console.error('❌ Database query failed:', queryError.message)
      return NextResponse.json(
        { error: 'Database timeout. Silakan gunakan Google Sign-In atau coba lagi.' },
        { status: 503 }
      )
    }

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
