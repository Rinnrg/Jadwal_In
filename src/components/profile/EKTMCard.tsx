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
      // Dynamically import html2canvas
      const html2canvas = (await import("html2canvas")).default
      
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: null,
        logging: false,
      })

      // Convert to blob and download
      canvas.toBlob((blob: Blob | null) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement("a")
          link.href = url
          link.download = `E-KTM-${nim}.png`
          link.click()
          URL.revokeObjectURL(url)
        }
      })
    } catch (error) {
      console.error("Error downloading E-KTM:", error)
    }
  }

  return (
    <div className="space-y-4">
      {/* Card Preview */}
      <div ref={cardRef} className={styles.ektmCard}>
        {/* Logo Unesa - Top Right */}
        <div className="absolute top-3 right-3 w-12 h-12">
          <Image
            src="/Logo unesa.svg"
            alt="Logo Unesa"
            width={48}
            height={48}
            className="object-contain drop-shadow-md"
          />
        </div>

        {/* Header - Top Left
        <div className="absolute top-3 left-6">
          <h2 className="text-gray-900 font-bold text-[10px] leading-tight tracking-wide">
            <span className="font-extrabold">KARTU TANDA</span><br />
            <span className="font-extrabold">MAHASISWA</span>
          </h2>
        </div> */}

        {/* Photo Section - Center Top */}
        <div className="absolute top-[35px] left-1/2 -translate-x-1/2">
          <div className="w-20 h-20 rounded-full bg-gray-900 border-[3px] border-white shadow-xl overflow-hidden">
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
                <span className="text-white text-xl font-bold">
                  {name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Info Section - Bottom Center */}
        <div className="absolute bottom-[48px] left-0 right-0 px-8 text-center">
          <h3 className="text-gray-900 font-bold text-[12px] mb-0.5 uppercase tracking-wide">
            {name}
          </h3>
          <p className="text-gray-800 text-[10px] font-semibold mb-1.5">
            {nim}
          </p>
          <div className="text-gray-800 text-[9px] leading-tight space-y-[1px]">
            <div className="font-semibold">
              {fakultas}
            </div>
            <div className="font-semibold">
              {programStudi}
            </div>
          </div>
        </div>

        {/* QR Code - Bottom Left */}
        <div className="absolute bottom-2.5 left-3 bg-white p-1 rounded shadow-md">
          <QRCodeSVG
            value={qrData}
            size={45}
            level="H"
            includeMargin={false}
          />
        </div>
      </div>

      {/* Download Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleDownload}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Unduh E-KTM
        </Button>
      </div>
    </div>
  )
}
