import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const submissionSchema = z.object({
  assignmentId: z.string(),
  studentId: z.string(),
  note: z.string().optional().nullable(),
  submittedAt: z.number().optional(),
  status: z.enum(["draft", "submitted", "graded"]).default("draft"),
  grade: z.number().min(0).max(100).optional().nullable(),
  feedback: z.string().optional().nullable(),
  gradedAt: z.number().optional().nullable(),
  gradedBy: z.string().optional().nullable(),
})

// GET - Fetch submissions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get("assignmentId")
    const studentId = searchParams.get("studentId")

    let submissions

    if (assignmentId) {
      submissions = await prisma.submission.findMany({
        where: { assignmentId },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { submittedAt: "desc" },
      })
    } else if (studentId) {
      submissions = await prisma.submission.findMany({
        where: { studentId },
        include: {
          assignment: {
            select: {
              id: true,
              title: true,
              dueUTC: true,
            },
          },
        },
        orderBy: { submittedAt: "desc" },
      })
    } else {
      submissions = await prisma.submission.findMany({
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          assignment: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { submittedAt: "desc" },
      })
    }

    return NextResponse.json(submissions)
  } catch (error) {
    console.error("Error fetching submissions:", error)
    return NextResponse.json(
      { error: "Gagal mengambil data submissions" },
      { status: 500 }
    )
  }
}

// POST - Create submission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = submissionSchema.parse(body)

    // If submittedAt not provided, use current timestamp
    const submissionData = {
      ...validatedData,
      submittedAt: validatedData.submittedAt || BigInt(Date.now()),
    }

    const submission = await prisma.submission.create({
      data: submissionData,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignment: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    return NextResponse.json(submission, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasi gagal", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating submission:", error)
    return NextResponse.json(
      { error: "Gagal membuat submission" },
      { status: 500 }
    )
  }
}

// PUT - Update submission
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json(
        { error: "ID submission harus disertakan" },
        { status: 400 }
      )
    }

    const validatedData = submissionSchema.partial().parse(data)

    const submission = await prisma.submission.update({
      where: { id },
      data: validatedData,
    })

    return NextResponse.json(submission)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasi gagal", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error updating submission:", error)
    return NextResponse.json(
      { error: "Gagal mengupdate submission" },
      { status: 500 }
    )
  }
}

// DELETE - Delete submission
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "ID submission harus disertakan" },
        { status: 400 }
      )
    }

    await prisma.submission.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting submission:", error)
    return NextResponse.json(
      { error: "Gagal menghapus submission" },
      { status: 500 }
    )
  }
}
