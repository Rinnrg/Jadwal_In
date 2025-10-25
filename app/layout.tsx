import type React from "react"
import type { Metadata } from "next"
import localFont from "next/font/local"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { Providers } from "./providers"
import { GlobalLoading } from "@/components/ui/global-loading"
import "./globals.css"

const montserrat = localFont({
  src: [
    {
      path: "../public/font/Montserrat-Thin.ttf",
      weight: "100",
      style: "normal",
    },
    {
      path: "../public/font/Montserrat-ThinItalic.ttf",
      weight: "100",
      style: "italic",
    },
    {
      path: "../public/font/Montserrat-ExtraLight.ttf",
      weight: "200",
      style: "normal",
    },
    {
      path: "../public/font/Montserrat-ExtraLightItalic.ttf",
      weight: "200",
      style: "italic",
    },
    {
      path: "../public/font/Montserrat-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/font/Montserrat-LightItalic.ttf",
      weight: "300",
      style: "italic",
    },
    {
      path: "../public/font/Montserrat-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/font/Montserrat-Italic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/font/Montserrat-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/font/Montserrat-MediumItalic.ttf",
      weight: "500",
      style: "italic",
    },
    {
      path: "../public/font/Montserrat-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/font/Montserrat-SemiBoldItalic.ttf",
      weight: "600",
      style: "italic",
    },
    {
      path: "../public/font/Montserrat-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/font/Montserrat-BoldItalic.ttf",
      weight: "700",
      style: "italic",
    },
    {
      path: "../public/font/Montserrat-ExtraBold.ttf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../public/font/Montserrat-ExtraBoldItalic.ttf",
      weight: "800",
      style: "italic",
    },
    {
      path: "../public/font/Montserrat-Black.ttf",
      weight: "900",
      style: "normal",
    },
    {
      path: "../public/font/Montserrat-BlackItalic.ttf",
      weight: "900",
      style: "italic",
    },
  ],
  variable: "--font-montserrat",
  display: "swap",
  fallback: ["system-ui", "arial"],
})

export const metadata: Metadata = {
  title: "jadwal_in",
  description: "Platform terpadu untuk mengelola jadwal perkuliahan",
  icons: {
    icon: "/logo jadwal in.svg",
    shortcut: "/logo jadwal in.svg",
    apple: "/logo jadwal in.svg",
  },
  openGraph: {
    title: "jadwal_in",
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
    <html lang="id" suppressHydrationWarning className="overflow-x-hidden w-full">
      <body className={`${montserrat.className} antialiased overflow-x-hidden w-full max-w-full`}>
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
