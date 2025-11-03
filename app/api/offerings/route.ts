import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema
const offeringSchema = z.object({
  subjectId: z.string().min(1, 'Mata kuliah wajib dipilih'),
  angkatan: z.number().min(2000).max(2050),
  kelas: z.string().min(1, 'Kelas wajib diisi'),
  semester: z.number().min(1).max(8),
  term: z.string().optional(),
  capacity: z.number().min(1).max(200).optional(),
  status: z.enum(['buka', 'tutup']).default('buka'),
  slotDay: z.number().min(0).max(6).optional(),
  slotStartUTC: z.number().optional(),
  slotEndUTC: z.number().optional(),
})

// GET - Fetch all offerings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId')
    const angkatan = searchParams.get('angkatan')
    const kelas = searchParams.get('kelas')
    const status = searchParams.get('status')

    const where: any = {}
    
    if (subjectId) {
      where.subjectId = subjectId
    }
    
    if (angkatan) {
      where.angkatan = parseInt(angkatan)
    }
    
    if (kelas) {
      where.kelas = kelas
    }
    
    if (status) {
      where.status = status
    }

    const offerings = await prisma.courseOffering.findMany({
      where,
      include: {
        matakuliah: {
          select: {
            id: true,
            kode: true,
            nama: true,
            sks: true,
            semester: true,
            color: true,
          },
        },
        _count: {
          select: {
            krs: true,
          },
        },
      },
      orderBy: [
        { angkatan: 'desc' },
        { semester: 'asc' },
        { kelas: 'asc' },
      ],
    })

    return NextResponse.json(offerings)
  } catch (error) {
    console.error('Error fetching offerings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch offerings' },
      { status: 500 }
    )
  }
}

// POST - Create new offering
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = offeringSchema.parse(body)

    // Verify subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: data.subjectId },
    })

    if (!subject) {
      return NextResponse.json(
        { error: 'Mata kuliah tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check for duplicate offering (same subject, angkatan, kelas)
    const existingOffering = await prisma.courseOffering.findFirst({
      where: {
        subjectId: data.subjectId,
        angkatan: data.angkatan,
        kelas: data.kelas,
      },
    })

    if (existingOffering) {
      return NextResponse.json(
        { error: 'Penawaran untuk mata kuliah, angkatan, dan kelas ini sudah ada' },
        { status: 400 }
      )
    }

    const offering = await prisma.courseOffering.create({
      data: {
        subjectId: data.subjectId,
        angkatan: data.angkatan,
        kelas: data.kelas,
        semester: data.semester,
        term: data.term,
        capacity: data.capacity,
        status: data.status,
        slotDay: data.slotDay,
        slotStartUTC: data.slotStartUTC,
        slotEndUTC: data.slotEndUTC,
      },
      include: {
        matakuliah: {
          select: {
            id: true,
            kode: true,
            nama: true,
            sks: true,
            semester: true,
            color: true,
          },
        },
      },
    })

    return NextResponse.json(offering, { status: 201 })
  } catch (error) {
    console.error('Error creating offering:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create offering' },
      { status: 500 }
    )
  }
}

// PUT - Update offering
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Offering ID is required' },
        { status: 400 }
      )
    }

    const data = offeringSchema.partial().parse(updateData)

    const offering = await prisma.courseOffering.update({
      where: { id },
      data,
      include: {
        matakuliah: {
          select: {
            id: true,
            kode: true,
            nama: true,
            sks: true,
            semester: true,
            color: true,
          },
        },
      },
    })

    return NextResponse.json(offering)
  } catch (error) {
    console.error('Error updating offering:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update offering' },
      { status: 500 }
    )
  }
}

// DELETE - Delete offering
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Offering ID is required' },
        { status: 400 }
      )
    }

    // Check if offering has enrolled students
    const offering = await prisma.courseOffering.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            krs: true,
          },
        },
      },
    })

    if (!offering) {
      return NextResponse.json(
        { error: 'Offering not found' },
        { status: 404 }
      )
    }

    if (offering._count.krs > 0) {
      return NextResponse.json(
        { error: 'Tidak dapat menghapus penawaran yang sudah diambil mahasiswa' },
        { status: 400 }
      )
    }

    await prisma.courseOffering.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: 'Offering deleted successfully' })
  } catch (error) {
    console.error('Error deleting offering:', error)
    return NextResponse.json(
      { error: 'Failed to delete offering' },
      { status: 500 }
    )
  }
}
