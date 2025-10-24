"use client"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import Image from "next/image"
import styles from "./EKTMCard.module.css"

// Dynamically import QRCodeSVG
import dynamic from "next/dynamic"
const QRCodeSVG = dynamic(
  () => import("qrcode.react").then((mod) => mod.QRCodeSVG),
  { ssr: false }
)

interface EKTMCardProps {
  name: string
  nim: string
  fakultas: string
  programStudi: string
  avatarUrl?: string
}

export function EKTMCard({ name, nim, fakultas, programStudi, avatarUrl }: EKTMCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  // Generate QR Code data - URL yang akan menampilkan E-KTM
  const qrData = `${typeof window !== 'undefined' ? window.location.origin : ''}/e-ktm/${nim}`

  // Function to load image from URL with better CORS handling
  const loadImage = async (url: string): Promise<HTMLImageElement> => {
    // Try direct load first
    try {
      return await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new window.Image()
        img.crossOrigin = "anonymous"
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = url
      })
    } catch (error) {
      // If direct load fails, try using fetch + blob (better for CORS)
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

  const handleDownload = async () => {
    if (!cardRef.current) return

    try {
      setIsDownloading(true)

      // Create a high-resolution canvas for PDF
      const scale = 3
      const canvas = document.createElement('canvas')
      const cardWidth = 396
      const cardHeight = 228
      canvas.width = cardWidth * scale
      canvas.height = cardHeight * scale
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        throw new Error('Could not get canvas context')
      }

      // Scale the context for high resolution
      ctx.scale(scale, scale)

      // Fill white background first
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, cardWidth, cardHeight)

      // Load and draw main background (BG_E-KTM.svg)
      try {
        const bgImage = await loadImage('/BG_E-KTM.svg')
        ctx.drawImage(bgImage, 0, 0, cardWidth, cardHeight)
        console.log('✅ Successfully loaded BG_E-KTM.svg for background')
      } catch (e) {
        console.warn('Could not load BG_E-KTM.svg, using fallback background')
      }

      // Load and draw card template/design overlay (desain E-KTM.svg)
      try {
        const cardTemplate = await loadImage('/desain E-KTM.svg')
        ctx.drawImage(cardTemplate, 0, 0, cardWidth, cardHeight)
        console.log('✅ Successfully loaded desain E-KTM.svg for card template')
      } catch (e) {
        console.warn('Could not load desain E-KTM.svg')
      }

      // Draw logo (top right) - exact position from CSS
      try {
        const logoImage = await loadImage('/Logo unesa.svg')
        // Add shadow effect
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)'
        ctx.shadowBlur = 6
        ctx.shadowOffsetY = 4
        ctx.drawImage(logoImage, cardWidth - 56, 6, 48, 48)
        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
        ctx.shadowOffsetY = 0
      } catch (e) {
        console.warn('Could not load logo image')
      }

      // Draw photo (center top) - exact position from CSS: top: 34px
      const photoSize = 80
      const photoX = (cardWidth - photoSize) / 2
      const photoY = 34

      // Draw photo background circle with border
      ctx.save()
      
      // Draw shadow for photo
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
      ctx.shadowBlur = 25
      ctx.shadowOffsetY = 8
      
      // Draw white border circle
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(photoX + photoSize / 2, photoY + photoSize / 2, (photoSize / 2) + 3, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetY = 0

      // Clip to circle for photo
      ctx.beginPath()
      ctx.arc(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()

      if (avatarUrl) {
        try {
          // Try to load the image with CORS handling
          let imageUrl = avatarUrl
          
          // If it's a Google profile image, try to use a proxy or direct load
          if (avatarUrl.includes('googleusercontent.com')) {
            // For Google images, we can load directly but need proper CORS
            imageUrl = avatarUrl
          }
          
          const avatarImage = await loadImage(imageUrl)
          
          // Draw the image scaled to fit the circle
          ctx.drawImage(avatarImage, photoX, photoY, photoSize, photoSize)
          
          console.log('✅ Successfully loaded avatar image for PDF')
        } catch (e) {
          console.warn('Could not load avatar image, using initials fallback:', e)
          // Draw fallback initials
          ctx.fillStyle = '#111827'
          ctx.fillRect(photoX, photoY, photoSize, photoSize)
          ctx.fillStyle = '#ffffff'
          ctx.font = 'bold 24px Arial, Helvetica, sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
          ctx.fillText(initials, photoX + photoSize / 2, photoY + photoSize / 2)
        }
      } else {
        // Draw fallback initials
        ctx.fillStyle = '#111827'
        ctx.fillRect(photoX, photoY, photoSize, photoSize)
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 24px Arial, Helvetica, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
        ctx.fillText(initials, photoX + photoSize / 2, photoY + photoSize / 2)
      }

      ctx.restore()

      // Draw info section (bottom center) - matching CSS exactly: bottom: 48px
      // Calculate from bottom: cardHeight - 48px (bottom position) - total content height
      // Total content height estimation: name(12) + gap(2) + nim(10) + gap(2) + fakultas(9*1.3) + gap + prodi(9*1.3)
      // Approximate: 12 + 2 + 10 + 2 + 12 + 2 + 12 = ~52px, so start at cardHeight - 48 - 52 = cardHeight - 100
      
      // Better calculation: Position from bottom upwards
      const bottomMargin = 48 // CSS: bottom: 48px
      const infoStartY = cardHeight - bottomMargin - 45 // Start 45px above bottom margin to fit all text
      
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      let currentY = infoStartY

      // Name - matching CSS: font-size: 12px, font-weight: 700
      ctx.fillStyle = '#111827'
      ctx.font = 'bold 12px Arial, Helvetica, sans-serif'
      const nameText = name.toUpperCase()
      ctx.fillText(nameText, cardWidth / 2, currentY)
      currentY += 12 + 2 // font size + gap

      // NIM - matching CSS: font-size: 10px, font-weight: 600
      ctx.font = '600 10px Arial, Helvetica, sans-serif'
      ctx.fillStyle = '#1f2937'
      ctx.fillText(nim, cardWidth / 2, currentY)
      currentY += 10 + 2 // font size + gap

      // Fakultas & Prodi - matching CSS: font-size: 9px, font-weight: 600, line-height: 1.3
      ctx.font = '600 9px Arial, Helvetica, sans-serif'
      ctx.fillStyle = '#1f2937'
      
      // Line height based on CSS: 9px * 1.3 = 11.7px ≈ 12px
      const lineHeight = 12
      
      // Draw Fakultas - single line, truncate if too long
      const maxTextWidth = cardWidth - 80
      let fakultasText = fakultas
      let fakultasWidth = ctx.measureText(fakultasText).width
      while (fakultasWidth > maxTextWidth && fakultasText.length > 0) {
        fakultasText = fakultasText.slice(0, -1)
        fakultasWidth = ctx.measureText(fakultasText + '...').width
      }
      if (fakultasText.length < fakultas.length) {
        fakultasText += '...'
      }
      ctx.fillText(fakultasText, cardWidth / 2, currentY)
      currentY += lineHeight

      // Draw Program Studi - wrap to 2 lines if needed
      const prodiLines = wrapTextToLines(ctx, programStudi, maxTextWidth)
      prodiLines.slice(0, 2).forEach((line) => {
        ctx.fillText(line, cardWidth / 2, currentY)
        currentY += lineHeight
      })

      // Generate QR code and draw it - exact position from CSS: bottom: 8px, left: 8px, size: 42px
      const QRCode = (await import('qrcode')).default
      const qrDataUrl = await QRCode.toDataURL(qrData, {
        width: 126, // 42 * 3 for high resolution
        margin: 0,
        errorCorrectionLevel: 'H'
      })
      
      const qrImage = await loadImage(qrDataUrl)
      const qrSize = 42
      const qrX = 8
      const qrY = cardHeight - qrSize - 8

      // White background for QR with rounded corners and shadow
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
      
      // Draw rounded rectangle for QR background
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
      
      // Draw QR code
      ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize)
      ctx.restore()

      // Convert canvas to PDF
      const { default: jsPDF } = await import('jspdf')
      const imgData = canvas.toDataURL('image/png', 1.0)
      
      const pdfWidth = 85.6 // Credit card size in mm
      const pdfHeight = (cardHeight / cardWidth) * pdfWidth
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [pdfWidth, pdfHeight]
      })
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST')
      pdf.save(`E-KTM-${nim}.pdf`)

    } catch (error) {
      console.error("Error downloading E-KTM:", error)
      alert("Gagal mengunduh E-KTM. Error: " + (error as Error).message)
    } finally {
      setIsDownloading(false)
    }
  }

  // Helper function to wrap text into lines
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
    
    if (currentLine) {
      lines.push(currentLine)
    }
    
    return lines
  }

  return (
    <div className={styles.wrapper}>
      {/* Hidden canvas for rendering */}
      <canvas ref={canvasRef} className={styles.hiddenCanvas} />
      
      {/* Card Preview - Fixed positioning for consistency */}
      <div ref={cardRef} className={styles.ektmCard}>
        {/* Logo Unesa - Top Right */}
        <div className={styles.logoContainer}>
          <Image
            src="/Logo unesa.svg"
            alt="Logo Unesa"
            width={48}
            height={48}
            style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
            priority
          />
        </div>

        {/* Photo Section - Center Top */}
        <div className={styles.photoContainer}>
          <div className={styles.photoContainerInner}>
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={name}
                width={80}
                height={80}
                className={styles.photoImage}
                priority
              />
            ) : (
              <div className={styles.photoFallback}>
                <span className={styles.fallbackText}>
                  {name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Info Section - Bottom Center */}
        <div className={styles.infoContainer}>
          <h3 className={styles.nameText}>
            {name}
          </h3>
          <p className={styles.nimText}>
            {nim}
          </p>
          <div className={styles.infoText}>
            <div>
              {fakultas}
            </div>
            <div>
              {programStudi}
            </div>
          </div>
        </div>

        {/* QR Code - Bottom Left */}
        <div className={styles.qrContainer}>
          <QRCodeSVG
            value={qrData}
            size={100}
            level="H"
            includeMargin={false}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </div>

      {/* Download Button */}
      <div className={styles.buttonWrapper}>
        <Button
          onClick={handleDownload}
          variant="outline"
          size="sm"
          className="gap-2 text-xs sm:text-sm"
          disabled={isDownloading}
        >
          <Download className="h-4 w-4" />
          {isDownloading ? 'Mengunduh...' : 'Unduh E-KTM (PDF)'}
        </Button>
      </div>
    </div>
  )
}
