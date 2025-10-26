import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export async function POST(request: NextRequest) {
  try {
    console.log('[Upload API] Starting file upload processing...')
    
    const formData = await request.formData()
    const file = formData.get("file") as File
    const type = formData.get("type") as string

    console.log('[Upload API] Form data received:', { 
      hasFile: !!file, 
      type,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type
    })

    if (!file) {
      console.error('[Upload API] No file in form data')
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    console.log(`[Upload API] Uploading ${type} file: ${file.name} (${file.size} bytes)`)

    // Validate file type
    if (type === "image") {
      if (!file.type.startsWith("image/")) {
        console.error('[Upload API] Invalid image type:', file.type)
        return NextResponse.json({ error: "File must be an image" }, { status: 400 })
      }
      // Max 5MB for images
      if (file.size > 5 * 1024 * 1024) {
        console.error('[Upload API] Image too large:', file.size)
        return NextResponse.json({ error: "Image size must be less than 5MB" }, { status: 400 })
      }
    } else if (type === "pdf") {
      if (file.type !== "application/pdf") {
        console.error('[Upload API] Invalid PDF type:', file.type)
        return NextResponse.json({ error: "File must be a PDF" }, { status: 400 })
      }
      // Max 10MB for PDFs
      if (file.size > 10 * 1024 * 1024) {
        console.error('[Upload API] PDF too large:', file.size)
        return NextResponse.json({ error: "PDF size must be less than 10MB" }, { status: 400 })
      }
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", type === "image" ? "images" : "pdfs")
    
    console.log('[Upload API] Target directory:', uploadsDir)
    
    try {
      if (!existsSync(uploadsDir)) {
        console.log(`[Upload API] Creating directory: ${uploadsDir}`)
        await mkdir(uploadsDir, { recursive: true })
        console.log('[Upload API] Directory created successfully')
      } else {
        console.log('[Upload API] Directory already exists')
      }
    } catch (mkdirError) {
      console.error("[Upload API] Error creating directory:", mkdirError)
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

    console.log(`[Upload API] Generated filename: ${filename}`)
    console.log(`[Upload API] Full filepath: ${filepath}`)

    // Convert file to buffer and write to disk
    try {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      console.log(`[Upload API] File converted to buffer: ${buffer.length} bytes`)
      
      // Ensure directory exists before writing
      await mkdir(uploadsDir, { recursive: true })
      
      console.log(`[Upload API] Writing file to disk...`)
      await writeFile(filepath, buffer, { mode: 0o666 })
      console.log(`[Upload API] File saved successfully: ${filename}`)
      
      // Verify file was written
      if (existsSync(filepath)) {
        console.log(`[Upload API] File verified on disk: ${filepath}`)
      } else {
        console.error(`[Upload API] File not found after write: ${filepath}`)
      }
    } catch (writeError) {
      console.error("[Upload API] Error writing file:", writeError)
      console.error("[Upload API] Filepath:", filepath)
      console.error("[Upload API] Directory exists:", existsSync(uploadsDir))
      return NextResponse.json({ 
        error: "Failed to write file to disk",
        details: writeError instanceof Error ? writeError.message : "Unknown error",
        path: filepath
      }, { status: 500 })
    }

    // Return the URL
    const url = `/uploads/${type === "image" ? "images" : "pdfs"}/${filename}`

    console.log('[Upload API] Upload successful, returning URL:', url)

    return NextResponse.json({ url, filename }, { status: 200 })
  } catch (error) {
    console.error("[Upload API] Unexpected error:", error)
    return NextResponse.json({ 
      error: "Upload failed", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}
