"use client"

import { useState, useEffect } from "react"
import { useSessionStore } from "@/stores/session.store"
import { useRemindersStore } from "@/stores/reminders.store"
import { useKrsStore } from "@/stores/krs.store"
import { useSubjectsStore } from "@/stores/subjects.store"
import { useNotificationStore } from "@/stores/notification.store"
import type { Reminder } from "@/data/schema"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ReminderForm } from "@/components/reminders/ReminderForm"
import { ReminderList } from "@/components/reminders/ReminderList"
import { Bell, AlertTriangle, Trash2, Plus } from "lucide-react"
import { confirmAction, showSuccess } from "@/lib/alerts"

export default function RemindersPage() {
  const { session } = useSessionStore()
  const { getActiveReminders, getUpcomingReminders, getOverdueReminders, clearUserReminders } = useRemindersStore()
  const { getKrsByUser } = useKrsStore()
  const { subjects } = useSubjectsStore()
  const { clearBadge } = useNotificationStore()
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  // Clear reminder notification badge when user opens this page
  useEffect(() => {
    if (session?.id) {
      clearBadge("reminder", session.id)
    }
  }, [session?.id, clearBadge])

  if (!session) return null

  const activeReminders = getActiveReminders(session.id)
  const upcomingReminders = getUpcomingReminders(session.id, 24)
  const overdueReminders = getOverdueReminders(session.id)
  const userKrsItems = getKrsByUser(session.id)
  
  // For dosen/kaprodi: check if they have taught subjects with status "aktif"
  const taughtSubjects = session && (session.role === "dosen" || session.role === "kaprodi")
    ? subjects.filter(s => s.status === "aktif" && s.pengampuIds?.includes(session.id))
    : []
    
  const hasKrsItems = session?.role === "mahasiswa" 
    ? userKrsItems.length > 0 
    : taughtSubjects.length > 0

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder)
    setIsFormOpen(true)
  }

  const handleFormSuccess = () => {
    setEditingReminder(null)
    setIsFormOpen(false)
  }

  const handleCancel = () => {
    setEditingReminder(null)
    setIsFormOpen(false)
  }

  const handleClearAll = async () => {
    const confirmed = await confirmAction(
      "Hapus Semua Pengingat",
      "Apakah Anda yakin ingin menghapus semua pengingat? Tindakan ini tidak dapat dibatalkan.",
      "Ya, Hapus Semua",
    )

    if (confirmed) {
      clearUserReminders(session.id)
      showSuccess("Semua pengingat berhasil dihapus")
    }
  }

  return (
    <div className="space-y-4 md:space-y-6 px-2 md:px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">Pengingat</h1>
          <p className="text-muted-foreground text-sm md:text-base">Kelola pengingat tugas dan kegiatan Anda</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsFormOpen(true)} className="text-xs md:text-sm w-fit">
            <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
            Tambah Pengingat
          </Button>
          <Button variant="outline" onClick={handleClearAll} disabled={activeReminders.length === 0} className="text-xs md:text-sm w-fit">
            <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
            Hapus Semua
          </Button>
        </div>
      </div>

      {/* Dialog Form */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingReminder ? "Edit Pengingat" : "Tambah Pengingat"}</DialogTitle>
          </DialogHeader>
          <ReminderForm
            userId={session.id}
            reminder={editingReminder || undefined}
            onSuccess={handleFormSuccess}
            onCancel={handleCancel}
          />
        </DialogContent>
      </Dialog>

      {/* KRS Info Alert */}
      {!hasKrsItems && (
        <div className="p-3 md:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg animate-slide-down">
          <div className="flex items-start gap-2 md:gap-3">
            <svg className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {session?.role === "mahasiswa" ? "Ambil KRS Terlebih Dahulu" : "Tambah Mata Kuliah Terlebih Dahulu"}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                {session?.role === "mahasiswa" 
                  ? "Untuk membuat pengingat berdasarkan jadwal mata kuliah, silakan ambil KRS dan buat jadwal terlebih dahulu. Anda masih dapat membuat pengingat manual."
                  : "Untuk membuat pengingat berdasarkan jadwal mengajar, silakan tambahkan mata kuliah yang Anda ampu dengan status aktif di halaman Mata Kuliah. Anda masih dapat membuat pengingat manual."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Reminders */}
      {upcomingReminders.length > 0 && (
        <Card className="border-2 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20 transition-all hover:shadow-md">
          <CardHeader className="px-3 md:px-6 pt-3 md:pt-6 pb-2 md:pb-4">
            <CardTitle className="text-yellow-800 dark:text-yellow-200 flex items-center gap-2 text-base md:text-lg font-bold">
              <Bell className="h-4 w-4 md:h-5 md:w-5" />
              Pengingat Mendatang (24 Jam)
            </CardTitle>
            <CardDescription className="text-yellow-700 dark:text-yellow-300 text-xs md:text-sm font-medium mt-1">
              {upcomingReminders.length} pengingat dalam 24 jam ke depan
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-3 md:pb-6 max-h-[240px] overflow-y-auto">
            <div className="space-y-1.5 md:space-y-2">
              {upcomingReminders.slice(0, 5).map((reminder) => (
                <div key={reminder.id} className="flex items-center justify-between p-2 md:p-2.5 bg-white/50 dark:bg-white/5 rounded-md border border-yellow-200/50 dark:border-yellow-700/50">
                  <div className="flex-1 min-w-0 mr-2">
                    <p className="font-semibold text-gray-800 dark:text-gray-200 text-xs md:text-sm truncate">{reminder.title}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">{new Date(reminder.dueUTC).toLocaleString("id-ID")}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(reminder)} className="text-xs h-7 px-2 md:h-8 md:px-3 hover:bg-yellow-100 dark:hover:bg-yellow-900/40">
                    Edit
                  </Button>
                </div>
              ))}
              {upcomingReminders.length > 5 && (
                <p className="text-xs md:text-sm text-muted-foreground font-medium text-center pt-1">
                  +{upcomingReminders.length - 5} pengingat lainnya
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overdue Reminders */}
      {overdueReminders.length > 0 && (
        <Card className="border-2 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 transition-all hover:shadow-md">
          <CardHeader className="px-3 md:px-6 pt-3 md:pt-6 pb-2 md:pb-4">
            <CardTitle className="text-red-700 dark:text-red-300 flex items-center gap-2 text-base md:text-lg font-bold">
              <AlertTriangle className="h-4 w-4 md:h-5 md:w-5" />
              Pengingat Terlambat
            </CardTitle>
            <CardDescription className="text-red-600 dark:text-red-400 text-xs md:text-sm font-medium mt-1">
              {overdueReminders.length} pengingat yang sudah melewati waktu
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-3 md:pb-6 max-h-[240px] overflow-y-auto">
            <div className="space-y-1.5 md:space-y-2">
              {overdueReminders.slice(0, 5).map((reminder) => (
                <div key={reminder.id} className="flex items-center justify-between p-2 md:p-2.5 bg-white/50 dark:bg-white/5 rounded-md border border-red-200/50 dark:border-red-700/50">
                  <div className="flex-1 min-w-0 mr-2">
                    <p className="font-semibold text-gray-800 dark:text-gray-200 text-xs md:text-sm truncate">{reminder.title}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">{new Date(reminder.dueUTC).toLocaleString("id-ID")}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(reminder)} className="text-xs h-7 px-2 md:h-8 md:px-3 hover:bg-red-100 dark:hover:bg-red-900/40">
                    Edit
                  </Button>
                </div>
              ))}
              {overdueReminders.length > 5 && (
                <p className="text-xs md:text-sm text-muted-foreground font-medium text-center pt-1">
                  +{overdueReminders.length - 5} pengingat lainnya
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <ReminderList userId={session.id} onEdit={handleEdit} />
    </div>
  )
}
