"use client"

import { useState } from "react"
import { useSessionStore } from "@/stores/session.store"
import { useRemindersStore } from "@/stores/reminders.store"
import type { Reminder } from "@/data/schema"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ReminderForm } from "@/components/reminders/ReminderForm"
import { ReminderList } from "@/components/reminders/ReminderList"
import { Plus, ArrowLeft, Bell, AlertTriangle, CheckCircle, Trash2 } from "lucide-react"
import { confirmAction, showSuccess } from "@/lib/alerts"

export default function RemindersPage() {
  const { session } = useSessionStore()
  const { getActiveReminders, getUpcomingReminders, getOverdueReminders, clearUserReminders } = useRemindersStore()
  const [showForm, setShowForm] = useState(false)
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)

  if (!session) return null

  const activeReminders = getActiveReminders(session.id)
  const upcomingReminders = getUpcomingReminders(session.id, 24)
  const overdueReminders = getOverdueReminders(session.id)

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder)
    setShowForm(true)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingReminder(null)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingReminder(null)
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

  if (showForm) {
    return (
      <div className="space-y-4 md:space-y-6 px-2 md:px-4">
        <div className="flex items-center space-x-3 md:space-x-4">
          <Button variant="ghost" onClick={handleCancel} className="text-xs md:text-sm">
            <ArrowLeft className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">
              {editingReminder ? "Edit Pengingat" : "Tambah Pengingat"}
            </h1>
            <p className="text-gray-900 dark:text-gray-100 font-bold text-sm md:text-base">
              {editingReminder ? "Perbarui informasi pengingat" : "Buat pengingat baru untuk tugas atau kegiatan"}
            </p>
          </div>
        </div>

        <ReminderForm
          userId={session.id}
          reminder={editingReminder || undefined}
          onSuccess={handleFormSuccess}
          onCancel={handleCancel}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6 px-2 md:px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">Pengingat</h1>
          <p className="text-gray-900 dark:text-gray-100 font-bold text-sm md:text-base">Kelola pengingat tugas dan kegiatan Anda</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleClearAll} disabled={activeReminders.length === 0} className="text-xs md:text-sm">
            <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
            Hapus Semua
          </Button>
          <Button onClick={() => setShowForm(true)} className="text-xs md:text-sm">
            <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
            Tambah Pengingat
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <Card className="card-interactive border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 md:px-6 pt-4 md:pt-6">
            <CardTitle className="text-xs md:text-sm font-medium">Total Aktif</CardTitle>
            <Bell className="h-4 w-4 md:h-5 md:w-5 text-blue-500 group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
            <div className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">{activeReminders.length}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Pengingat aktif</p>
          </CardContent>
        </Card>

        <Card className="card-interactive border-2 border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 transition-all group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 md:px-6 pt-4 md:pt-6">
            <CardTitle className="text-xs md:text-sm font-medium">Mendatang (24j)</CardTitle>
            <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-500 group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
            <div className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">{upcomingReminders.length}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Dalam 24 jam</p>
          </CardContent>
        </Card>

        <Card className="card-interactive border-2 border-red-200 dark:border-red-800 hover:border-red-400 dark:hover:border-red-600 transition-all group col-span-2 md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 md:px-6 pt-4 md:pt-6">
            <CardTitle className="text-xs md:text-sm font-medium">Terlambat</CardTitle>
            <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-red-500 group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
            <div className="text-2xl md:text-3xl font-bold text-red-600 dark:text-red-400">{overdueReminders.length}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Perlu perhatian</p>
          </CardContent>
        </Card>
      </div>

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
