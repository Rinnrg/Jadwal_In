import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Mark as dynamic route
export const dynamic = 'force-dynamic'

// GET /api/activities - Get user activities
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const limit = parseInt(searchParams.get("limit") || "10")
    const category = searchParams.get("category")

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

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
    const body = await request.json()
    const { userId, title, description, category, action, icon, color, metadata } = body

    if (!userId || !title || !category || !action) {
      return NextResponse.json(
        { error: "Missing required fields: userId, title, category, action" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const activity = await prisma.activityLog.create({
      data: {
        userId: userId,
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
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
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
