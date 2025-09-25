"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Upload } from "lucide-react"
import { showSuccess, showError } from "@/lib/alerts"

interface AvatarUploaderProps {
  currentAvatar?: string
  userName: string
  onAvatarChange: (avatarUrl: string) => void
  disabled?: boolean
}

export function AvatarUploader({ currentAvatar, userName, onAvatarChange, disabled }: AvatarUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showError("Harap pilih file gambar")
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showError("Ukuran file maksimal 2MB")
      return
    }

    // Create preview URL
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setPreviewUrl(result)
      onAvatarChange(result)
      showSuccess("Avatar berhasil diperbarui")
    }
    reader.readAsDataURL(file)
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const displayAvatar = previewUrl || currentAvatar

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative group">
        <Avatar className="h-24 w-24 hover:scale-110 transition-transform duration-300 shadow-lg hover:shadow-xl">
          <AvatarImage src={displayAvatar || "/placeholder.svg"} alt={userName} />
          <AvatarFallback className="text-lg">
            {userName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {!disabled && (
          <Button
            size="sm"
            variant="secondary"
            className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 hover:scale-125 transition-all duration-300 shadow-lg hover:shadow-xl animate-bounce-subtle"
            onClick={handleUploadClick}
          >
            <Camera className="h-4 w-4" />
          </Button>
        )}
        {!disabled && (
          <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <Upload className="h-6 w-6 text-white" />
          </div>
        )}
      </div>

      {!disabled && (
        <Button
          variant="outline"
          onClick={handleUploadClick}
          className="flex items-center gap-2 bg-transparent hover:scale-105 transition-transform duration-200"
        >
          <Upload className="h-4 w-4" />
          Ubah Avatar
        </Button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      <p className="text-xs text-muted-foreground text-center">
        Format: JPG, PNG, GIF. Maksimal 2MB.
        <br />
        Avatar disimpan secara lokal di browser Anda.
      </p>
    </div>
  )
}
