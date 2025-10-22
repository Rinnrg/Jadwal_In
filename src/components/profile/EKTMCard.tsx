"use client"

import { useRef } from "react"
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

  // Generate QR Code data - URL yang akan menampilkan E-KTM
  const qrData = `${typeof window !== 'undefined' ? window.location.origin : ''}/e-ktm/${nim}`

  const handleDownload = async () => {
    if (!cardRef.current) return

    try {
      // Show loading state
      const button = document.activeElement as HTMLButtonElement
      if (button) {
        button.disabled = true
        button.textContent = 'Mengunduh...'
      }

      // Dynamically import libraries
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf")
      ])
      
      // Capture the card as canvas with high quality
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true
      })

      // Convert canvas to image data
      const imgData = canvas.toDataURL('image/png', 1.0)
      
      // Calculate dimensions for PDF (maintaining aspect ratio)
      const cardWidth = 396 // Original card width
      const cardHeight = 228 // Original card height
      const pdfWidth = 85.6 // Credit card size in mm (width)
      const pdfHeight = (cardHeight / cardWidth) * pdfWidth
      
      // Create PDF with card dimensions
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [pdfWidth, pdfHeight]
      })
      
      // Add image to PDF (full page)
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST')
      
      // Download PDF
      pdf.save(`E-KTM-${nim}.pdf`)
      
      // Re-enable button
      if (button) {
        button.disabled = false
        button.innerHTML = '<svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg> Unduh E-KTM (PDF)'
      }
    } catch (error) {
      console.error("Error downloading E-KTM:", error)
      alert("Gagal mengunduh E-KTM. Error: " + (error as Error).message)
      
      // Re-enable button on error
      const button = document.activeElement as HTMLButtonElement
      if (button) {
        button.disabled = false
        button.innerHTML = '<svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg> Unduh E-KTM (PDF)'
      }
    }
  }

  return (
    <div className="space-y-4 w-full">
      {/* Card Preview - Fixed positioning for consistency */}
      <div ref={cardRef} className={styles.ektmCard}>
        {/* Logo Unesa - Top Right */}
        <div className={styles.logoContainer}>
          <Image
            src="/Logo unesa.svg"
            alt="Logo Unesa"
            width={48}
            height={48}
            className="w-full h-full object-contain drop-shadow-md"
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
            className="w-full h-full"
          />
        </div>
      </div>

      {/* Download Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleDownload}
          variant="outline"
          size="sm"
          className="gap-2 text-xs sm:text-sm"
        >
          <Download className="h-4 w-4" />
          Unduh E-KTM (PDF)
        </Button>
      </div>
    </div>
  )
}
