"use client"

import type React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { DotLottieReact } from '@lottiefiles/dotlottie-react'

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
        role="status"
        aria-label="Loading"
      />
      <div
        className={cn(
          "absolute inset-0 animate-pulse rounded-full border-2 border-blue-200 dark:border-blue-800 opacity-30",
          sizeClasses[size],
        )}
      />
    </div>
  )
}

interface PageLoadingProps {
  message?: string
  className?: string
}

export function PageLoading({ message = "Memuat...", className }: PageLoadingProps) {
  return (
    <div className={cn("min-h-screen flex items-center justify-center bg-background", className)}>
      <div className="text-center space-y-6 p-8">
        {/* Rocket Animation */}
        <div className="flex justify-center">
          <DotLottieReact
            src="/lottie/Businessman flies up with rocket.json"
            autoplay
            loop
            style={{ width: '300px', height: '300px' }}
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
