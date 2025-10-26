import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subjectIds } = body

    if (!subjectIds || !Array.isArray(subjectIds) || subjectIds.length === 0) {
      return NextResponse.json(
        { error: 'Subject IDs are required' },
        { status: 400 }
      )
    }

    // Use transaction to ensure all deletions happen atomically
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get all offerings for these subjects
      const offerings = await tx.courseOffering.findMany({
        where: {
          subjectId: {
            in: subjectIds
          }
        },
        select: {
          id: true
        }
      })

      const offeringIds = offerings.map(o => o.id)

      // 2. Delete all KRS items that reference these offerings
      const deletedKrsItems = await tx.krsItem.deleteMany({
        where: {
          offeringId: {
            in: offeringIds
          }
        }
      })

      // 3. Delete all offerings for these subjects
      const deletedOfferings = await tx.courseOffering.deleteMany({
        where: {
          subjectId: {
            in: subjectIds
          }
        }
      })

      // 4. Delete the subjects themselves
      const deletedSubjects = await tx.subject.deleteMany({
        where: {
          id: {
            in: subjectIds
          }
        }
      })

      return {
        deletedSubjects: deletedSubjects.count,
        deletedOfferings: deletedOfferings.count,
        deletedKrsItems: deletedKrsItems.count
      }
    })

    return NextResponse.json({
      success: true,
      ...result,
      message: `Successfully deleted ${result.deletedSubjects} subjects, ${result.deletedOfferings} offerings, and ${result.deletedKrsItems} KRS items`
    })
  } catch (error) {
    console.error('Error force deleting subjects:', error)
    return NextResponse.json(
      { error: 'Failed to force delete subjects' },
      { status: 500 }
    )
  }
}
