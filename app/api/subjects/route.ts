import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema
const subjectSchema = z.object({
  kode: z.string().min(1, 'Kode mata kuliah wajib diisi'),
  nama: z.string().min(1, 'Nama mata kuliah wajib diisi'),
  sks: z.number().min(1).max(6),
  semester: z.number().min(1).max(8),
  prodi: z.string().optional(),
  status: z.enum(['aktif', 'arsip']).default('aktif'),
  angkatan: z.number().min(2000).max(2050),
  kelas: z.string().min(1),
  color: z.string().default('#3B82F6'),
  pengampuIds: z.array(z.string()).optional(),
  slotDay: z.number().min(0).max(6).optional(),
  slotStartUTC: z.number().optional(),
  slotEndUTC: z.number().optional(),
  slotRuang: z.string().optional(),
})

// GET - Fetch all subjects
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const angkatan = searchParams.get('angkatan')
    const kelas = searchParams.get('kelas')

    const where: any = {}
    
    if (status) {
      where.status = status
    }
    
    if (angkatan) {
      where.angkatan = parseInt(angkatan)
    }
    
    if (kelas) {
      where.kelas = kelas
    }

    const subjects = await prisma.subject.findMany({
      where,
      include: {
        pengampus: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        offerings: {
          select: {
            id: true,
            angkatan: true,
            kelas: true,
            status: true,
          },
        },
        _count: {
          select: {
            krsItems: true,
            scheduleEvents: true,
          },
        },
      },
      orderBy: [
        { semester: 'asc' },
        { kode: 'asc' },
      ],
    })

    // Transform to include pengampuIds array
    const subjectsWithIds = subjects.map((subject) => ({
      ...subject,
      pengampuIds: subject.pengampus.map(p => p.id),
    }))

    return NextResponse.json(subjectsWithIds)
  } catch (error) {
    console.error('Error fetching subjects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subjects' },
      { status: 500 }
    )
  }
}

// POST - Create new subject
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = subjectSchema.parse(body)

    // Check if kode already exists
    const existingSubject = await prisma.subject.findUnique({
      where: { kode: data.kode },
    })

    if (existingSubject) {
      return NextResponse.json(
        { error: 'Kode mata kuliah sudah digunakan' },
        { status: 400 }
      )
    }

    const subject = await prisma.subject.create({
      data: {
        kode: data.kode,
        nama: data.nama,
        sks: data.sks,
        semester: data.semester,
        prodi: data.prodi,
        status: data.status,
        angkatan: data.angkatan,
        kelas: data.kelas,
        color: data.color,
        slotDay: data.slotDay,
        slotStartUTC: data.slotStartUTC,
        slotEndUTC: data.slotEndUTC,
        slotRuang: data.slotRuang,
        pengampus: data.pengampuIds && data.pengampuIds.length > 0 ? {
          connect: data.pengampuIds.map(id => ({ id }))
        } : undefined,
      },
      include: {
        pengampus: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Auto-create course offering for this subject
    try {
      const currentYear = new Date().getFullYear()
      const currentMonth = new Date().getMonth()
      const isOddSemester = currentMonth >= 8 || currentMonth <= 1
      const currentTerm = `${currentYear}/${currentYear + 1}-${isOddSemester ? "Ganjil" : "Genap"}`

      await prisma.courseOffering.create({
        data: {
          subjectId: subject.id,
          semester: data.semester,
          status: 'tutup', // Default tutup, kaprodi bisa buka lewat switch
          angkatan: data.angkatan,
          kelas: data.kelas,
          term: currentTerm,
          capacity: 40, // Default capacity
        },
      })
    } catch (offeringError) {
      console.error('Error creating course offering:', offeringError)
      // Don't fail the whole operation if offering creation fails
    }

    // Transform to include pengampuIds array
    const subjectWithIds = {
      ...subject,
      pengampuIds: subject.pengampus.map(p => p.id),
    }

    return NextResponse.json(subjectWithIds, { status: 201 })
  } catch (error) {
    console.error('Error creating subject:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create subject' },
      { status: 500 }
    )
  }
}

// PUT - Update subject
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Subject ID is required' },
        { status: 400 }
      )
    }

    const data = subjectSchema.partial().parse(updateData)

    // If kode is being updated, check for duplicates
    if (data.kode) {
      const existingSubject = await prisma.subject.findFirst({
        where: {
          kode: data.kode,
          NOT: { id },
        },
      })

      if (existingSubject) {
        return NextResponse.json(
          { error: 'Kode mata kuliah sudah digunakan' },
          { status: 400 }
        )
      }
    }

    // Separate pengampuIds from other data
    const { pengampuIds, ...subjectData } = data

    const subject = await prisma.subject.update({
      where: { id },
      data: {
        ...subjectData,
        pengampus: pengampuIds ? {
          set: pengampuIds.map(id => ({ id }))
        } : undefined,
      },
      include: {
        pengampus: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Transform to include pengampuIds array
    const subjectWithIds = {
      ...subject,
      pengampuIds: subject.pengampus.map(p => p.id),
    }

    return NextResponse.json(subjectWithIds)
  } catch (error) {
    console.error('Error updating subject:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    // Return more detailed error message
    const errorMessage = error instanceof Error ? error.message : 'Failed to update subject'
    
    return NextResponse.json(
      { error: errorMessage, details: error },
      { status: 500 }
    )
  }
}

// DELETE - Delete subject
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Subject ID is required' },
        { status: 400 }
      )
    }

    // Check if subject has related data
    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            krsItems: true,
            offerings: true,
            scheduleEvents: true,
          },
        },
      },
    })

    if (!subject) {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      )
    }

    // Prevent deletion if subject has dependencies
    if (subject._count.krsItems > 0) {
      return NextResponse.json(
        { error: 'Tidak dapat menghapus mata kuliah yang sudah diambil mahasiswa' },
        { status: 400 }
      )
    }

    await prisma.subject.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: 'Subject deleted successfully' })
  } catch (error) {
    console.error('Error deleting subject:', error)
    return NextResponse.json(
      { error: 'Failed to delete subject' },
      { status: 500 }
    )
  }
}
