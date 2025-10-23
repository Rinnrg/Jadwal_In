import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Mark as dynamic route
export const dynamic = 'force-dynamic'
export const maxDuration = 10

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

    // User not found
    if (!user) {
      return NextResponse.json(
        { error: 'Email tidak terdaftar.' },
        { status: 404 }
      )
    }

    // Check if user is super admin
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Akses ditolak. Halaman ini khusus untuk Super Admin.' },
        { status: 403 }
      )
    }

    // Validate password for super admin
    if (password !== 'gacorkang') {
      return NextResponse.json(
        { error: 'Password salah' },
        { status: 401 }
      )
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
    console.error('Admin login error:', error)
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
