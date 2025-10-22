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
      // Dynamically import libraries
      const html2canvas = (await import("html2canvas")).default
      const jsPDF = (await import("jspdf")).default
      
      // Capture the card as canvas with high quality
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: null,
        logging: false,
        useCORS: true,
        allowTaint: true,
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
    } catch (error) {
      console.error("Error downloading E-KTM:", error)
      alert("Gagal mengunduh E-KTM. Silakan coba lagi.")
    }
  }

  return (
    <div className="space-y-4 w-full">
      {/* Card Preview - Fixed positioning for consistency */}
      <div ref={cardRef} className={styles.ektmCard}>
        {/* Logo Unesa - Top Right (scaled proportionally) */}
        <div className="absolute top-[1.5%] right-[1.5%] w-[12%] h-auto aspect-square">
          <Image
            src="/Logo unesa.svg"
            alt="Logo Unesa"
            width={48}
            height={48}
            className="w-full h-full object-contain drop-shadow-md"
          />
        </div>

        {/* Photo Section - Center Top (scaled proportionally) */}
        <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[20%] aspect-square">
          <div className="w-full h-full rounded-full bg-gray-900 border-[0.75%] border-white shadow-xl overflow-hidden">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={name}
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-900">
                <span className={`text-white font-bold ${styles.fallbackText}`}>
                  {name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Info Section - Bottom Center (using percentage positioning) */}
        <div className="absolute bottom-[21%] left-0 right-0 px-[5%] text-center">
          <h3 className={`text-gray-900 font-bold uppercase tracking-wide mb-[0.5%] ${styles.nameText}`}>
            {name}
          </h3>
          <p className={`text-gray-800 font-semibold mb-[1.5%] ${styles.nimText}`}>
            {nim}
          </p>
          <div className={`text-gray-800 leading-tight space-y-[0.25%] ${styles.infoText}`}>
            <div className="font-semibold">
              {fakultas}
            </div>
            <div className="font-semibold">
              {programStudi}
            </div>
          </div>
        </div>

        {/* QR Code - Bottom Left (scaled proportionally) */}
        <div className="absolute bottom-[1.5%] left-[1.5%] bg-white p-[0.5%] rounded shadow-md w-[13%] aspect-square">
          <QRCodeSVG
            value={qrData}
            size={45}
            level="H"
            includeMargin={false}
            style={{ width: '100%', height: '100%' }}
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
