"use client"

import { useState, useEffect } from "react"
import { useSessionStore } from "@/stores/session.store"
import { useAnnouncementStore } from "@/stores/announcement.store"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AnnouncementForm, AnnouncementTable } from "@/components/announcements"
import { Megaphone, Plus, ArrowLeft } from "lucide-react"
import type { Announcement } from "@/stores/announcement.store"

export default function AnnouncementsPage() {
  const { session } = useSessionStore()
  const { announcements, fetchAnnouncements, isLoading } = useAnnouncementStore()

  const [showForm, setShowForm] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)

  useEffect(() => {
    fetchAnnouncements()
  }, [fetchAnnouncements])

  // Check if user is super admin
  if (!session || session.role !== "super_admin") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <Megaphone className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-destructive">Akses Ditolak</h2>
          <p className="text-muted-foreground">Hanya Super Admin yang dapat mengakses halaman ini.</p>
        </Card>
      </div>
    )
  }

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
    setShowForm(true)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingAnnouncement(null)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingAnnouncement(null)
  }

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Megaphone className="h-8 w-8" />
              {editingAnnouncement ? "Edit Pengumuman" : "Buat Pengumuman"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {editingAnnouncement 
                ? "Perbarui informasi pengumuman" 
                : "Buat pengumuman baru untuk mahasiswa dan dosen"}
            </p>
          </div>
        </div>

        <div className="animate-slide-up">
          <AnnouncementForm 
            announcement={editingAnnouncement || undefined}
            onSuccess={handleFormSuccess}
            onCancel={handleCancel}
          />
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-spin">
            <Megaphone className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Memuat Data</h2>
          <p className="text-muted-foreground">Mohon tunggu sebentar...</p>
        </Card>
      </div>
    )
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
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Buat Pengumuman
        </Button>
      </div>

      {/* Announcements Table */}
      <AnnouncementTable announcements={announcements} onEdit={handleEdit} />
    </div>
  )
}
