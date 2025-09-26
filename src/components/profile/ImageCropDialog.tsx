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

export function ImageCropDialog({ open, onOpenChange, imageSrc, onCropComplete }: ImageCropDialogProps) {
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const [containerSize] = useState({ width: 256, height: 256 })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const getScaledImageSize = useCallback(() => {
    return {
      width: imageSize.width * zoom,
      height: imageSize.height * zoom
    }
  }, [imageSize, zoom])

  // Load image and calculate initial size and position
  useEffect(() => {
    if (!imageSrc || !open) return

    const img = new Image()
    img.onload = () => {
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight })
      
      // Calculate initial scale to fit image in container
      const scaleX = containerSize.width / img.naturalWidth
      const scaleY = containerSize.height / img.naturalHeight
      const initialScale = Math.max(scaleX, scaleY)
      
      setZoom(initialScale)
      setPosition({ x: 0, y: 0 })
    }
    img.src = imageSrc
  }, [imageSrc, open, containerSize])

  // Update CSS custom properties for dynamic positioning
  useEffect(() => {
    if (!containerRef.current) return
    
    const scaledSize = getScaledImageSize()
    const container = containerRef.current
    
    container.style.setProperty('--crop-size', `${containerSize.width}px`)
    
    const img = container.querySelector('.crop-image') as HTMLElement
    if (img) {
      img.style.width = `${scaledSize.width}px`
      img.style.height = `${scaledSize.height}px`
      img.style.left = `${position.x}px`
      img.style.top = `${position.y}px`
    }
  }, [position, zoom, getScaledImageSize, containerSize])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    
    setDragStart({ 
      x: e.clientX - rect.left - position.x, 
      y: e.clientY - rect.top - position.y 
    })
  }, [position])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return
    e.preventDefault()
    
    const rect = containerRef.current.getBoundingClientRect()
    const scaledSize = getScaledImageSize()
    
    let newX = e.clientX - rect.left - dragStart.x
    let newY = e.clientY - rect.top - dragStart.y
    
    // Constrain movement to keep image covering the crop area
    const minX = containerSize.width - scaledSize.width
    const maxX = 0
    const minY = containerSize.height - scaledSize.height
    const maxY = 0
    
    newX = Math.min(maxX, Math.max(minX, newX))
    newY = Math.min(maxY, Math.max(minY, newY))
    
    setPosition({ x: newX, y: newY })
  }, [isDragging, dragStart, getScaledImageSize, containerSize])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleCrop = useCallback(() => {
    if (!canvasRef.current || !imageSize.width || !imageSize.height) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const outputSize = 300
    canvas.width = outputSize
    canvas.height = outputSize

    // Create a new image element for cropping
    const img = new Image()
    img.onload = () => {
      // Calculate the crop area in original image coordinates
      const scaledSize = getScaledImageSize()
      const cropRadius = containerSize.width / 2
      
      // Convert screen coordinates to image coordinates
      const scaleRatio = imageSize.width / scaledSize.width
      
      const cropCenterX = (containerSize.width / 2 - position.x) * scaleRatio
      const cropCenterY = (containerSize.height / 2 - position.y) * scaleRatio
      const cropSize = (cropRadius * 2) * scaleRatio
      
      const cropX = cropCenterX - cropSize / 2
      const cropY = cropCenterY - cropSize / 2
      
      // Clear canvas with white background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, outputSize, outputSize)
      
      // Create circular clip
      ctx.save()
      ctx.beginPath()
      ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2)
      ctx.clip()
      
      // Draw the cropped image
      ctx.drawImage(
        img,
        Math.max(0, cropX),
        Math.max(0, cropY),
        Math.min(cropSize, imageSize.width - Math.max(0, cropX)),
        Math.min(cropSize, imageSize.height - Math.max(0, cropY)),
        0,
        0,
        outputSize,
        outputSize
      )
      
      ctx.restore()
      
      // Get cropped image as data URL
      const croppedImage = canvas.toDataURL('image/jpeg', 0.9)
      onCropComplete(croppedImage)
      onOpenChange(false)
    }
    img.src = imageSrc
  }, [position, zoom, imageSize, containerSize, getScaledImageSize, imageSrc, onCropComplete, onOpenChange])

  const handleZoomChange = useCallback((value: number[]) => {
    const newZoom = value[0]
    const scaledSize = {
      width: imageSize.width * newZoom,
      height: imageSize.height * newZoom
    }
    
    // Adjust position to keep image covering crop area
    let newX = position.x
    let newY = position.y
    
    const minX = containerSize.width - scaledSize.width
    const maxX = 0
    const minY = containerSize.height - scaledSize.height
    const maxY = 0
    
    newX = Math.min(maxX, Math.max(minX, newX))
    newY = Math.min(maxY, Math.max(minY, newY))
    
    setZoom(newZoom)
    setPosition({ x: newX, y: newY })
  }, [imageSize, position, containerSize])

  const handleReset = useCallback(() => {
    if (!imageSize.width || !imageSize.height) return
    
    // Calculate initial scale to fit image in container
    const scaleX = containerSize.width / imageSize.width
    const scaleY = containerSize.height / imageSize.height
    const initialScale = Math.max(scaleX, scaleY)
    
    setZoom(initialScale)
    setPosition({ x: 0, y: 0 })
  }, [imageSize, containerSize])

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
          <div className="relative">
            <div 
              ref={containerRef}
              className="image-crop-container"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {imageSrc && (
                <img
                  ref={imageRef}
                  src={imageSrc}
                  alt="Crop preview"
                  className="crop-image"
                  draggable={false}
                />
              )}
              
              {/* Crop circle border */}
              <div className="absolute inset-0 border-2 border-blue-500 rounded-full pointer-events-none">
                <div className="absolute inset-0 border border-white/50 rounded-full" />
              </div>
            </div>
            
            {/* Instructions */}
            <div className="text-center mt-2">
              <p className="text-xs text-muted-foreground">
                Drag gambar untuk menyesuaikan posisi
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Zoom Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Zoom</span>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <Slider
                value={[zoom]}
                onValueChange={handleZoomChange}
                min={0.1}
                max={3}
                step={0.05}
                className="w-full"
              />
            </div>

            {/* Reset Control */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
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
          <Button onClick={handleCrop}>
            Crop & Simpan
          </Button>
        </DialogFooter>

        {/* Hidden canvas for cropping */}
        <canvas
          ref={canvasRef}
          className="hidden"
          width={300}
          height={300}
        />
      </DialogContent>
    </Dialog>
  )
}
