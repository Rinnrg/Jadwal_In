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

  // Function to draw text with proper wrapping
  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) => {
    const words = text.split(' ')
    let line = ''
    let currentY = y

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' '
      const metrics = ctx.measureText(testLine)
      const testWidth = metrics.width

      if (testWidth > maxWidth && i > 0) {
        ctx.fillText(line.trim(), x, currentY)
        line = words[i] + ' '
        currentY += lineHeight
      } else {
        line = testLine
      }
    }
    ctx.fillText(line.trim(), x, currentY)
  }

  const handleDownload = async () => {
    if (!canvasRef.current) return

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

      // Fill white background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, cardWidth, cardHeight)

      // Load and draw background image
      try {
        const bgImage = await loadImage('/bg E-KTM.svg')
        ctx.drawImage(bgImage, 0, 0, cardWidth, cardHeight)
      } catch (e) {
        console.warn('Could not load background image, using solid color')
        ctx.fillStyle = '#3b82f6' // fallback blue background
        ctx.fillRect(0, 0, cardWidth, cardHeight)
      }

      // Draw logo (top right)
      try {
        const logoImage = await loadImage('/Logo unesa.svg')
        ctx.drawImage(logoImage, cardWidth - 56, 6, 48, 48)
      } catch (e) {
        console.warn('Could not load logo image')
      }

      // Draw photo (center top)
      const photoSize = 80
      const photoX = (cardWidth - photoSize) / 2
      const photoY = 34

      ctx.save()
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
          ctx.font = 'bold 24px sans-serif'
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
        ctx.font = 'bold 24px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
        ctx.fillText(initials, photoX + photoSize / 2, photoY + photoSize / 2)
      }

      ctx.restore()

      // Draw white border around photo
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2 + 1.5, 0, Math.PI * 2)
      ctx.stroke()

      // Draw info section (bottom center)
      const infoY = cardHeight - 48
      ctx.textAlign = 'center'

      // Name
      ctx.fillStyle = '#111827'
      ctx.font = 'bold 14px sans-serif'
      ctx.fillText(name.toUpperCase(), cardWidth / 2, infoY)

      // NIM
      ctx.font = '600 11px sans-serif'
      ctx.fillStyle = '#1f2937'
      ctx.fillText(nim, cardWidth / 2, infoY + 16)

      // Fakultas
      ctx.font = '600 10px sans-serif'
      ctx.fillStyle = '#1f2937'
      wrapText(ctx, fakultas, cardWidth / 2, infoY + 30, cardWidth - 48, 12)

      // Program Studi
      wrapText(ctx, programStudi, cardWidth / 2, infoY + 42, cardWidth - 48, 12)

      // Generate QR code and draw it
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

      // White background for QR
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(qrX - 3, qrY - 3, qrSize + 6, qrSize + 6)
      
      // Draw QR code
      ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize)

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

  return (
    <div className={styles.wrapper}>
      {/* Hidden canvas for rendering */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
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
