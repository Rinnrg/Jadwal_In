"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
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
}

export function EKTMCardWithTilt({ name, nim, fakultas, programStudi, avatarUrl }: EKTMCardWithTiltProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const qrData = `${typeof window !== 'undefined' ? window.location.origin : ''}/e-ktm/${nim}`

  // Function to load image with CORS handling
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

  const handleDownload = async () => {
    if (!cardRef.current) return

    try {
      setIsDownloading(true)

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

  // Create card content as a div to be used as image
  const renderCardContent = () => (
    <div
      ref={cardRef}
      style={{
        position: 'relative',
        width: '396px',
        height: '228px',
        borderRadius: '1rem',
        overflow: 'hidden',
        backgroundImage: 'url(/desain E-KTM.svg), url(/BG_E-KTM.svg)',
        backgroundSize: 'cover, cover',
        backgroundPosition: 'center, center',
        backgroundRepeat: 'no-repeat, no-repeat',
        backgroundColor: '#ffffff',
      }}
    >
      {/* Logo */}
      <div style={{ position: 'absolute', top: '6px', right: '8px', width: '48px', height: '48px' }}>
        <Image
          src="/Logo unesa.svg"
          alt="Logo Unesa"
          width={48}
          height={48}
          style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
          priority
        />
      </div>

      {/* Photo */}
      <div style={{
        position: 'absolute',
        top: '34px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '80px',
        height: '80px',
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          borderRadius: '9999px',
          border: '3px solid #ffffff',
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
          overflow: 'hidden',
          backgroundColor: '#111827',
        }}>
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={name}
              width={80}
              height={80}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              priority
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#111827',
              color: '#ffffff',
              fontSize: '20px',
              fontWeight: 700,
            }}>
              {name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div style={{
        position: 'absolute',
        bottom: '48px',
        left: 0,
        right: 0,
        paddingLeft: '1.5rem',
        paddingRight: '1.5rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
      }}>
        <h3 style={{
          fontSize: '12px',
          margin: 0,
          color: '#111827',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.025em',
          lineHeight: 1,
        }}>
          {name}
        </h3>
        <p style={{
          fontSize: '10px',
          margin: 0,
          color: '#1f2937',
          fontWeight: 600,
          lineHeight: 1,
        }}>
          {nim}
        </p>
        <div style={{
          fontSize: '9px',
          lineHeight: 1.3,
          color: '#1f2937',
          margin: 0,
        }}>
          <div style={{ margin: 0, fontWeight: 600 }}>{fakultas}</div>
          <div style={{ margin: 0, fontWeight: 600 }}>{programStudi}</div>
        </div>
      </div>

      {/* QR Code */}
      <div style={{
        position: 'absolute',
        bottom: '8px',
        left: '8px',
        background: '#ffffff',
        padding: '3px',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        width: '42px',
        height: '42px',
      }}>
        <QRCodeSVG
          value={qrData}
          size={100}
          level="H"
          includeMargin={false}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  )

  // Convert card to base64 image for TiltedCard
  const cardImageSrc = '/desain E-KTM.svg' // We'll use the design as the image

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
      <TiltedCard
        imageSrc={cardImageSrc}
        altText={`E-KTM ${name}`}
        captionText={`E-KTM - ${name}`}
        containerHeight="400px"
        containerWidth="100%"
        imageHeight="228px"
        imageWidth="396px"
        rotateAmplitude={12}
        scaleOnHover={1.15}
        showMobileWarning={false}
        showTooltip={true}
        displayOverlayContent={true}
        overlayContent={renderCardContent()}
      />

      {/* Download Button - Below the card */}
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '-2rem' }}>
        <Button
          onClick={handleDownload}
          variant="outline"
          size="sm"
          className="gap-2 text-xs sm:text-sm shadow-lg"
          disabled={isDownloading}
        >
          <Download className="h-4 w-4" />
          {isDownloading ? 'Mengunduh...' : 'Unduh E-KTM (PDF)'}
        </Button>
      </div>
    </div>
  )
}
