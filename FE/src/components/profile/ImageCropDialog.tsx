"use client"

import React, { useState, useRef, useCallback, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { RotateCw, Crop } from "lucide-react"

interface ImageCropDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageSrc: string
  onCropComplete: (croppedImage: string) => void
}

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export function ImageCropDialog({ open, onOpenChange, imageSrc, onCropComplete }: ImageCropDialogProps) {
  const [scale, setScale] = useState(1)
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null)
  
  const CROP_SIZE = 256 // Size of the crop circle
  const OUTPUT_SIZE = 400 // Output image size
  
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)

  // Load and initialize image
  useEffect(() => {
    if (!imageSrc || !open) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      setImageElement(img)
      
      // Calculate initial scale to fill the crop area
      const minScale = Math.max(
        CROP_SIZE / img.naturalWidth,
        CROP_SIZE / img.naturalHeight
      )
      
      setScale(minScale * 1.2) // Start slightly zoomed in
      setImagePosition({ x: 0, y: 0 })
    }
    
    img.onerror = () => {
      console.error('Failed to load image')
      alert('Gagal memuat gambar. Silakan coba lagi.')
    }
    
    img.src = imageSrc
  }, [imageSrc, open])

  // Draw preview whenever image position or scale changes
  useEffect(() => {
    if (!imageElement || !previewCanvasRef.current) return

    const canvas = previewCanvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = CROP_SIZE
    canvas.height = CROP_SIZE

    // Clear canvas
    ctx.clearRect(0, 0, CROP_SIZE, CROP_SIZE)

    // Calculate image dimensions
    const imgWidth = imageElement.naturalWidth * scale
    const imgHeight = imageElement.naturalHeight * scale

    // Calculate position to center the image
    const centerX = CROP_SIZE / 2
    const centerY = CROP_SIZE / 2
    const imgX = centerX - (imgWidth / 2) + imagePosition.x
    const imgY = centerY - (imgHeight / 2) + imagePosition.y

    // Draw image
    ctx.save()
    ctx.beginPath()
    ctx.arc(centerX, centerY, CROP_SIZE / 2, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()

    ctx.drawImage(imageElement, imgX, imgY, imgWidth, imgHeight)
    ctx.restore()

    // Draw border
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(centerX, centerY, CROP_SIZE / 2, 0, Math.PI * 2)
    ctx.stroke()
  }, [imageElement, scale, imagePosition])

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStart({
      x: e.clientX - imagePosition.x,
      y: e.clientY - imagePosition.y
    })
  }, [imagePosition])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return
    e.preventDefault()

    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y

    setImagePosition({ x: newX, y: newY })
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const touch = e.touches[0]
    setIsDragging(true)
    setDragStart({
      x: touch.clientX - imagePosition.x,
      y: touch.clientY - imagePosition.y
    })
  }, [imagePosition])

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging) return
    e.preventDefault()

    const touch = e.touches[0]
    const newX = touch.clientX - dragStart.x
    const newY = touch.clientY - dragStart.y

    setImagePosition({ x: newX, y: newY })
  }, [isDragging, dragStart])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleScaleChange = useCallback((value: number[]) => {
    if (!imageElement) return
    
    const newScale = value[0]
    const minScale = Math.max(
      CROP_SIZE / imageElement.naturalWidth,
      CROP_SIZE / imageElement.naturalHeight
    )
    
    setScale(Math.max(newScale, minScale))
  }, [imageElement])

  const handleReset = useCallback(() => {
    if (!imageElement) return
    
    const minScale = Math.max(
      CROP_SIZE / imageElement.naturalWidth,
      CROP_SIZE / imageElement.naturalHeight
    )
    
    setScale(minScale * 1.2)
    setImagePosition({ x: 0, y: 0 })
  }, [imageElement])

  const handleCrop = useCallback(() => {
    if (!imageElement || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    // Set output canvas size
    canvas.width = OUTPUT_SIZE
    canvas.height = OUTPUT_SIZE

    // Clear canvas
    ctx.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE)

    // Calculate the crop area in the original image
    const imgWidth = imageElement.naturalWidth * scale
    const imgHeight = imageElement.naturalHeight * scale

    // Center of the crop area
    const centerX = CROP_SIZE / 2
    const centerY = CROP_SIZE / 2

    // Position of the image relative to the crop area center
    const imgX = centerX - (imgWidth / 2) + imagePosition.x
    const imgY = centerY - (imgHeight / 2) + imagePosition.y

    // The crop circle is from (0, 0) to (CROP_SIZE, CROP_SIZE)
    // We need to find what part of the original image falls into this circle
    
    // Top-left of crop area relative to image
    const cropRelativeToImageX = -imgX
    const cropRelativeToImageY = -imgY

    // Convert back to original image coordinates (unscaled)
    const sourceX = cropRelativeToImageX / scale
    const sourceY = cropRelativeToImageY / scale
    const sourceSize = CROP_SIZE / scale

    // Create circular clipping path
    ctx.save()
    ctx.beginPath()
    ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()

    // Draw the cropped portion
    ctx.drawImage(
      imageElement,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      OUTPUT_SIZE,
      OUTPUT_SIZE
    )

    ctx.restore()

    // Convert to base64
    const croppedImage = canvas.toDataURL('image/png', 1.0)
    onCropComplete(croppedImage)
    onOpenChange(false)
  }, [imageElement, scale, imagePosition, onCropComplete, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop className="h-5 w-5" />
            Crop Avatar
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview Area */}
          <div className="relative flex justify-center">
            <div className="relative w-64 h-64">
              <canvas
                ref={previewCanvasRef}
                width={CROP_SIZE}
                height={CROP_SIZE}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="cursor-move touch-none rounded-full border-2 border-blue-500 shadow-[0_0_0_1px_rgba(255,255,255,0.5)]"
              />
            </div>
          </div>

          {/* Instructions */}
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">
              Drag gambar untuk menyesuaikan posisi
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Bagian dalam lingkaran biru akan menjadi foto profil Anda
            </p>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Zoom Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Zoom</span>
                <span>{Math.round(scale * 100)}%</span>
              </div>
              <Slider
                value={[scale]}
                onValueChange={handleScaleChange}
                min={imageElement ? Math.max(
                  CROP_SIZE / imageElement.naturalWidth,
                  CROP_SIZE / imageElement.naturalHeight
                ) : 0.1}
                max={3}
                step={0.01}
                className="w-full"
                disabled={!imageElement}
              />
            </div>

            {/* Reset Control */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={!imageElement}
                className="flex items-center gap-2"
              >
                <RotateCw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleCrop} disabled={!imageElement}>
            Crop & Simpan
          </Button>
        </DialogFooter>

        {/* Hidden canvas for final crop output */}
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  )
}
