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
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {editingReminder ? "Edit Pengingat" : "Tambah Pengingat"}
            </h1>
            <p className="text-gray-900 dark:text-gray-100 font-bold">
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pengingat</h1>
          <p className="text-gray-900 dark:text-gray-100 font-bold">Kelola pengingat tugas dan kegiatan Anda</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleClearAll} disabled={activeReminders.length === 0}>
            <Trash2 className="h-4 w-4 mr-2" />
            Hapus Semua
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Pengingat
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Aktif</CardTitle>
            <Bell className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{activeReminders.length}</div>
            <p className="text-xs text-gray-700 dark:text-gray-300 font-semibold">Pengingat aktif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mendatang (24j)</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{upcomingReminders.length}</div>
            <p className="text-xs text-gray-700 dark:text-gray-300 font-semibold">Dalam 24 jam</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terlambat</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{overdueReminders.length}</div>
            <p className="text-xs text-gray-700 dark:text-gray-300 font-semibold">Perlu perhatian</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Reminders */}
      {upcomingReminders.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
          <CardHeader>
            <CardTitle className="text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Pengingat Mendatang (24 Jam)
            </CardTitle>
            <CardDescription className="text-yellow-700 dark:text-yellow-300">
              {upcomingReminders.length} pengingat dalam 24 jam ke depan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingReminders.slice(0, 3).map((reminder) => (
                <div key={reminder.id} className="flex items-center justify-between p-2 bg-white/50 rounded-md">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">{reminder.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{new Date(reminder.dueUTC).toLocaleString("id-ID")}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(reminder)}>
                    Edit
                  </Button>
                </div>
              ))}
              {upcomingReminders.length > 3 && (
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium text-center">
                  +{upcomingReminders.length - 3} pengingat lainnya
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overdue Reminders */}
      {overdueReminders.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Pengingat Terlambat
            </CardTitle>
            <CardDescription className="text-destructive/80">
              {overdueReminders.length} pengingat yang sudah melewati waktu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overdueReminders.slice(0, 3).map((reminder) => (
                <div key={reminder.id} className="flex items-center justify-between p-2 bg-white/50 rounded-md">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">{reminder.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{new Date(reminder.dueUTC).toLocaleString("id-ID")}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(reminder)}>
                    Edit
                  </Button>
                </div>
              ))}
              {overdueReminders.length > 3 && (
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium text-center">
                  +{overdueReminders.length - 3} pengingat lainnya
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
