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
    <div className="min-h-screen pb-6">
      {/* Header Section */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b mb-4 md:mb-6 -mx-2 md:-mx-4 px-4 md:px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Pengingat
              </h1>
              <p className="text-muted-foreground text-sm md:text-base mt-1">
                Kelola pengingat tugas dan kegiatan Anda
              </p>
            </div>
            <div className="flex gap-2 md:gap-3">
              <Button 
                onClick={() => setIsFormOpen(true)} 
                size="lg"
                className="flex-1 sm:flex-none shadow-md hover:shadow-lg transition-all"
              >
                <Plus className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                <span className="hidden sm:inline">Tambah Pengingat</span>
                <span className="sm:hidden">Tambah</span>
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={handleClearAll} 
                disabled={activeReminders.length === 0}
                className="flex-1 sm:flex-none"
              >
                <Trash2 className="h-4 w-4 md:h-5 md:w-5 sm:mr-2" />
                <span className="hidden sm:inline">Hapus Semua</span>
              </Button>
            </div>
          </div>

          {/* Stats Cards - Desktop only */}
          <div className="hidden md:grid md:grid-cols-3 gap-4 mt-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Aktif</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">{activeReminders.length}</p>
                </div>
                <Bell className="h-10 w-10 text-blue-500/30" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-950/40 dark:to-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Mendatang (24h)</p>
                  <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{upcomingReminders.length}</p>
                </div>
                <Bell className="h-10 w-10 text-yellow-500/30 animate-pulse" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/40 dark:to-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Terlambat</p>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{overdueReminders.length}</p>
                </div>
                <AlertTriangle className="h-10 w-10 text-red-500/30" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-2 md:px-4 space-y-4 md:space-y-6">
        {/* Dialog Form */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl md:text-2xl">
                {editingReminder ? "Edit Pengingat" : "Tambah Pengingat Baru"}
              </DialogTitle>
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
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-l-4 border-blue-500 dark:border-blue-400 rounded-lg p-4 md:p-5 shadow-sm animate-slide-down">
            <div className="flex items-start gap-3 md:gap-4">
              <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <svg className="h-5 w-5 md:h-6 md:w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm md:text-base font-bold text-blue-900 dark:text-blue-100">
                  {session?.role === "mahasiswa" ? "Ambil KRS Terlebih Dahulu" : "Tambah Mata Kuliah Terlebih Dahulu"}
                </h3>
                <p className="text-xs md:text-sm text-blue-800/90 dark:text-blue-200/90 mt-1.5 leading-relaxed">
                  {session?.role === "mahasiswa" 
                    ? "Untuk membuat pengingat berdasarkan jadwal mata kuliah, silakan ambil KRS dan buat jadwal terlebih dahulu. Anda masih dapat membuat pengingat manual."
                    : "Untuk membuat pengingat berdasarkan jadwal mengajar, silakan tambahkan mata kuliah yang Anda ampu dengan status aktif di halaman Mata Kuliah. Anda masih dapat membuat pengingat manual."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Alerts Grid - Mobile Stats + Upcoming/Overdue */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Mobile Stats */}
          <div className="md:hidden grid grid-cols-3 gap-2">
            <div className="bg-blue-50 dark:bg-blue-950/40 rounded-lg p-3 border border-blue-200 dark:border-blue-800 text-center">
              <Bell className="h-5 w-5 text-blue-500 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Aktif</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{activeReminders.length}</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-950/40 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800 text-center">
              <Bell className="h-5 w-5 text-yellow-500 mx-auto mb-1 animate-pulse" />
              <p className="text-xs text-muted-foreground">24h</p>
              <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{upcomingReminders.length}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-950/40 rounded-lg p-3 border border-red-200 dark:border-red-800 text-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Lewat</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">{overdueReminders.length}</p>
            </div>
          </div>

          {/* Upcoming Reminders */}
          {upcomingReminders.length > 0 && (
            <Card className="border-l-4 border-l-yellow-500 shadow-sm hover:shadow-md transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="text-yellow-800 dark:text-yellow-200 flex items-center gap-2 text-base md:text-lg">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <Bell className="h-4 w-4 md:h-5 md:w-5 animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold">Pengingat Mendatang</div>
                    <div className="text-xs md:text-sm font-normal text-yellow-700 dark:text-yellow-300">
                      {upcomingReminders.length} dalam 24 jam
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {upcomingReminders.slice(0, 5).map((reminder) => (
                    <div 
                      key={reminder.id} 
                      className="group p-3 bg-yellow-50/50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200/50 dark:border-yellow-800/50 hover:border-yellow-300 dark:hover:border-yellow-700 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm md:text-base text-gray-900 dark:text-gray-100 truncate">
                            {reminder.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(reminder.dueUTC).toLocaleString("id-ID", {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEdit(reminder)} 
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs h-8 px-3"
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                  {upcomingReminders.length > 5 && (
                    <p className="text-xs text-center text-muted-foreground py-2">
                      +{upcomingReminders.length - 5} pengingat lainnya
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Overdue Reminders */}
          {overdueReminders.length > 0 && (
            <Card className="border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="text-red-700 dark:text-red-300 flex items-center gap-2 text-base md:text-lg">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <AlertTriangle className="h-4 w-4 md:h-5 md:w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold">Pengingat Terlambat</div>
                    <div className="text-xs md:text-sm font-normal text-red-600 dark:text-red-400">
                      {overdueReminders.length} melewati waktu
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {overdueReminders.slice(0, 5).map((reminder) => (
                    <div 
                      key={reminder.id} 
                      className="group p-3 bg-red-50/50 dark:bg-red-950/20 rounded-lg border border-red-200/50 dark:border-red-800/50 hover:border-red-300 dark:hover:border-red-700 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm md:text-base text-gray-900 dark:text-gray-100 truncate">
                            {reminder.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(reminder.dueUTC).toLocaleString("id-ID", {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEdit(reminder)} 
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs h-8 px-3"
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                  {overdueReminders.length > 5 && (
                    <p className="text-xs text-center text-muted-foreground py-2">
                      +{overdueReminders.length - 5} pengingat lainnya
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* All Reminders List */}
        <ReminderList userId={session.id} onEdit={handleEdit} />
      </div>
    </div>
  )
}
