import { NextRequest, NextResponse } from "next/server"

/**
 * Upload API - Base64 Strategy for Vercel
 * Since Vercel's file system is read-only, we convert files to base64 data URLs
 * This works for both development and production environments
 */
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

    console.log(`[Upload API] Processing ${type} file: ${file.name} (${file.size} bytes)`)

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

    // Convert file to base64 data URL
    try {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const base64 = buffer.toString('base64')
      const dataUrl = `data:${file.type};base64,${base64}`
      
      console.log(`[Upload API] File converted to base64: ${base64.length} characters`)
      console.log(`[Upload API] Data URL length: ${dataUrl.length} characters`)

      // Generate filename for reference
      const timestamp = Date.now()
      const ext = file.name.split('.').pop() || 'file'
      const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, "_")
      const filename = `${timestamp}-${baseName}.${ext}`

      console.log('[Upload API] Upload successful, returning base64 data URL')

      return NextResponse.json({ 
        url: dataUrl,
        filename,
        type: file.type,
        size: file.size
      }, { status: 200 })
    } catch (conversionError) {
      console.error("[Upload API] Error converting file to base64:", conversionError)
      return NextResponse.json({ 
        error: "Failed to process file",
        details: conversionError instanceof Error ? conversionError.message : "Unknown error"
      }, { status: 500 })
    }
  } catch (error) {
    console.error("[Upload API] Unexpected error:", error)
    return NextResponse.json({ 
      error: "Upload failed", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}
