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
import { Megaphone, Plus, Edit, Trash2, FileUp, Image as ImageIcon, FileText, Users } from "lucide-react"
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
      <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAnnouncement ? "Edit Pengumuman" : "Buat Pengumuman Baru"}
            </DialogTitle>
            <DialogDescription>
              Pengumuman akan ditampilkan sebagai pop-up saat user membuka aplikasi
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Judul Pengumuman <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Contoh: Pengumuman Libur Semester"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Keterangan <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Tulis keterangan pengumuman di sini..."
                rows={5}
                required
              />
            </div>

            {/* Image URL */}
            <div className="space-y-2">
              <Label htmlFor="imageUrl" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Gambar (JPG/PNG - Opsional)
              </Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
                type="url"
              />
              <p className="text-xs text-muted-foreground">
                Upload gambar (JPG/PNG) ke layanan seperti Imgur atau Google Drive, lalu paste URL-nya di sini
              </p>
            </div>

            {/* File URL */}
            <div className="space-y-2">
              <Label htmlFor="fileUrl" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Dokumen PDF (Opsional)
              </Label>
              <Input
                id="fileUrl"
                value={formData.fileUrl}
                onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                placeholder="https://example.com/document.pdf"
                type="url"
              />
              <p className="text-xs text-muted-foreground">
                Upload file PDF ke Google Drive atau Dropbox, lalu paste URL-nya di sini
              </p>
            </div>

            {/* Target Roles */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Target Penerima <span className="text-destructive">*</span>
              </Label>
              <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="mahasiswa"
                    checked={formData.targetRoles.includes("mahasiswa")}
                    onCheckedChange={() => toggleTargetRole("mahasiswa")}
                  />
                  <Label htmlFor="mahasiswa" className="font-normal cursor-pointer flex-1">
                    Mahasiswa
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="dosen"
                    checked={formData.targetRoles.includes("dosen")}
                    onCheckedChange={() => toggleTargetRole("dosen")}
                  />
                  <Label htmlFor="dosen" className="font-normal cursor-pointer flex-1">
                    Dosen
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="kaprodi"
                    checked={formData.targetRoles.includes("kaprodi")}
                    onCheckedChange={() => toggleTargetRole("kaprodi")}
                  />
                  <Label htmlFor="kaprodi" className="font-normal cursor-pointer flex-1">
                    Kaprodi
                  </Label>
                </div>
              </div>
              {formData.targetRoles.length === 0 && (
                <p className="text-xs text-destructive">Pilih minimal satu target penerima</p>
              )}
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-3 p-4 border rounded-lg bg-muted/50">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive" className="cursor-pointer flex-1">
                <span className="font-medium">Aktifkan Pengumuman</span>
                <p className="text-xs text-muted-foreground font-normal mt-1">
                  Pengumuman akan muncul saat user login
                </p>
              </Label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleCloseForm}>
                Batal
              </Button>
              <Button type="submit" disabled={formData.targetRoles.length === 0}>
                {editingAnnouncement ? "Simpan Perubahan" : "Buat Pengumuman"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
