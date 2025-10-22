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

  // Function to load image from URL
  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image()
      img.crossOrigin = "anonymous"
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = url
    })
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

      // Load and draw background image
      try {
        const bgImage = await loadImage('/bg E-KTM.svg')
        ctx.drawImage(bgImage, 0, 0, cardWidth, cardHeight)
      } catch (e) {
        console.warn('Could not load background image, using solid color')
        // Fallback gradient background
        const gradient = ctx.createLinearGradient(0, 0, cardWidth, cardHeight)
        gradient.addColorStop(0, '#3b82f6')
        gradient.addColorStop(1, '#1e40af')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, cardWidth, cardHeight)
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
          const avatarImage = await loadImage(avatarUrl)
          ctx.drawImage(avatarImage, photoX, photoY, photoSize, photoSize)
        } catch (e) {
          // Draw fallback initials
          ctx.fillStyle = '#111827'
          ctx.fillRect(photoX, photoY, photoSize, photoSize)
          ctx.fillStyle = '#ffffff'
          ctx.font = 'bold 20px sans-serif'
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
        ctx.font = 'bold 20px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
        ctx.fillText(initials, photoX + photoSize / 2, photoY + photoSize / 2)
      }

      ctx.restore()

      // Draw info section (bottom center) - exact position from CSS: bottom: 48px
      const infoY = cardHeight - 48
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'

      // Name - exact styling from CSS: font-size: 12px, font-weight: 700, color: #111827
      ctx.fillStyle = '#111827'
      ctx.font = 'bold 12px Arial, sans-serif'
      ctx.letterSpacing = '0.025em'
      ctx.fillText(name.toUpperCase(), cardWidth / 2, infoY)

      // NIM - exact styling from CSS: font-size: 10px, font-weight: 600, color: #1f2937
      ctx.font = '600 10px Arial, sans-serif'
      ctx.fillStyle = '#1f2937'
      ctx.fillText(nim, cardWidth / 2, infoY + 14)

      // Fakultas - exact styling from CSS: font-size: 9px, font-weight: 600, color: #1f2937
      ctx.font = '600 9px Arial, sans-serif'
      ctx.fillStyle = '#1f2937'
      
      // Calculate proper line height for text wrapping
      const lineHeight = 11
      let currentY = infoY + 28

      // Draw Fakultas with proper wrapping
      const fakultasLines = wrapTextToLines(ctx, fakultas, cardWidth - 48)
      fakultasLines.forEach(line => {
        ctx.fillText(line, cardWidth / 2, currentY)
        currentY += lineHeight
      })

      // Draw Program Studi with proper wrapping
      const prodiLines = wrapTextToLines(ctx, programStudi, cardWidth - 48)
      prodiLines.forEach(line => {
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
