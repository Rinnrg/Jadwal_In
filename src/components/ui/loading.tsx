"use client"

import type React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

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
    <div className={cn("min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900", className)}>
      <div className="text-center space-y-6 p-8">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-12 h-12 flex items-center justify-center overflow-hidden">
            <Image 
              src="/logo jadwal in.svg" 
              alt="Jadwal.in Logo" 
              width={32} 
              height={32}
              className="w-8 h-8 object-contain"
            />
          </div>
        </div>

        {/* Loading Text */}
        <div className="space-y-3">
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300 animate-pulse">{message}</p>
          
          {/* Progress Dots */}
          <div className="flex justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0ms]" />
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:150ms]" />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-200 dark:bg-blue-900 rounded-full opacity-20 animate-float" />
          <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-purple-200 dark:bg-purple-900 rounded-full opacity-20 animate-float [animation-delay:1s]" />
          <div className="absolute top-1/2 left-3/4 w-20 h-20 bg-blue-300 dark:bg-blue-800 rounded-full opacity-20 animate-float [animation-delay:2s]" />
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
