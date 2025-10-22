import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { PrismaClient } from "@/generated/prisma"

const prisma = new PrismaClient()

// GET /api/activities - Get user activities
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "10")
    const category = searchParams.get("category")

    const activities = await prisma.activityLog.findMany({
      where: {
        userId: user.id,
        ...(category ? { category } : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    })

    return NextResponse.json(activities)
  } catch (error) {
    console.error("Error fetching activities:", error)
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    )
  }
}

// POST /api/activities - Create activity log
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await request.json()
    const { title, description, category, action, icon, color, metadata } = body

    if (!title || !category || !action) {
      return NextResponse.json(
        { error: "Missing required fields: title, category, action" },
        { status: 400 }
      )
    }

    const activity = await prisma.activityLog.create({
      data: {
        userId: user.id,
        title,
        description,
        category,
        action,
        icon: icon || "Star",
        color: color || "text-gray-500",
        metadata: metadata || null,
      },
    })

    return NextResponse.json(activity, { status: 201 })
  } catch (error) {
    console.error("Error creating activity:", error)
    return NextResponse.json(
      { error: "Failed to create activity" },
      { status: 500 }
    )
  }
}

// DELETE /api/activities - Delete old activities (cleanup)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Delete activities older than 90 days
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const result = await prisma.activityLog.deleteMany({
      where: {
        userId: user.id,
        createdAt: {
          lt: ninetyDaysAgo,
        },
      },
    })

    return NextResponse.json({ 
      message: "Old activities deleted", 
      count: result.count 
    })
  } catch (error) {
    console.error("Error deleting activities:", error)
    return NextResponse.json(
      { error: "Failed to delete activities" },
      { status: 500 }
    )
  }
}
