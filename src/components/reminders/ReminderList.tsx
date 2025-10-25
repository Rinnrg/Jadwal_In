"use client"

import { useState } from "react"
import { useRemindersStore } from "@/stores/reminders.store"
import { useSubjectsStore } from "@/stores/subjects.store"
import type { Reminder } from "@/data/schema"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Edit, Trash2, Search, Clock, AlertTriangle, CheckCircle, Mail } from "lucide-react"
import { confirmAction, showSuccess } from "@/lib/alerts"
import { fmtDateTime, nowUTC } from "@/lib/time"
import { cn } from "@/lib/utils"
import { ActivityLogger } from "@/lib/activity-logger"

interface ReminderListProps {
  userId: string
  onEdit?: (reminder: Reminder) => void
  onClearAll?: () => void
  hasReminders?: boolean
}

export function ReminderList({ userId, onEdit, onClearAll, hasReminders = false }: ReminderListProps) {
  const { getRemindersByUser, deleteReminder, toggleReminder } = useRemindersStore()
  const { subjects } = useSubjectsStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "overdue" | "upcoming">("all")

  const allReminders = getRemindersByUser(userId)
  const now = nowUTC()

  const filteredReminders = allReminders.filter((reminder) => {
    // Search filter
    const matchesSearch =
      reminder.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reminder.relatedSubjectId &&
        subjects.some(
          (s) =>
            s.id === reminder.relatedSubjectId &&
            (s.kode.toLowerCase().includes(searchTerm.toLowerCase()) ||
              s.nama.toLowerCase().includes(searchTerm.toLowerCase())),
        ))

    // Status filter
    let matchesStatus = true
    switch (filterStatus) {
      case "active":
        matchesStatus = reminder.isActive
        break
      case "inactive":
        matchesStatus = !reminder.isActive
        break
      case "overdue":
        matchesStatus = reminder.isActive && reminder.dueUTC < now
        break
      case "upcoming":
        matchesStatus = reminder.isActive && reminder.dueUTC > now
        break
    }

    return matchesSearch && matchesStatus
  })

  const handleDelete = async (reminder: Reminder) => {
    const confirmed = await confirmAction(
      "Hapus Pengingat",
      `Apakah Anda yakin ingin menghapus pengingat "${reminder.title}"?`,
      "Ya, Hapus",
    )

    if (confirmed) {
      deleteReminder(reminder.id)
      showSuccess("Pengingat berhasil dihapus")
      
      // Log activity
      ActivityLogger.reminderDeleted(userId, reminder.title)
    }
  }

  const handleToggle = (reminder: Reminder) => {
    toggleReminder(reminder.id)
    showSuccess(`Pengingat ${reminder.isActive ? "dinonaktifkan" : "diaktifkan"}`)
    
    // Log activity for completion
    if (!reminder.isActive) {
      ActivityLogger.reminderCompleted(userId, reminder.title)
    }
  }

  const getReminderStatus = (reminder: Reminder) => {
    if (!reminder.isActive) return { type: "inactive", label: "Nonaktif", icon: Clock }
    if (reminder.dueUTC < now) return { type: "overdue", label: "Terlambat", icon: AlertTriangle }
    return { type: "upcoming", label: "Mendatang", icon: CheckCircle }
  }

  const getStatusBadge = (reminder: Reminder) => {
    const status = getReminderStatus(reminder)
    const variants = {
      inactive: "secondary",
      overdue: "destructive",
      upcoming: "default",
    } as const

    return (
      <Badge variant={variants[status.type as keyof typeof variants]} className="flex items-center gap-1">
        <status.icon className="h-3 w-3" />
        {status.label}
      </Badge>
    )
  }

  const getRelatedSubject = (subjectId?: string) => {
    return subjectId ? subjects.find((s) => s.id === subjectId) : null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Daftar Pengingat</CardTitle>
            <CardDescription>Kelola pengingat tugas dan kegiatan Anda</CardDescription>
          </div>
          {onClearAll && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onClearAll} 
              disabled={!hasReminders}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Hapus Semua
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Cari pengingat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("all")}
              >
                Semua
              </Button>
              <Button
                variant={filterStatus === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("active")}
              >
                Aktif
              </Button>
              <Button
                variant={filterStatus === "overdue" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("overdue")}
              >
                Terlambat
              </Button>
              <Button
                variant={filterStatus === "upcoming" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("upcoming")}
              >
                Mendatang
              </Button>
            </div>
          </div>

          {/* Reminders List */}
          {filteredReminders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm || filterStatus !== "all"
                  ? "Tidak ada pengingat yang sesuai dengan filter"
                  : "Belum ada pengingat. Tambahkan pengingat pertama Anda."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredReminders.map((reminder) => {
                const relatedSubject = getRelatedSubject(reminder.relatedSubjectId)
                const isOverdue = reminder.isActive && reminder.dueUTC < now

                return (
                  <div
                    key={reminder.id}
                    className={cn(
                      "p-3 border rounded-lg transition-colors",
                      isOverdue && "border-destructive/50 bg-destructive/5",
                      !reminder.isActive && "opacity-60",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-sm truncate">
                            {reminder.title}
                          </h3>
                          {getStatusBadge(reminder)}
                          {reminder.sendEmail && (
                            <Mail className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>

                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p>
                            <Clock className="h-3 w-3 inline mr-1" />
                            {fmtDateTime(reminder.dueUTC)}
                          </p>
                          {relatedSubject && (
                            <p className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full border" />
                              {relatedSubject.kode} - {relatedSubject.nama}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={reminder.isActive}
                          onCheckedChange={() => handleToggle(reminder)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit?.(reminder)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(reminder)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
