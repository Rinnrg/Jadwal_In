"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Upload, Loader2 } from "lucide-react"
import { showSuccess, showError } from "@/lib/alerts"
import { ImageCropDialog } from "./ImageCropDialog"

interface AvatarUploaderProps {
  currentAvatar?: string
  userName: string
  onAvatarChange: (avatarUrl: string) => void
  disabled?: boolean
}

export function AvatarUploader({ currentAvatar, userName, onAvatarChange, disabled }: AvatarUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [cropDialogOpen, setCropDialogOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset preview when currentAvatar changes
  useEffect(() => {
    setPreviewUrl(null)
  }, [currentAvatar])

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showError("Harap pilih file gambar (JPG, PNG, GIF)")
      return
    }

    // Validate file size (max 5MB for better quality before cropping)
    if (file.size > 5 * 1024 * 1024) {
      showError("Ukuran file maksimal 5MB")
      return
    }

    try {
      // Create image URL for cropping
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setSelectedImage(result)
        setCropDialogOpen(true)
      }
      
      reader.onerror = () => {
        showError("Gagal membaca file. Silakan coba lagi.")
      }
      
      reader.readAsDataURL(file)
    } catch (error) {
      showError("Terjadi kesalahan saat memproses gambar")
    }

    // Reset file input
    event.target.value = ""
  }

  const handleCropComplete = (croppedImage: string) => {
    setPreviewUrl(croppedImage)
    onAvatarChange(croppedImage)
    showSuccess("Foto profil berhasil di-crop dan disimpan!")
    setCropDialogOpen(false)
    setSelectedImage(null)
  }

  const handleUploadClick = () => {
    if (isUploading || disabled) return
    fileInputRef.current?.click()
  }

  const displayAvatar = previewUrl || currentAvatar

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative group">
        <Avatar className={`h-24 w-24 transition-all duration-300 shadow-lg ${
          isUploading ? "opacity-50" : "hover:scale-110 hover:shadow-xl"
        }`}>
          <AvatarImage src={displayAvatar || "/placeholder.svg"} alt={userName} />
          <AvatarFallback className="text-lg">
            {userName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
        )}
        
        {!disabled && !isUploading && (
          <Button
            size="sm"
            variant="secondary"
            className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 hover:scale-125 transition-all duration-300 shadow-lg hover:shadow-xl animate-bounce-subtle"
            onClick={handleUploadClick}
          >
            <Camera className="h-4 w-4" />
          </Button>
        )}
        
        {!disabled && !isUploading && (
          <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <Upload className="h-6 w-6 text-white" />
          </div>
        )}
      </div>

      {!disabled && (
        <Button
          variant="outline"
          onClick={handleUploadClick}
          disabled={isUploading}
          className="flex items-center gap-2 bg-transparent hover:scale-105 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Mengupload...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Ubah Foto Profile
            </>
          )}
        </Button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
        aria-label="Upload avatar image"
      />

      <div className="text-xs text-muted-foreground text-center space-y-1">
        <p>Format: JPG, PNG, GIF. Maksimal 5MB.</p>
        <p className="text-green-600 dark:text-green-400">✓ Avatar tersimpan otomatis di profil Anda</p>
      </div>

      {/* Image Crop Dialog */}
      {selectedImage && (
        <ImageCropDialog
          open={cropDialogOpen}
          onOpenChange={setCropDialogOpen}
          imageSrc={selectedImage}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  )
}
