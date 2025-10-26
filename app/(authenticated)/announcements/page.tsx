"use client"

import { useState, useEffect } from "react"
import { useSessionStore } from "@/stores/session.store"
import { useAnnouncementStore } from "@/stores/announcement.store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Megaphone, Plus, Edit, Trash2, FileUp, Image as ImageIcon, FileText, Users, Bell, CheckCircle, AlertCircle } from "lucide-react"
import { showSuccess, showError, confirmAction } from "@/lib/alerts"
import { formatDistanceToNow } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import type { Announcement } from "@/stores/announcement.store"

export default function AnnouncementsPage() {
  const { session } = useSessionStore()
  const { announcements, fetchAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, isLoading } =
    useAnnouncementStore()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
    fileUrl: "",
    targetRoles: [] as string[],
    isActive: true,
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingPdf, setUploadingPdf] = useState(false)

  useEffect(() => {
    fetchAnnouncements()
  }, [fetchAnnouncements])

  // Check if user is super admin
  if (!session || session.role !== "super_admin") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center text-destructive">Akses Ditolak</CardTitle>
            <CardDescription className="text-center">
              Hanya Super Admin yang dapat mengakses halaman ini.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.description) {
      showError("Judul dan keterangan harus diisi")
      return
    }

    if (formData.targetRoles.length === 0) {
      showError("Pilih minimal satu target penerima")
      return
    }

    try {
      const data = {
        ...formData,
        imageUrl: formData.imageUrl || null,
        fileUrl: formData.fileUrl || null,
        createdById: session.id,
      }

      if (editingAnnouncement) {
        await updateAnnouncement(editingAnnouncement.id, data)
        showSuccess("Pengumuman berhasil diperbarui")
      } else {
        await createAnnouncement(data)
        showSuccess("Pengumuman berhasil dibuat")
      }

      handleCloseForm()
    } catch (error) {
      showError("Gagal menyimpan pengumuman")
    }
  }

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
    setFormData({
      title: announcement.title,
      description: announcement.description,
      imageUrl: announcement.imageUrl || "",
      fileUrl: announcement.fileUrl || "",
      targetRoles: announcement.targetRoles,
      isActive: announcement.isActive,
    })
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirmAction(
      "Hapus Pengumuman",
      "Apakah Anda yakin ingin menghapus pengumuman ini?",
      "Ya, Hapus"
    )

    if (confirmed) {
      try {
        await deleteAnnouncement(id)
        showSuccess("Pengumuman berhasil dihapus")
      } catch (error) {
        showError("Gagal menghapus pengumuman")
      }
    }
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingAnnouncement(null)
    setFormData({
      title: "",
      description: "",
      imageUrl: "",
      fileUrl: "",
      targetRoles: [],
      isActive: true,
    })
    setImageFile(null)
    setPdfFile(null)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError("File harus berupa gambar (JPG, PNG, dll)")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError("Ukuran gambar maksimal 5MB")
      return
    }

    setImageFile(file)
    setUploadingImage(true)

    try {
      console.log('[Upload] Starting image upload:', file.name, file.size)
      
      // Create FormData for upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'image')

      // Upload to your API endpoint
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
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
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showError("Ukuran PDF maksimal 10MB")
      return
    }

    setPdfFile(file)
    setUploadingPdf(true)

    try {
      console.log('[Upload] Starting PDF upload:', file.name, file.size)
      
      // Create FormData for upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'pdf')

      // Upload to your API endpoint
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
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
    } finally {
      setUploadingPdf(false)
    }
  }

  const toggleTargetRole = (role: string) => {
    setFormData((prev) => ({
      ...prev,
      targetRoles: prev.targetRoles.includes(role)
        ? prev.targetRoles.filter((r) => r !== role)
        : [...prev.targetRoles, role],
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Megaphone className="h-8 w-8" />
            Kelola Pengumuman
          </h1>
          <p className="text-muted-foreground mt-1">
            Buat dan kelola pengumuman untuk mahasiswa dan dosen
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Buat Pengumuman
        </Button>
      </div>

      {/* Announcements Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengumuman</CardTitle>
          <CardDescription>Total {announcements.length} pengumuman</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Memuat...</div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Belum ada pengumuman</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Media</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dibuat</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcements.map((announcement) => (
                  <TableRow key={announcement.id}>
                    <TableCell className="font-medium">{announcement.title}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {announcement.targetRoles.map((role) => (
                          <Badge key={role} variant="secondary" className="text-xs">
                            {role === "mahasiswa" ? "Mahasiswa" : role === "dosen" ? "Dosen" : "Kaprodi"}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {announcement.imageUrl && (
                          <Badge variant="outline" className="text-xs">
                            <ImageIcon className="h-3 w-3 mr-1" />
                            Gambar
                          </Badge>
                        )}
                        {announcement.fileUrl && (
                          <Badge variant="outline" className="text-xs">
                            <FileText className="h-3 w-3 mr-1" />
                            PDF
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={announcement.isActive ? "default" : "secondary"}>
                        {announcement.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(announcement.createdAt), {
                        addSuffix: true,
                        locale: idLocale,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(announcement)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(announcement.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => !open && handleCloseForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" showCloseButton={false}>
          <DialogHeader className="space-y-2 pb-3 border-b sticky top-0 bg-background z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Megaphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg">
                  {editingAnnouncement ? "Edit Pengumuman" : "Buat Pengumuman Baru"}
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  Pengumuman akan ditampilkan sebagai pop-up saat user membuka aplikasi
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-3">
            {/* Title */}
            <div className="space-y-1.5">
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
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-sm font-semibold flex items-center gap-1.5">
                <span className="text-destructive">*</span>
                Keterangan
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Tulis keterangan pengumuman di sini..."
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Media Uploads Section */}
            <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-dashed">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <FileUp className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Media Pendukung (Opsional)</span>
              </div>

              {/* Image Upload */}
              <div className="space-y-1.5">
                <Label htmlFor="imageUpload" className="text-xs flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-blue-500" />
                  Gambar (JPG/PNG)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="imageUpload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="flex-1 h-9 text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                  {uploadingImage && (
                    <div className="flex items-center gap-1.5 text-xs text-primary">
                      <FileUp className="h-3.5 w-3.5 animate-spin" />
                      <span>Uploading...</span>
                    </div>
                  )}
                </div>
                {imageFile && (
                  <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
                    <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                    <p className="text-xs text-green-700 dark:text-green-400 flex-1">
                      {imageFile.name} ({(imageFile.size / 1024).toFixed(2)} KB)
                    </p>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Format: JPG/PNG. Maksimal 5MB
                </p>
              </div>

              {/* PDF Upload */}
              <div className="space-y-1.5">
                <Label htmlFor="pdfUpload" className="text-xs flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-red-500" />
                  Dokumen PDF
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="pdfUpload"
                    type="file"
                    accept="application/pdf"
                    onChange={handlePdfUpload}
                    disabled={uploadingPdf}
                    className="flex-1 h-9 text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                  {uploadingPdf && (
                    <div className="flex items-center gap-1.5 text-xs text-primary">
                      <FileUp className="h-3.5 w-3.5 animate-spin" />
                      <span>Uploading...</span>
                    </div>
                  )}
                </div>
                {pdfFile && (
                  <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
                    <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                    <p className="text-xs text-green-700 dark:text-green-400 flex-1">
                      {pdfFile.name} ({(pdfFile.size / 1024).toFixed(2)} KB)
                    </p>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Format: PDF. Maksimal 10MB
                </p>
              </div>
            </div>

            {/* Target Roles */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-1.5">
                <span className="text-destructive">*</span>
                <Users className="h-3.5 w-3.5" />
                Target Penerima
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {["mahasiswa", "dosen", "kaprodi"].map((role) => (
                  <div
                    key={role}
                    className={`flex items-center space-x-2 p-2.5 border rounded-lg cursor-pointer transition-all ${
                      formData.targetRoles.includes(role)
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => toggleTargetRole(role)}
                  >
                    <Checkbox
                      id={role}
                      checked={formData.targetRoles.includes(role)}
                      onCheckedChange={() => {}}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Label htmlFor={role} className="font-normal cursor-pointer text-xs flex-1">
                      {role === "mahasiswa" ? "Mahasiswa" : role === "dosen" ? "Dosen" : "Kaprodi"}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-background rounded-md">
                  <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div>
                  <Label htmlFor="isActive" className="cursor-pointer font-medium text-xs">
                    Status Pengumuman
                  </Label>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Akan muncul saat user login
                  </p>
                </div>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-3 border-t sticky bottom-0 bg-background">
              <Button type="button" variant="outline" onClick={handleCloseForm} className="min-w-20 h-9 text-sm">
                Batal
              </Button>
              <Button type="submit" className="min-w-28 h-9 text-sm">
                {editingAnnouncement ? (
                  <>
                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                    Simpan
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Buat
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
