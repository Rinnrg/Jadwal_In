"use client"

import { useRef, useState, useEffect } from "react"
import Image from "next/image"
import TiltedCard from "@/components/ui/tilted-card"
import dynamic from "next/dynamic"

const QRCodeSVG = dynamic(
  () => import("qrcode.react").then((mod) => mod.QRCodeSVG),
  { ssr: false }
)

interface EKTMCardWithTiltProps {
  name: string
  nim: string
  fakultas: string
  programStudi: string
  avatarUrl?: string
  userId?: string // For generating QR code for Google Auth users
}

export function EKTMCardWithTilt({ name, nim, fakultas, programStudi, avatarUrl, userId }: EKTMCardWithTiltProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [cardImageUrl, setCardImageUrl] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(true)

  // Use userId for Google Auth users, NIM for regular users
  const qrIdentifier = userId || nim
  const qrData = `${typeof window !== 'undefined' ? window.location.origin : ''}/e-ktm/${qrIdentifier}`

  // Generate E-KTM card as image
  useEffect(() => {
    const generateCardImage = async () => {
      try {
        setIsGenerating(true)
        const canvas = document.createElement('canvas')
        const cardWidth = 396
        const cardHeight = 228
        canvas.width = cardWidth * 2
        canvas.height = cardHeight * 2
        const ctx = canvas.getContext('2d')
        
        if (!ctx) return

        ctx.scale(2, 2)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, cardWidth, cardHeight)

        // Load images
        try {
          const bgImage = await loadImage('/BG_E-KTM.svg')
          ctx.drawImage(bgImage, 0, 0, cardWidth, cardHeight)
        } catch (e) {
          console.warn('Could not load BG_E-KTM.svg')
        }

        try {
          const cardTemplate = await loadImage('/desain E-KTM.svg')
          ctx.drawImage(cardTemplate, 0, 0, cardWidth, cardHeight)
        } catch (e) {
          console.warn('Could not load desain E-KTM.svg')
        }

        // Draw logo
        try {
          const logoImage = await loadImage('/Logo unesa.svg')
          ctx.shadowColor = 'rgba(0, 0, 0, 0.1)'
          ctx.shadowBlur = 6
          ctx.shadowOffsetY = 4
          ctx.drawImage(logoImage, cardWidth - 56, 6, 48, 48)
          ctx.shadowColor = 'transparent'
          ctx.shadowBlur = 0
          ctx.shadowOffsetY = 0
        } catch (e) {
          console.warn('Could not load logo')
        }

        // Draw photo
        const photoSize = 80
        const photoX = (cardWidth - photoSize) / 2
        const photoY = 34

        ctx.save()
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
        ctx.shadowBlur = 25
        ctx.shadowOffsetY = 8
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(photoX + photoSize / 2, photoY + photoSize / 2, (photoSize / 2) + 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
        ctx.shadowOffsetY = 0

        ctx.beginPath()
        ctx.arc(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2, 0, Math.PI * 2)
        ctx.closePath()
        ctx.clip()

        if (avatarUrl) {
          try {
            const avatarImage = await loadImage(avatarUrl)
            ctx.drawImage(avatarImage, photoX, photoY, photoSize, photoSize)
          } catch (e) {
            drawInitials(ctx, photoX, photoY, photoSize)
          }
        } else {
          drawInitials(ctx, photoX, photoY, photoSize)
        }

        ctx.restore()

        // Draw text info
        const bottomMargin = 48
        const infoStartY = cardHeight - bottomMargin - 45
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        let currentY = infoStartY

        ctx.fillStyle = '#111827'
        ctx.font = 'bold 12px Arial, Helvetica, sans-serif'
        ctx.fillText(name.toUpperCase(), cardWidth / 2, currentY)
        currentY += 14

        ctx.font = '600 10px Arial, Helvetica, sans-serif'
        ctx.fillStyle = '#1f2937'
        ctx.fillText(nim, cardWidth / 2, currentY)
        currentY += 12

        ctx.font = '600 9px Arial, Helvetica, sans-serif'
        const lineHeight = 12
        const maxTextWidth = cardWidth - 80

        let fakultasText = fakultas
        let fakultasWidth = ctx.measureText(fakultasText).width
        while (fakultasWidth > maxTextWidth && fakultasText.length > 0) {
          fakultasText = fakultasText.slice(0, -1)
          fakultasWidth = ctx.measureText(fakultasText + '...').width
        }
        if (fakultasText.length < fakultas.length) fakultasText += '...'
        ctx.fillText(fakultasText, cardWidth / 2, currentY)
        currentY += lineHeight

        const prodiLines = wrapTextToLines(ctx, programStudi, maxTextWidth)
        prodiLines.slice(0, 2).forEach((line) => {
          ctx.fillText(line, cardWidth / 2, currentY)
          currentY += lineHeight
        })

        // Draw QR Code
        const QRCode = (await import('qrcode')).default
        const qrDataUrl = await QRCode.toDataURL(qrData, {
          width: 126,
          margin: 0,
          errorCorrectionLevel: 'H'
        })
        
        const qrImage = await loadImage(qrDataUrl)
        const qrSize = 42
        const qrX = 8
        const qrY = cardHeight - qrSize - 8

        ctx.save()
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)'
        ctx.shadowBlur = 4
        ctx.shadowOffsetY = 2
        ctx.fillStyle = '#ffffff'
        const qrBorderRadius = 4
        const qrPadding = 3
        const qrBgX = qrX - qrPadding
        const qrBgY = qrY - qrPadding
        const qrBgSize = qrSize + (qrPadding * 2)
        
        ctx.beginPath()
        ctx.moveTo(qrBgX + qrBorderRadius, qrBgY)
        ctx.lineTo(qrBgX + qrBgSize - qrBorderRadius, qrBgY)
        ctx.quadraticCurveTo(qrBgX + qrBgSize, qrBgY, qrBgX + qrBgSize, qrBgY + qrBorderRadius)
        ctx.lineTo(qrBgX + qrBgSize, qrBgY + qrBgSize - qrBorderRadius)
        ctx.quadraticCurveTo(qrBgX + qrBgSize, qrBgY + qrBgSize, qrBgX + qrBgSize - qrBorderRadius, qrBgY + qrBgSize)
        ctx.lineTo(qrBgX + qrBorderRadius, qrBgY + qrBgSize)
        ctx.quadraticCurveTo(qrBgX, qrBgY + qrBgSize, qrBgX, qrBgY + qrBgSize - qrBorderRadius)
        ctx.lineTo(qrBgX, qrBgY + qrBorderRadius)
        ctx.quadraticCurveTo(qrBgX, qrBgY, qrBgX + qrBorderRadius, qrBgY)
        ctx.closePath()
        ctx.fill()
        
        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
        ctx.shadowOffsetY = 0
        ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize)
        ctx.restore()

        // Convert to image URL
        const imageUrl = canvas.toDataURL('image/png', 1.0)
        setCardImageUrl(imageUrl)
        setIsGenerating(false)
      } catch (error) {
        console.error('Error generating card image:', error)
        setIsGenerating(false)
      }
    }

    generateCardImage()
  }, [name, nim, fakultas, programStudi, avatarUrl, qrData])

  const drawInitials = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    ctx.fillStyle = '#111827'
    ctx.fillRect(x, y, size, size)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 24px Arial, Helvetica, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    ctx.fillText(initials, x + size / 2, y + size / 2)
  }

  const wrapTextToLines = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''

    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine + (currentLine ? ' ' : '') + words[i]
      const metrics = ctx.measureText(testLine)
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = words[i]
      } else {
        currentLine = testLine
      }
    }
    
    if (currentLine) lines.push(currentLine)
    return lines
  }

  const loadImage = async (url: string): Promise<HTMLImageElement> => {
    try {
      return await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new window.Image()
        img.crossOrigin = "anonymous"
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = url
      })
    } catch (error) {
      console.log('Direct image load failed, trying fetch method...')
      try {
        const response = await fetch(url, { mode: 'cors' })
        const blob = await response.blob()
        const objectUrl = URL.createObjectURL(blob)
        
        return await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new window.Image()
          img.onload = () => {
            URL.revokeObjectURL(objectUrl)
            resolve(img)
          }
          img.onerror = () => {
            URL.revokeObjectURL(objectUrl)
            reject(new Error('Failed to load image from blob'))
          }
          img.src = objectUrl
        })
      } catch (fetchError) {
        console.error('Fetch method also failed:', fetchError)
        throw error
      }
    }
  }

  if (isGenerating || !cardImageUrl) {
    return (
      <div className="w-full flex flex-col items-center gap-6">
        <div className="w-[396px] h-[228px] flex items-center justify-center bg-muted/20 rounded-2xl">
          <p className="text-sm text-muted-foreground">Memuat E-KTM...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col items-center gap-6">
      {/* Hidden canvas for PDF download */}
      <div ref={cardRef} className="hidden" />

      {/* TiltedCard with generated E-KTM image */}
      <TiltedCard
        imageSrc={cardImageUrl}
        altText={`E-KTM ${name}`}
        captionText={`E-KTM - ${name}`}
        containerHeight="350px"
        containerWidth="100%"
        imageHeight="228px"
        imageWidth="396px"
        rotateAmplitude={12}
        scaleOnHover={1.2}
        showMobileWarning={false}
        showTooltip={true}
        displayOverlayContent={false}
      />
    </div>
  )
}
