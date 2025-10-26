import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const announcementSchema = z.object({
  title: z.string().min(1, "Judul harus diisi"),
  description: z.string().min(1, "Keterangan harus diisi"),
  imageUrl: z.string().optional().nullable(),
  fileUrl: z.string().optional().nullable(),
  targetRoles: z.array(z.enum(["mahasiswa", "dosen", "kaprodi"])).min(1, "Pilih minimal satu target"),
  isActive: z.boolean().default(true),
  createdById: z.string(),
})

// GET - Fetch all announcements or active ones for specific role
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role")
    const activeOnly = searchParams.get("activeOnly") === "true"

    let announcements

    if (role && activeOnly) {
      // Fetch active announcements for specific role
      announcements = await prisma.announcement.findMany({
        where: {
          isActive: true,
          targetRoles: {
            has: role,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      })
    } else {
      // Fetch all announcements (for admin panel)
      announcements = await prisma.announcement.findMany({
        orderBy: {
          createdAt: "desc",
        },
      })
    }

    return NextResponse.json(announcements)
  } catch (error) {
    console.error("Error fetching announcements:", error)
    return NextResponse.json(
      { error: "Gagal mengambil data pengumuman" },
      { status: 500 }
    )
  }
}

// POST - Create new announcement
export async function POST(request: NextRequest) {
  try {
    console.log('[Announcement API] POST - Creating new announcement...')
    
    const body = await request.json()
    console.log('[Announcement API] Request body:', JSON.stringify(body, null, 2))
    
    const validatedData = announcementSchema.parse(body)
    console.log('[Announcement API] Validated data:', JSON.stringify(validatedData, null, 2))

    const announcement = await prisma.announcement.create({
      data: validatedData,
    })

    console.log('[Announcement API] Announcement created successfully:', announcement.id)

    return NextResponse.json(announcement, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[Announcement API] Validation error:', error.errors)
      return NextResponse.json(
        { error: "Validasi gagal", details: error.errors },
        { status: 400 }
      )
    }

    console.error("[Announcement API] Error creating announcement:", error)
    return NextResponse.json(
      { error: "Gagal membuat pengumuman" },
      { status: 500 }
    )
  }
}

// PUT - Update announcement
export async function PUT(request: NextRequest) {
  try {
    console.log('[Announcement API] PUT - Updating announcement...')
    
    const body = await request.json()
    const { id, ...data } = body

    console.log('[Announcement API] Update ID:', id)
    console.log('[Announcement API] Update data:', JSON.stringify(data, null, 2))

    if (!id) {
      console.error('[Announcement API] No ID provided')
      return NextResponse.json(
        { error: "ID pengumuman harus disertakan" },
        { status: 400 }
      )
    }

    const validatedData = announcementSchema.partial().parse(data)
    console.log('[Announcement API] Validated data:', JSON.stringify(validatedData, null, 2))

    const announcement = await prisma.announcement.update({
      where: { id },
      data: validatedData,
    })

    console.log('[Announcement API] Announcement updated successfully:', announcement.id)

    return NextResponse.json(announcement)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[Announcement API] Validation error:', error.errors)
      return NextResponse.json(
        { error: "Validasi gagal", details: error.errors },
        { status: 400 }
      )
    }

    console.error("[Announcement API] Error updating announcement:", error)
    return NextResponse.json(
      { error: "Gagal mengupdate pengumuman" },
      { status: 500 }
    )
  }
}

// DELETE - Delete announcement
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "ID pengumuman harus disertakan" },
        { status: 400 }
      )
    }

    await prisma.announcement.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting announcement:", error)
    return NextResponse.json(
      { error: "Gagal menghapus pengumuman" },
      { status: 500 }
    )
  }
}
