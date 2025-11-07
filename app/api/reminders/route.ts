import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Mark as dynamic route
export const dynamic = 'force-dynamic'

// Schema untuk reminder
const reminderSchema = z.object({
  title: z.string().min(1, "Judul reminder wajib diisi"),
  dueUTC: z.number(),
  relatedSubjectId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
})

// GET - Get reminders (optionally filtered by userId)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID diperlukan' },
        { status: 400 }
      )
    }

    const reminders = await prisma.reminder.findMany({
      where: { userId },
      orderBy: { dueUTC: 'asc' }
    })

    // Convert BigInt to number for JSON serialization
    const serializedReminders = reminders.map(reminder => ({
      ...reminder,
      dueUTC: Number(reminder.dueUTC)
    }))

    return NextResponse.json(serializedReminders)
  } catch (error) {
    console.error('Get reminders error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data reminder' },
      { status: 500 }
    )
  }
}

// POST - Add new reminder
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, ...reminderData } = body
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID diperlukan' },
        { status: 400 }
      )
    }

    const data = reminderSchema.parse(reminderData)

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

    // Create new reminder
    const reminder = await prisma.reminder.create({
      data: {
        userId,
        title: data.title,
        dueUTC: BigInt(data.dueUTC),
        relatedSubjectId: data.relatedSubjectId || null,
        isActive: data.isActive,
      }
    })

    // Convert BigInt to number for JSON
    const serializedReminder = {
      ...reminder,
      dueUTC: Number(reminder.dueUTC)
    }

    return NextResponse.json({ 
      reminder: serializedReminder,
      message: 'Reminder berhasil ditambahkan'
    })
  } catch (error) {
    console.error('Add reminder error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat menambahkan reminder' },
      { status: 500 }
    )
  }
}

// PATCH - Update reminder
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, userId, ...updates } = body
    
    if (!id) {
      return NextResponse.json(
        { error: 'Reminder ID tidak ditemukan' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID diperlukan' },
        { status: 400 }
      )
    }

    // Validate updates
    const validUpdates = reminderSchema.partial().parse(updates)

    // Check if reminder exists and belongs to user
    const existingReminder = await prisma.reminder.findFirst({
      where: { 
        id,
        userId 
      }
    })

    if (!existingReminder) {
      return NextResponse.json(
        { error: 'Reminder tidak ditemukan' },
        { status: 404 }
      )
    }

    // Convert dueUTC to BigInt if present
    const updateData: any = { ...validUpdates }
    if (updateData.dueUTC !== undefined) {
      updateData.dueUTC = BigInt(updateData.dueUTC)
    }

    // Update reminder
    const reminder = await prisma.reminder.update({
      where: { id },
      data: updateData
    })

    // Convert BigInt to number for JSON
    const serializedReminder = {
      ...reminder,
      dueUTC: Number(reminder.dueUTC)
    }

    return NextResponse.json({ 
      reminder: serializedReminder,
      message: 'Reminder berhasil diperbarui'
    })
  } catch (error) {
    console.error('Update reminder error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengupdate reminder' },
      { status: 500 }
    )
  }
}

// DELETE - Delete reminder
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const userId = searchParams.get('userId')

    if (!id) {
      return NextResponse.json(
        { error: 'Reminder ID tidak ditemukan' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID diperlukan' },
        { status: 400 }
      )
    }

    // Check if reminder exists and belongs to user
    const existingReminder = await prisma.reminder.findFirst({
      where: { 
        id,
        userId 
      }
    })

    if (!existingReminder) {
      return NextResponse.json(
        { error: 'Reminder tidak ditemukan' },
        { status: 404 }
      )
    }

    // Delete reminder
    await prisma.reminder.delete({
      where: { id }
    })

    return NextResponse.json({ 
      message: 'Reminder berhasil dihapus'
    })
  } catch (error) {
    console.error('Delete reminder error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat menghapus reminder' },
      { status: 500 }
    )
  }
}
