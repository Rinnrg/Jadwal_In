import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

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
        include: {
          profile: true,
        },
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
    // For super admin, check hardcoded password
    if (user.role === 'super_admin') {
      if (password !== 'gacorkang') {
        return NextResponse.json(
          { error: 'Password salah' },
          { status: 401 }
        )
      }
    } else {
      // For other users, check if password is set and matches
      if (!user.password) {
        return NextResponse.json(
          { error: 'Password belum diatur. Silakan hubungi admin.' },
          { status: 401 }
        )
      }
      
      if (user.password !== password) {
        return NextResponse.json(
          { error: 'Password salah' },
          { status: 401 }
        )
      }
    }

    // Login successful
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        image: user.image,
      },
    })
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
