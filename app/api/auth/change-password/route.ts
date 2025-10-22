import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const changePasswordSchema = z.object({
  email: z.string().email(),
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = changePasswordSchema.parse(body)

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    // Verify current password
    if (user.password !== data.currentPassword) {
      return NextResponse.json(
        { error: 'Password saat ini tidak sesuai' },
        { status: 400 }
      )
    }

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: data.newPassword },
    })

    return NextResponse.json({ 
      message: 'Password berhasil diubah' 
    })
  } catch (error) {
    console.error('Change password error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengubah password' },
      { status: 500 }
    )
  }
}
