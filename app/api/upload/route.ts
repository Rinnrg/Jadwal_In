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

    console.log(`[Upload] Uploading ${type} file: ${file.name} (${file.size} bytes)`)

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
    
    try {
      if (!existsSync(uploadsDir)) {
        console.log(`[Upload] Creating directory: ${uploadsDir}`)
        await mkdir(uploadsDir, { recursive: true })
      }
    } catch (mkdirError) {
      console.error("[Upload] Error creating directory:", mkdirError)
      return NextResponse.json({ 
        error: "Failed to create upload directory",
        details: mkdirError instanceof Error ? mkdirError.message : "Unknown error"
      }, { status: 500 })
    }

    // Generate unique filename - sanitize more aggressively
    const timestamp = Date.now()
    const ext = file.name.split('.').pop() || 'file'
    const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, "_")
    const filename = `${timestamp}-${baseName}.${ext}`
    const filepath = join(uploadsDir, filename)

    console.log(`[Upload] Saving file to: ${filepath}`)

    // Convert file to buffer and write to disk
    try {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      // Ensure directory exists before writing
      await mkdir(uploadsDir, { recursive: true })
      
      await writeFile(filepath, buffer, { mode: 0o666 })
      console.log(`[Upload] File saved successfully: ${filename}`)
    } catch (writeError) {
      console.error("[Upload] Error writing file:", writeError)
      console.error("[Upload] Filepath:", filepath)
      console.error("[Upload] Directory exists:", existsSync(uploadsDir))
      return NextResponse.json({ 
        error: "Failed to write file to disk",
        details: writeError instanceof Error ? writeError.message : "Unknown error",
        path: filepath
      }, { status: 500 })
    }

    // Return the URL
    const url = `/uploads/${type === "image" ? "images" : "pdfs"}/${filename}`

    return NextResponse.json({ url, filename }, { status: 200 })
  } catch (error) {
    console.error("[Upload] Unexpected error:", error)
    return NextResponse.json({ 
      error: "Upload failed", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}
