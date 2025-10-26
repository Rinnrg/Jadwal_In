"use client"

import { useState, useEffect } from "react"
import { useSessionStore } from "@/stores/session.store"
import { useAnnouncementStore } from "@/stores/announcement.store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { FileUp, Image as ImageIcon, FileText, Users, Bell, CheckCircle, AlertCircle, Save, X } from "lucide-react"
import { showSuccess, showError } from "@/lib/alerts"
import type { Announcement } from "@/stores/announcement.store"

interface AnnouncementFormProps {
  announcement?: Announcement
  onSuccess: () => void
  onCancel: () => void
}

export function AnnouncementForm({ announcement, onSuccess, onCancel }: AnnouncementFormProps) {
  const { session } = useSessionStore()
  const { createAnnouncement, updateAnnouncement } = useAnnouncementStore()

  const [formData, setFormData] = useState({
    title: announcement?.title || "",
    description: announcement?.description || "",
    imageUrl: announcement?.imageUrl || "",
    fileUrl: announcement?.fileUrl || "",
    targetRoles: announcement?.targetRoles || [] as string[],
    isActive: announcement?.isActive ?? true,
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log('[AnnouncementForm] Submitting form with data:', formData)

    if (!formData.title || !formData.description) {
      showError("Judul dan keterangan harus diisi")
      return
    }

    if (formData.targetRoles.length === 0) {
      showError("Pilih minimal satu target penerima")
      return
    }

    if (!session) {
      showError("Sesi tidak ditemukan. Silakan login kembali.")
      return
    }

    setIsSubmitting(true)

    try {
      const data = {
        ...formData,
        imageUrl: formData.imageUrl || null,
        fileUrl: formData.fileUrl || null,
        createdById: session.id,
      }

      console.log('[AnnouncementForm] Sending data to API:', data)

      if (announcement) {
        await updateAnnouncement(announcement.id, data)
        showSuccess("Pengumuman berhasil diperbarui")
      } else {
        await createAnnouncement(data)
        showSuccess("Pengumuman berhasil dibuat")
      }

      onSuccess()
    } catch (error) {
      console.error('[AnnouncementForm] Submit error:', error)
      showError(error instanceof Error ? error.message : "Gagal menyimpan pengumuman")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError("File harus berupa gambar (JPG, PNG, dll)")
      e.target.value = ""
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError("Ukuran gambar maksimal 5MB")
      e.target.value = ""
      return
    }

    setImageFile(file)
    setUploadingImage(true)

    try {
      console.log('[Upload] Starting image upload:', file.name, file.size)
      
      // Create FormData for upload
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('type', 'image')

      // Upload to your API endpoint
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      console.log('[Upload] Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('[Upload] Error response:', errorData)
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await response.json()
      console.log('[Upload] Success:', data)
      
      setFormData(prev => ({ ...prev, imageUrl: data.url }))
      showSuccess("Gambar berhasil diupload")
    } catch (error) {
      console.error('[Upload] Exception:', error)
      showError(error instanceof Error ? error.message : "Gagal mengupload gambar")
      setImageFile(null)
      e.target.value = ""
    } finally {
      setUploadingImage(false)
    }
  }

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (file.type !== 'application/pdf') {
      showError("File harus berupa PDF")
      e.target.value = ""
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showError("Ukuran PDF maksimal 10MB")
      e.target.value = ""
      return
    }

    setPdfFile(file)
    setUploadingPdf(true)

    try {
      console.log('[Upload] Starting PDF upload:', file.name, file.size)
      
      // Create FormData for upload
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('type', 'pdf')

      // Upload to your API endpoint
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      console.log('[Upload] Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('[Upload] Error response:', errorData)
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await response.json()
      console.log('[Upload] Success:', data)
      
      setFormData(prev => ({ ...prev, fileUrl: data.url }))
      showSuccess("PDF berhasil diupload")
    } catch (error) {
      console.error('[Upload] Exception:', error)
      showError(error instanceof Error ? error.message : "Gagal mengupload PDF")
      setPdfFile(null)
      e.target.value = ""
    } finally {
      setUploadingPdf(false)
    }
  }

  const toggleTargetRole = (role: string) => {
    setFormData((prev) => {
      const newTargetRoles = prev.targetRoles.includes(role)
        ? prev.targetRoles.filter((r) => r !== role)
        : [...prev.targetRoles, role]
      
      return {
        ...prev,
        targetRoles: newTargetRoles,
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informasi Pengumuman</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-semibold flex items-center gap-1.5">
              <span className="text-destructive">*</span>
              Judul Pengumuman
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Contoh: Pengumuman Libur Semester"
              className="h-10"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold flex items-center gap-1.5">
              <span className="text-destructive">*</span>
              Keterangan
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tulis keterangan pengumuman di sini..."
              rows={6}
              className="resize-none"
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Media Uploads Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5 text-muted-foreground" />
            Media Pendukung (Opsional)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="imageUpload" className="text-sm flex items-center gap-1.5">
              <ImageIcon className="h-4 w-4 text-blue-500" />
              Gambar (JPG/PNG)
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="imageUpload"
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="flex-1 h-10 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              {uploadingImage && (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <FileUp className="h-4 w-4 animate-spin" />
                  <span>Uploading...</span>
                </div>
              )}
            </div>
            {formData.imageUrl && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-green-700 dark:text-green-400 truncate">
                    {imageFile?.name || formData.imageUrl.split('/').pop()}
                  </p>
                  {imageFile && (
                    <p className="text-xs text-green-600 dark:text-green-500">
                      {(imageFile.size / 1024).toFixed(2)} KB
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, imageUrl: "" }))
                    setImageFile(null)
                    const input = document.getElementById("imageUpload") as HTMLInputElement
                    if (input) input.value = ""
                  }}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Format: JPG/PNG. Maksimal 5MB
            </p>
          </div>

          {/* PDF Upload */}
          <div className="space-y-2">
            <Label htmlFor="pdfUpload" className="text-sm flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-red-500" />
              Dokumen PDF
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="pdfUpload"
                type="file"
                accept="application/pdf"
                onChange={handlePdfUpload}
                disabled={uploadingPdf}
                className="flex-1 h-10 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              {uploadingPdf && (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <FileUp className="h-4 w-4 animate-spin" />
                  <span>Uploading...</span>
                </div>
              )}
            </div>
            {formData.fileUrl && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-green-700 dark:text-green-400 truncate">
                    {pdfFile?.name || formData.fileUrl.split('/').pop()}
                  </p>
                  {pdfFile && (
                    <p className="text-xs text-green-600 dark:text-green-500">
                      {(pdfFile.size / 1024).toFixed(2)} KB
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, fileUrl: "" }))
                    setPdfFile(null)
                    const input = document.getElementById("pdfUpload") as HTMLInputElement
                    if (input) input.value = ""
                  }}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Format: PDF. Maksimal 10MB
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Target Roles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Target Penerima
            <span className="text-destructive">*</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {["mahasiswa", "dosen", "kaprodi"].map((role) => (
              <div
                key={role}
                className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.targetRoles.includes(role)
                    ? "bg-primary/10 border-primary"
                    : "hover:bg-muted/50 border-border"
                }`}
                onClick={(e) => {
                  // Prevent double toggle if clicking on checkbox or label
                  const target = e.target as HTMLElement
                  if (target.closest('button[role="checkbox"]') || target.closest('label')) {
                    return
                  }
                  toggleTargetRole(role)
                }}
              >
                <Checkbox
                  id={`role-${role}`}
                  checked={formData.targetRoles.includes(role)}
                  onCheckedChange={() => toggleTargetRole(role)}
                  onClick={(e) => e.stopPropagation()}
                />
                <Label
                  htmlFor={`role-${role}`}
                  className="font-normal text-sm flex-1 select-none cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  {role === "mahasiswa" ? "Mahasiswa" : role === "dosen" ? "Dosen" : "Kaprodi"}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Status Pengumuman
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-background rounded-md">
                <Bell className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <Label htmlFor="isActive" className="cursor-pointer font-medium text-sm">
                  {formData.isActive ? "Aktif" : "Nonaktif"}
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formData.isActive 
                    ? "Pengumuman akan muncul saat user login" 
                    : "Pengumuman tidak akan ditampilkan"}
                </p>
              </div>
            </div>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end sticky bottom-0 bg-background pt-4 pb-2 border-t">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isSubmitting}
          className="min-w-24"
        >
          <X className="h-4 w-4 mr-2" />
          Batal
        </Button>
        <Button 
          type="submit"
          disabled={isSubmitting}
          className="min-w-32"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? "Menyimpan..." : announcement ? "Simpan Perubahan" : "Buat Pengumuman"}
        </Button>
      </div>
    </form>
  )
}
