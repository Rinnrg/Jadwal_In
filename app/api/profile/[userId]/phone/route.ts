import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'
import { z } from 'zod'

// Mark as dynamic route
export const dynamic = 'force-dynamic'

// Schema untuk phone
const phoneSchema = z.object({
  phoneNumber: z.string().min(10, "Nomor telepon minimal 10 digit"),
  isPrimary: z.boolean().optional(),
})

// GET - Get all phones for user
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params

    const phones = await prisma.phone.findMany({
      where: { userId },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'asc' }
      ]
    })

    return NextResponse.json({ phones })
  } catch (error) {
    console.error('Get phones error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data nomor telepon' },
      { status: 500 }
    )
  }
}

// POST - Add new phone number
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params
    const body = await request.json()
    const data = phoneSchema.parse(body)

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    // If this is set as primary, unset other primary phones
    if (data.isPrimary) {
      await prisma.phone.updateMany({
        where: { 
          userId,
          isPrimary: true 
        },
        data: { isPrimary: false }
      })
    }

    // Create new phone
    const phone = await prisma.phone.create({
      data: {
        userId,
        phoneNumber: data.phoneNumber,
        isPrimary: data.isPrimary || false,
      }
    })

    return NextResponse.json({ 
      phone,
      message: 'Nomor telepon berhasil ditambahkan'
    })
  } catch (error) {
    console.error('Add phone error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat menambahkan nomor telepon' },
      { status: 500 }
    )
  }
}

// PATCH - Update phone number
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params
    const body = await request.json()
    const { phoneId, ...data } = body
    
    if (!phoneId) {
      return NextResponse.json(
        { error: 'Phone ID tidak ditemukan' },
        { status: 400 }
      )
    }

    const updates = phoneSchema.partial().parse(data)

    // Check if phone exists and belongs to user
    const existingPhone = await prisma.phone.findFirst({
      where: { 
        id: phoneId,
        userId 
      }
    })

    if (!existingPhone) {
      return NextResponse.json(
        { error: 'Nomor telepon tidak ditemukan' },
        { status: 404 }
      )
    }

    // If setting as primary, unset other primary phones
    if (updates.isPrimary) {
      await prisma.phone.updateMany({
        where: { 
          userId,
          isPrimary: true,
          id: { not: phoneId }
        },
        data: { isPrimary: false }
      })
    }

    // Update phone
    const phone = await prisma.phone.update({
      where: { id: phoneId },
      data: updates
    })

    return NextResponse.json({ 
      phone,
      message: 'Nomor telepon berhasil diperbarui'
    })
  } catch (error) {
    console.error('Update phone error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengupdate nomor telepon' },
      { status: 500 }
    )
  }
}

// DELETE - Delete phone number
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params
    const { searchParams } = new URL(request.url)
    const phoneId = searchParams.get('phoneId')

    if (!phoneId) {
      return NextResponse.json(
        { error: 'Phone ID tidak ditemukan' },
        { status: 400 }
      )
    }

    // Check if phone exists and belongs to user
    const existingPhone = await prisma.phone.findFirst({
      where: { 
        id: phoneId,
        userId 
      }
    })

    if (!existingPhone) {
      return NextResponse.json(
        { error: 'Nomor telepon tidak ditemukan' },
        { status: 404 }
      )
    }

    // Delete phone
    await prisma.phone.delete({
      where: { id: phoneId }
    })

    return NextResponse.json({ 
      message: 'Nomor telepon berhasil dihapus'
    })
  } catch (error) {
    console.error('Delete phone error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat menghapus nomor telepon' },
      { status: 500 }
    )
  }
}
