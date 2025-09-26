import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { Providers } from "./providers"
import { GlobalLoading } from "@/components/ui/global-loading"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "arial"],
  adjustFontFallback: false,
})

export const metadata: Metadata = {
  title: "Jadwal.in",
  description: "Platform terpadu untuk mengelola jadwal perkuliahan",
  icons: {
    icon: "/logo jadwal in.svg",
    shortcut: "/logo jadwal in.svg",
    apple: "/logo jadwal in.svg",
  },
  openGraph: {
    title: "Jadwal.in",
    description: "Platform terpadu untuk mengelola jadwal perkuliahan",
    images: ["/logo jadwal in.svg"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <Providers>
          <Suspense fallback={<GlobalLoading />}>
            {children}
            <Analytics />
          </Suspense>
        </Providers>
      </body>
    </html>
  )
}
