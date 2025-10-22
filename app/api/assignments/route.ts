import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema
const assignmentSchema = z.object({
  subjectId: z.string().min(1, 'Mata kuliah wajib dipilih'),
  title: z.string().min(1, 'Judul tugas wajib diisi'),
  description: z.string().optional(),
  dueUTC: z.number().optional(), // BigInt as number
  allowedFileTypes: z.array(z.string()).default(['.pdf', '.doc', '.docx']),
  maxFileSize: z.number().default(10485760), // 10MB
  maxFiles: z.number().min(1).max(10).default(3),
})

// GET - Fetch assignments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId')
    const id = searchParams.get('id')

    if (id) {
      // Fetch single assignment with details
      const assignment = await prisma.assignment.findUnique({
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
          attachments: true,
          submissions: {
            include: {
              student: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              files: true,
            },
          },
          _count: {
            select: {
              submissions: true,
            },
          },
        },
      })

      if (!assignment) {
        return NextResponse.json(
          { error: 'Assignment not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(assignment)
    }

    // Fetch assignments list
    const where: any = {}
    if (subjectId) {
      where.subjectId = subjectId
    }

    const assignments = await prisma.assignment.findMany({
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
            submissions: true,
            attachments: true,
          },
        },
      },
      orderBy: {
        dueUTC: 'desc',
      },
    })

    return NextResponse.json(assignments)
  } catch (error) {
    console.error('Error fetching assignments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    )
  }
}

// POST - Create new assignment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = assignmentSchema.parse(body)

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

    const assignment = await prisma.assignment.create({
      data: {
        subjectId: data.subjectId,
        title: data.title,
        description: data.description,
        dueUTC: data.dueUTC ? BigInt(data.dueUTC) : null,
        allowedFileTypes: data.allowedFileTypes,
        maxFileSize: data.maxFileSize,
        maxFiles: data.maxFiles,
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

    // Convert BigInt to number for JSON
    const assignmentJson = {
      ...assignment,
      dueUTC: assignment.dueUTC ? Number(assignment.dueUTC) : null,
    }

    return NextResponse.json(assignmentJson, { status: 201 })
  } catch (error) {
    console.error('Error creating assignment:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create assignment' },
      { status: 500 }
    )
  }
}

// PUT - Update assignment
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Assignment ID is required' },
        { status: 400 }
      )
    }

    const data = assignmentSchema.partial().parse(updateData)

    const assignment = await prisma.assignment.update({
      where: { id },
      data: {
        ...data,
        dueUTC: data.dueUTC !== undefined ? (data.dueUTC ? BigInt(data.dueUTC) : null) : undefined,
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

    // Convert BigInt to number for JSON
    const assignmentJson = {
      ...assignment,
      dueUTC: assignment.dueUTC ? Number(assignment.dueUTC) : null,
    }

    return NextResponse.json(assignmentJson)
  } catch (error) {
    console.error('Error updating assignment:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update assignment' },
      { status: 500 }
    )
  }
}

// DELETE - Delete assignment
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Assignment ID is required' },
        { status: 400 }
      )
    }

    // Check if assignment has submissions
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    })

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    if (assignment._count.submissions > 0) {
      return NextResponse.json(
        { error: 'Tidak dapat menghapus tugas yang sudah ada pengumpulan' },
        { status: 400 }
      )
    }

    await prisma.assignment.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: 'Assignment deleted successfully' })
  } catch (error) {
    console.error('Error deleting assignment:', error)
    return NextResponse.json(
      { error: 'Failed to delete assignment' },
      { status: 500 }
    )
  }
}
