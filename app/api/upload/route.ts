import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const type = formData.get("type") as string

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    // Validate file type
    if (type === "image") {
      if (!file.type.startsWith("image/")) {
        return NextResponse.json({ error: "File must be an image" }, { status: 400 })
      }
      // Max 5MB for images
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "Image size must be less than 5MB" }, { status: 400 })
      }
    } else if (type === "pdf") {
      if (file.type !== "application/pdf") {
        return NextResponse.json({ error: "File must be a PDF" }, { status: 400 })
      }
      // Max 10MB for PDFs
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: "PDF size must be less than 10MB" }, { status: 400 })
      }
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", type === "image" ? "images" : "pdfs")
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const filename = `${timestamp}-${originalName}`
    const filepath = join(uploadsDir, filename)

    // Convert file to buffer and write to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Return the URL
    const url = `/uploads/${type === "image" ? "images" : "pdfs"}/${filename}`

    return NextResponse.json({ url }, { status: 200 })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
