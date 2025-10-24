"use client"

import type * as React from "react"
import { useState, useEffect } from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

function Avatar({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn("relative flex size-8 shrink-0 overflow-hidden rounded-full", className)}
      {...props}
    />
  )
}

function AvatarImage({ className, src, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  const [hasError, setHasError] = useState(false)
  const [key, setKey] = useState(0)

  // Reset state when src changes
  useEffect(() => {
    setHasError(false)
    setKey(prev => prev + 1)
  }, [src])

  // If there's an error or no src, don't render the image (fallback will show)
  if (hasError || !src) {
    return null
  }

  return (
    <AvatarPrimitive.Image 
      key={key}
      data-slot="avatar-image" 
      className={cn("aspect-square size-full object-cover", className)} 
      src={src}
      onError={(e) => {
        console.error('Avatar image failed to load:', src?.substring(0, 50))
        setHasError(true)
      }}
      onLoad={() => {
        console.log('Avatar image loaded successfully:', src?.substring(0, 50))
      }}
      {...props} 
    />
  )
}

function AvatarFallback({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn("bg-muted flex size-full items-center justify-center rounded-full", className)}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
