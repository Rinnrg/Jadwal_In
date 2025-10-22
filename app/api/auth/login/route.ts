import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Mark as dynamic route
export const dynamic = 'force-dynamic'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
      },
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
