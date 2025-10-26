"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import { getCachedAnimation, preloadAnimation } from '@/src/utils/preload-animations'

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }

  return (
    <div className="relative">
      <div
        className={cn(
          "animate-spin rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-400 border-b-purple-500 border-l-purple-400",
          sizeClasses[size],
          className,
        )}
        style={{ animationDuration: '0.6s' }}
        role="status"
        aria-label="Loading"
      />
      <div
        className={cn(
          "absolute inset-0 animate-pulse rounded-full border-2 border-blue-200 dark:border-blue-800 opacity-30",
          sizeClasses[size],
        )}
        style={{ animationDuration: '1s' }}
      />
    </div>
  )
}

interface PageLoadingProps {
  message?: string
  className?: string
}

export function PageLoading({ message = "Memuat...", className }: PageLoadingProps) {
  // Check cache immediately - instant render
  const cachedData = useMemo(() => getCachedAnimation('/lottie/Businessman flies up with rocket.json'), [])
  const [animationData, setAnimationData] = useState<any>(cachedData)

  useEffect(() => {
    // Load animation jika belum ada di cache
    if (!animationData) {
      preloadAnimation('/lottie/Businessman flies up with rocket.json').then(data => {
        if (data) {
          setAnimationData(data)
        }
      })
    }
  }, [animationData])

  return (
    <div className={cn("min-h-screen flex items-center justify-center bg-background", className)}>
      <div className="text-center space-y-6 p-8">
        {/* Rocket Animation - Always show, no fallback */}
        <div className="flex justify-center">
          <DotLottieReact
            data={animationData}
            autoplay
            loop
            speed={2.0}
            style={{ width: '250px', height: '250px' }}
          />
        </div>

        {/* Loading Text */}
        <div className="space-y-3">
          <p className="text-lg font-medium text-foreground animate-pulse">{message}</p>
        </div>
      </div>
    </div>
  )
}

interface InlineLoadingProps {
  message?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export function InlineLoading({ message, size = "md", className }: InlineLoadingProps) {
  return (
    <div className={cn("flex items-center justify-center gap-3 p-4", className)}>
      <LoadingSpinner size={size} />
      {message && <span className="text-muted-foreground animate-pulse">{message}</span>}
    </div>
  )
}

interface ButtonLoadingProps {
  isLoading: boolean
  children: React.ReactNode
  loadingText?: string
}

export function ButtonLoading({ isLoading, children, loadingText }: ButtonLoadingProps) {
  if (isLoading) {
    return (
      <>
        <LoadingSpinner size="sm" className="mr-2" />
        {loadingText || "Memuat..."}
      </>
    )
  }

  return <>{children}</>
}
