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

      // First, collect all computed styles from original elements
      const originalElements = cardRef.current.querySelectorAll('*')
      const styleMap = new Map<Element, Map<string, string>>()
      
      originalElements.forEach((element) => {
        const computedStyle = window.getComputedStyle(element)
        const styles = new Map<string, string>()
        
        // Properties that might have color values
        const colorProps = ['color', 'backgroundColor', 'borderColor', 'fill', 'stroke']
        
        colorProps.forEach(prop => {
          const value = computedStyle.getPropertyValue(prop)
          if (value && value.startsWith('rgb')) {
            // Convert RGB to hex
            const matches = value.match(/\d+/g)
            if (matches && matches.length >= 3) {
              const r = parseInt(matches[0])
              const g = parseInt(matches[1])
              const b = parseInt(matches[2])
              const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
              styles.set(prop, hex)
            }
          }
        })
        
        styleMap.set(element, styles)
      })

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
        allowTaint: true,
        onclone: (clonedDoc, clonedElement) => {
          // Apply pre-computed hex colors to cloned elements
          const clonedElements = clonedElement.querySelectorAll('*')
          const originalElementsArray = Array.from(originalElements)
          
          clonedElements.forEach((clonedEl, index) => {
            const htmlEl = clonedEl as HTMLElement
            const originalEl = originalElementsArray[index]
            
            // Remove all Tailwind classes that might use oklch
            if (htmlEl.className) {
              const classes = htmlEl.className.split(' ')
              const safeClasses = classes.filter(cls => 
                !cls.startsWith('text-') && 
                !cls.startsWith('bg-') && 
                !cls.startsWith('border-') &&
                !cls.startsWith('from-') &&
                !cls.startsWith('to-') &&
                !cls.startsWith('via-')
              )
              htmlEl.className = safeClasses.join(' ')
            }
            
            // Apply pre-computed hex colors
            if (originalEl) {
              const styles = styleMap.get(originalEl)
              if (styles) {
                styles.forEach((value, prop) => {
                  htmlEl.style.setProperty(prop, value, 'important')
                })
              }
            }
          })
        }
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
    <div className={styles.wrapper}>
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
        >
          <Download className="h-4 w-4" />
          Unduh E-KTM (PDF)
        </Button>
      </div>
    </div>
  )
}
