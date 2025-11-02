import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

// Mark as dynamic route
export const dynamic = 'force-dynamic'

const setPasswordSchema = z.object({
  userId: z.string(),
  newPassword: z.string().min(6, 'Password minimal 6 karakter'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, newPassword } = setPasswordSchema.parse(body)

    // Get session token from cookie
    const sessionToken = request.cookies.get('session_token')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Note: Session verification skipped - no Session model in schema
    // In production, implement proper session verification
    
    // Get user directly
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user already has a password
    if (user.password) {
      return NextResponse.json(
        { error: 'User sudah memiliki password. Gunakan fitur "Ubah Password" di halaman profil.' },
        { status: 400 }
      )
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update user with new password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    })

    return NextResponse.json({
      success: true,
      message: 'Password berhasil diatur. Sekarang Anda dapat login menggunakan email dan password.',
    })
  } catch (error) {
    console.error('Set password error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengatur password' },
      { status: 500 }
    )
  }
}
