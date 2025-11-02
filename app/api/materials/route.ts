import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema
const materialSchema = z.object({
  subjectId: z.string().min(1, 'Mata kuliah wajib dipilih'),
  title: z.string().min(1, 'Judul materi wajib diisi'),
  content: z.string().optional(),
})

// GET - Fetch materials
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId')
    const id = searchParams.get('id')

    if (id) {
      // Fetch single material with details
      const material = await prisma.material.findUnique({
        where: { id },
        include: {
          subject: {
            select: {
              id: true,
              kode: true,
              nama: true,
              sks: true,
            },
          },
          lampiran: true,
        },
      })

      if (!material) {
        return NextResponse.json(
          { error: 'Material not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(material)
    }

    // Fetch materials list
    const where: any = {}
    if (subjectId) {
      where.subjectId = subjectId
    }

    const materials = await prisma.material.findMany({
      where,
      include: {
        subject: {
          select: {
            id: true,
            kode: true,
            nama: true,
            sks: true,
            color: true,
          },
        },
        _count: {
          select: {
            lampiran: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(materials)
  } catch (error) {
    console.error('Error fetching materials:', error)
    return NextResponse.json(
      { error: 'Failed to fetch materials' },
      { status: 500 }
    )
  }
}

// POST - Create new material
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = materialSchema.parse(body)

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

    const material = await prisma.material.create({
      data: {
        subjectId: data.subjectId,
        title: data.title,
        content: data.content,
      },
      include: {
        subject: {
          select: {
            id: true,
            kode: true,
            nama: true,
            sks: true,
            color: true,
          },
        },
      },
    })

    return NextResponse.json(material, { status: 201 })
  } catch (error) {
    console.error('Error creating material:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create material' },
      { status: 500 }
    )
  }
}

// PUT - Update material
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Material ID is required' },
        { status: 400 }
      )
    }

    const data = materialSchema.partial().parse(updateData)

    const material = await prisma.material.update({
      where: { id },
      data: {
        ...data,
      },
      include: {
        subject: {
          select: {
            id: true,
            kode: true,
            nama: true,
            sks: true,
            color: true,
          },
        },
      },
    })

    return NextResponse.json(material)
  } catch (error) {
    console.error('Error updating material:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update material' },
      { status: 500 }
    )
  }
}

// DELETE - Delete material
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Material ID is required' },
        { status: 400 }
      )
    }

    // Check if material exists
    const material = await prisma.material.findUnique({
      where: { id },
    })

    if (!material) {
      return NextResponse.json(
        { error: 'Material not found' },
        { status: 404 }
      )
    }

    await prisma.material.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: 'Material deleted successfully' })
  } catch (error) {
    console.error('Error deleting material:', error)
    return NextResponse.json(
      { error: 'Failed to delete material' },
      { status: 500 }
    )
  }
}
