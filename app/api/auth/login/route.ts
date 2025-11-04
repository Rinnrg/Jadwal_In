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

// Helper function to retry database queries
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: any
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      if (i < maxRetries - 1) {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay))
        console.log(`Retry attempt ${i + 1}/${maxRetries}`)
      }
    }
  }
  
  throw lastError
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    // Find user by email with retry logic
    const user = await withRetry(async () => {
      return await prisma.user.findUnique({
        where: { email },
      })
    })

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

    return response
  } catch (error) {
    console.error('Login error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat login' },
      { status: 500 }
    )
  }
}
