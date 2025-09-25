"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface ConfirmButtonProps {
  onConfirm: () => Promise<void> | void
  children: React.ReactNode
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  disabled?: boolean
}

export function ConfirmButton({
  onConfirm,
  children,
  variant = "default",
  size = "default",
  className,
  disabled = false,
}: ConfirmButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    if (isLoading || disabled) return

    setIsLoading(true)
    try {
      await onConfirm()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleClick} variant={variant} size={size} className={className} disabled={isLoading || disabled}>
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </Button>
  )
}
