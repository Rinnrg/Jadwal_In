import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema
const krsItemSchema = z.object({
  userId: z.string().min(1),
  subjectId: z.string().min(1),
  offeringId: z.string().optional(),
  term: z.string().min(1),
})

// GET - Fetch KRS items
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const term = searchParams.get('term')
    const subjectId = searchParams.get('subjectId')

    console.log('[KRS API] GET request:', { userId, term, subjectId })

    const where: any = {}
    
    if (userId) {
      where.userId = userId
    }
    
    if (term) {
      where.term = term
    }
    
    if (subjectId) {
      where.subjectId = subjectId
    }

    const krsItems = await prisma.krsItem.findMany({
      where,
      include: {
        subject: {
          select: {
            id: true,
            kode: true,
            nama: true,
            sks: true,
            semester: true,
            color: true,
            status: true,
          },
        },
        offering: {
          select: {
            id: true,
            angkatan: true,
            kelas: true,
            semester: true,
            term: true,
            capacity: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    console.log('[KRS API] Found', krsItems.length, 'items')

    // Transform to match expected format
    const transformedItems = krsItems.map(item => ({
      id: item.id,
      userId: item.userId,
      subjectId: item.subjectId,
      offeringId: item.offeringId,
      term: item.term,
      createdAt: new Date(item.createdAt).getTime(),
      subject: item.subject,
      offering: item.offering,
    }))

    return NextResponse.json(transformedItems)
  } catch (error) {
    console.error('[KRS API] Error fetching KRS items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch KRS items' },
      { status: 500 }
    )
  }
}

// POST - Create new KRS item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('[KRS API] POST request received:', body)
    
    // Validate data
    let data
    try {
      data = krsItemSchema.parse(body)
      console.log('[KRS API] Validation passed:', data)
    } catch (validationError) {
      console.error('[KRS API] Validation failed:', validationError)
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Data tidak valid', details: validationError.errors },
          { status: 400 }
        )
      }
      throw validationError
    }

    // Check if item already exists
    const existing = await prisma.krsItem.findUnique({
      where: {
        userId_subjectId_term: {
          userId: data.userId,
          subjectId: data.subjectId,
          term: data.term,
        },
      },
    })

    if (existing) {
      console.log('[KRS API] Duplicate found:', existing.id)
      return NextResponse.json(
        { error: 'Mata kuliah sudah ada di KRS' },
        { status: 400 }
      )
    }

    // Verify subject exists and is active
    const subject = await prisma.subject.findUnique({
      where: { id: data.subjectId },
    })

    if (!subject) {
      console.log('[KRS API] Subject not found:', data.subjectId)
      return NextResponse.json(
        { error: 'Mata kuliah tidak ditemukan' },
        { status: 404 }
      )
    }

    console.log('[KRS API] Subject found:', { id: subject.id, nama: subject.nama, status: subject.status })

    if (subject.status !== 'aktif') {
      console.log('[KRS API] Subject not active:', subject.status)
      return NextResponse.json(
        { error: `Mata kuliah "${subject.nama}" tidak aktif (status: ${subject.status})` },
        { status: 400 }
      )
    }

    // If offering is specified, verify it exists and is open
    if (data.offeringId) {
      const offering = await prisma.courseOffering.findUnique({
        where: { id: data.offeringId },
      })

      if (!offering) {
        console.log('[KRS API] Offering not found:', data.offeringId)
        return NextResponse.json(
          { error: 'Penawaran tidak ditemukan' },
          { status: 404 }
        )
      }

      console.log('[KRS API] Offering found:', { id: offering.id, status: offering.status, capacity: offering.capacity })

      if (offering.status !== 'buka') {
        console.log('[KRS API] Offering not open:', offering.status)
        return NextResponse.json(
          { error: `Penawaran sudah ditutup (status: ${offering.status})` },
          { status: 400 }
        )
      }

      // Check capacity
      if (offering.capacity) {
        const enrollmentCount = await prisma.krsItem.count({
          where: { offeringId: data.offeringId },
        })

        console.log('[KRS API] Capacity check:', { enrollmentCount, capacity: offering.capacity })

        if (enrollmentCount >= offering.capacity) {
          return NextResponse.json(
            { error: 'Kelas sudah penuh' },
            { status: 400 }
          )
        }
      }
    }

    console.log('[KRS API] All validations passed, creating KRS item...')

    // Create KRS item
    const krsItem = await prisma.krsItem.create({
      data: {
        userId: data.userId,
        subjectId: data.subjectId,
        offeringId: data.offeringId,
        term: data.term,
      },
      include: {
        subject: {
          select: {
            id: true,
            kode: true,
            nama: true,
            sks: true,
            semester: true,
            color: true,
            status: true,
          },
        },
        offering: {
          select: {
            id: true,
            angkatan: true,
            kelas: true,
            semester: true,
            term: true,
            capacity: true,
            status: true,
          },
        },
      },
    })

    console.log('[KRS API] Created KRS item:', krsItem.id)

    // Also create a grade entry (initially empty)
    await prisma.grade.upsert({
      where: {
        userId_subjectId_term: {
          userId: data.userId,
          subjectId: data.subjectId,
          term: data.term,
        },
      },
      update: {},
      create: {
        userId: data.userId,
        subjectId: data.subjectId,
        offeringId: data.offeringId,
        term: data.term,
      },
    })

    console.log('[KRS API] Grade entry created/updated')

    return NextResponse.json({
      ...krsItem,
      createdAt: new Date(krsItem.createdAt).getTime(),
    }, { status: 201 })
  } catch (error) {
    console.error('[KRS API] Error creating KRS item:', error)
    console.error('[KRS API] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create KRS item' },
      { status: 500 }
    )
  }
}

// DELETE - Delete KRS item
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'KRS item ID is required' },
        { status: 400 }
      )
    }

    // Get the KRS item to check for grades
    const krsItem = await prisma.krsItem.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            grades: {
              where: {
                subjectId: undefined, // Will be set dynamically
                term: undefined,
              },
            },
          },
        },
      },
    })

    if (!krsItem) {
      return NextResponse.json(
        { error: 'KRS item not found' },
        { status: 404 }
      )
    }

    // Check if there's a grade for this subject
    const grade = await prisma.grade.findUnique({
      where: {
        userId_subjectId_term: {
          userId: krsItem.userId,
          subjectId: krsItem.subjectId,
          term: krsItem.term,
        },
      },
    })

    // Delete the KRS item
    await prisma.krsItem.delete({
      where: { id },
    })

    // Only delete grade if it's empty (no value)
    if (grade && !grade.nilaiAngka && !grade.nilaiHuruf) {
      await prisma.grade.delete({
        where: { id: grade.id },
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'KRS item deleted successfully' 
    })
  } catch (error) {
    console.error('[KRS API] Error deleting KRS item:', error)
    return NextResponse.json(
      { error: 'Failed to delete KRS item' },
      { status: 500 }
    )
  }
}
