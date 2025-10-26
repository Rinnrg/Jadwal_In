"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Download, X } from "lucide-react"
import { EKTMCardWithTilt } from "./EKTMCardWithTilt"

interface EKTMFullViewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  name: string
  nim: string
  fakultas: string
  programStudi: string
  avatarUrl?: string
}

export function EKTMFullView({
  open,
  onOpenChange,
  name,
  nim,
  fakultas,
  programStudi,
  avatarUrl,
}: EKTMFullViewProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  if (!open) return null

  const handleDownload = async () => {
    if (!nim) return

    try {
      setIsDownloading(true)

      // Load helper function
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

      const scale = 3
      const canvas = document.createElement('canvas')
      const cardWidth = 396
      const cardHeight = 228
      canvas.width = cardWidth * scale
      canvas.height = cardHeight * scale
      const ctx = canvas.getContext('2d')
      
      if (!ctx) throw new Error('Could not get canvas context')

      ctx.scale(scale, scale)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, cardWidth, cardHeight)

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
        console.warn('Could not load logo image')
      }

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
          console.warn('Could not load avatar image, using initials fallback')
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

      const qrData = `${typeof window !== 'undefined' ? window.location.origin : ''}/e-ktm/${nim}`
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

      const { default: jsPDF } = await import('jspdf')
      const imgData = canvas.toDataURL('image/png', 1.0)
      const pdfWidth = 85.6
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
    <div 
      className="fixed inset-0 z-[100] m-0 p-0"
      style={{ background: 'transparent' }}
      onClick={(e) => {
        // Klik di luar E-KTM akan menutup
        if (e.target === e.currentTarget) {
          onOpenChange(false)
        }
      }}
    >
      {/* Content - Scrollable */}
      <div 
        className="flex flex-col items-center justify-start min-h-screen w-full overflow-y-auto p-4 sm:p-8 pt-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title - Hilangkan atau buat lebih subtle */}
        
        {/* E-KTM Card - Floating bebas */}
        <div className="w-full max-w-lg mb-8 mt-12">
          <EKTMCardWithTilt
            name={name}
            nim={nim}
            fakultas={fakultas}
            programStudi={programStudi}
            avatarUrl={avatarUrl}
          />
        </div>

        {/* Download Button - Below card */}
        <Button
          onClick={handleDownload}
          variant="default"
          size="lg"
          className="gap-2 text-sm sm:text-base font-semibold shadow-2xl bg-white text-blue-600 hover:bg-blue-50 border-2 border-white/20 hover:scale-105 transition-transform"
          disabled={isDownloading}
        >
          <Download className="h-5 w-5" />
          {isDownloading ? 'Mengunduh E-KTM...' : 'Unduh E-KTM'}
        </Button>

        {/* Close Button - Below download button */}
        <Button
          onClick={() => onOpenChange(false)}
          variant="outline"
          size="lg"
          className="gap-2 text-sm sm:text-base font-semibold shadow-lg bg-white/10 text-white hover:bg-white/20 border-2 border-white/30 mt-3 mb-8 hover:scale-105 transition-transform backdrop-blur-sm"
        >
          <X className="h-5 w-5" />
          Tutup
        </Button>
      </div>
    </div>
  )
}
