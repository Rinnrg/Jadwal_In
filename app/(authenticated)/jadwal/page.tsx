"use client"

import { useState, useEffect, useMemo } from "react"
import { Calendar, Clock, MapPin, User, Plus, Search, Grid3x3, List, Download, Upload, Printer, Trash2, Command, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSessionStore } from "@/stores/session.store"
import { useScheduleStore } from "@/stores/schedule.store"
import { useSubjectsStore } from "@/stores/subjects.store"
import { useKrsStore } from "@/stores/krs.store"
import { useUIStore } from "@/stores/ui.store"
import { useRemindersStore } from "@/stores/reminders.store"
import { useNotificationStore } from "@/stores/notification.store"
import { useProfileStore } from "@/stores/profile.store"
import { useUsersStore } from "@/stores/users.store"
import type { ScheduleEvent } from "@/data/schema"
import { ScheduleGrid } from "@/components/schedule/ScheduleGrid"
import { ScheduleForm } from "@/components/schedule/ScheduleForm"
import { NextUpCard } from "@/components/schedule/NextUpCard"
import { confirmAction, showSuccess, showError } from "@/lib/alerts"
import { exportICS, parseICS } from "@/lib/ics"
import { toUTC } from "@/lib/time"
import { ActivityLogger } from "@/lib/activity-logger"

type ViewMode = "simple" | "weekly"

export default function JadwalPage() {
  const { session } = useSessionStore()
  const { getEventsByUser, clearUserSchedule, addEvent, deleteEvent } = useScheduleStore()
  const { subjects, fetchSubjects, isLoading: isLoadingSubjects } = useSubjectsStore()
  const { getKrsByUser } = useKrsStore()
  const { showNowLine, setShowNowLine } = useUIStore()
  const { addReminder } = useRemindersStore()
  const { markAsRead } = useNotificationStore()
  const { getProfile, profiles } = useProfileStore()
  const { getUserById, fetchUsers, users, isLoading: isLoadingUsers } = useUsersStore()

  const [viewMode, setViewMode] = useState<ViewMode>("simple")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDay, setSelectedDay] = useState("all")
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null)
  const [defaultDay, setDefaultDay] = useState<number | undefined>()
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)

  // Fetch subjects and users on mount to ensure data is available
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchSubjects(),
          fetchUsers()
        ])
      } catch (error) {
        console.error('Failed to load data:', error)
      }
    }
    
    // Only fetch if data is empty (to avoid unnecessary re-fetches)
    if (subjects.length === 0 || users.length === 0) {
      loadData()
    }
  }, []) // Empty dependency array - only run once on mount

  const userEvents = session ? getEventsByUser(session.id) : []
  const userKrsItems = session ? getKrsByUser(session.id) : []
  
  // For dosen/kaprodi: check if they have taught subjects with status "aktif"
  const taughtSubjects = session && (session.role === "dosen" || session.role === "kaprodi")
    ? subjects.filter(s => s.status === "aktif" && s.pengampuIds?.includes(session.id))
    : []
    
  const hasKrsItems = session?.role === "mahasiswa" 
    ? userKrsItems.length > 0 
    : taughtSubjects.length > 0

  // Mark jadwal notification as read when user opens this page
  useEffect(() => {
    if (session?.id) {
      markAsRead("jadwal", session.id)
    }
  }, [session?.id, markAsRead])

  const handleAddEvent = (day?: number, hour?: number) => {
    if (!hasKrsItems) {
      if (session?.role === "mahasiswa") {
        showError("Anda belum mengambil mata kuliah di KRS. Silakan ambil KRS terlebih dahulu.")
      } else {
        showError("Anda belum mengampu mata kuliah yang aktif. Silakan tambahkan mata kuliah di halaman Mata Kuliah.")
      }
      return
    }
    setDefaultDay(day)
    setEditingEvent(null)
    setShowForm(true)
  }

  const handleEditEvent = (event: ScheduleEvent) => {
    setEditingEvent(event)
    setDefaultDay(undefined)
    setShowForm(true)
  }

  const handleDeleteEvent = async (event: ScheduleEvent) => {
    const subject = subjects.find((s) => s.id === event.subjectId)
    const subjectName = subject?.nama || "Event ini"
    
    const confirmed = await confirmAction(
      "Hapus Jadwal",
      `Apakah Anda yakin ingin menghapus jadwal "${subjectName}"?`,
      "Ya, Hapus",
    )

    if (confirmed) {
      deleteEvent(event.id)
      showSuccess("Jadwal berhasil dihapus")
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingEvent(null)
    setDefaultDay(undefined)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingEvent(null)
    setDefaultDay(undefined)
  }

  const handleExportICS = () => {
    if (userEvents.length === 0) {
      showError("Tidak ada jadwal untuk diekspor")
      return
    }

    if (!session) {
      showError("Session tidak ditemukan")
      return
    }

    exportICS(userEvents, subjects, `jadwal-${session.name.replace(/\s+/g, "-")}.ics`)
    showSuccess("Jadwal berhasil diekspor ke file ICS")
  }

  const handleImportICS = async () => {
    if (!importFile) return

    if (!session) {
      showError("Session tidak ditemukan")
      return
    }

    try {
      const content = await importFile.text()
      const parsedEvents = parseICS(content)

      if (parsedEvents.length === 0) {
        showError("Tidak ada jadwal valid yang ditemukan dalam file")
        return
      }

      const confirmed = await confirmAction(
        "Import Jadwal",
        `Ditemukan ${parsedEvents.length} jadwal. Lanjutkan import?`,
        "Ya, Import",
      )

      if (confirmed) {
        parsedEvents.forEach((eventData) => {
          if (eventData.dayOfWeek !== undefined && eventData.startUTC !== undefined && eventData.endUTC !== undefined) {
            addEvent({
              userId: session.id,
              dayOfWeek: eventData.dayOfWeek,
              startUTC: eventData.startUTC,
              endUTC: eventData.endUTC,
              location: eventData.location,
              joinUrl: eventData.joinUrl,
              notes: eventData.notes,
              color: "#3b82f6",
            })
          }
        })

        showSuccess(`${parsedEvents.length} jadwal berhasil diimpor`)
        setShowImportDialog(false)
        setImportFile(null)
      }
    } catch (error) {
      showError("Gagal membaca file ICS")
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleClearSchedule = async () => {
    if (!session) {
      showError("Session tidak ditemukan")
      return
    }

    const confirmed = await confirmAction(
      "Hapus Semua Jadwal",
      "Apakah Anda yakin ingin menghapus semua jadwal? Tindakan ini tidak dapat dibatalkan.",
      "Ya, Hapus Semua",
    )

    if (confirmed) {
      clearUserSchedule(session.id)
      showSuccess("Semua jadwal berhasil dihapus")
    }
  }

  const handleAddToReminder = (event: ScheduleEvent) => {
    if (!session) {
      showError("Session tidak ditemukan")
      return
    }

    const subject = subjects.find((s) => s.id === event.subjectId)
    const eventName = subject ? `${subject.kode} - ${subject.nama}` : "Jadwal Pribadi"
    
    // Calculate next occurrence of this day
    const now = new Date()
    const currentDay = now.getDay()
    const targetDay = event.dayOfWeek
    
    let daysUntil = targetDay - currentDay
    if (daysUntil <= 0) daysUntil += 7
    
    const nextDate = new Date(now)
    nextDate.setDate(now.getDate() + daysUntil)
    
    // Set time from event's startUTC (which is milliseconds in day)
    const startHour = Math.floor(event.startUTC / (1000 * 60 * 60)) % 24
    const startMinute = Math.floor((event.startUTC % (1000 * 60 * 60)) / (1000 * 60))
    nextDate.setHours(startHour, startMinute, 0, 0)
    
    // Convert to UTC timestamp
    const dueUTC = toUTC(nextDate)
    
    // Add reminder
    addReminder({
      userId: session.id,
      title: eventName,
      dueUTC,
      relatedSubjectId: event.subjectId,
      isActive: true,
      sendEmail: false,
    })
    
    showSuccess(`Pengingat untuk "${eventName}" berhasil ditambahkan`)
    
    // Log activity
    ActivityLogger.reminderCreated(session.id, eventName)
  }

  const handleKeyboardShortcut = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault()
      handleAddEvent()
    }
  }

  useEffect(() => {
    document.addEventListener("keydown", handleKeyboardShortcut)
    return () => document.removeEventListener("keydown", handleKeyboardShortcut)
  }, [])

  const days = ["all", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
  const dayMap: Record<string, number> = {
    "Minggu": 0,
    "Senin": 1,
    "Selasa": 2,
    "Rabu": 3,
    "Kamis": 4,
    "Jumat": 5,
    "Sabtu": 6,
  }

  const eventsWithDetails = useMemo(() => {
    console.log('Rebuilding events with details. Total events:', userEvents.length)
    console.log('Total subjects:', subjects.length)
    console.log('Total users:', users.length)
    
    return userEvents.map((event) => {
      const subject = subjects.find((s) => s.id === event.subjectId)
      const startTime = new Date(event.startUTC)
      const endTime = new Date(event.endUTC)
      const dayName = Object.keys(dayMap).find(key => dayMap[key] === event.dayOfWeek) || "Unknown"
      
      // Debug logging
      if (event.subjectId && !subject) {
        console.warn('Subject not found for event:', event.subjectId, event)
      }
      
      // Get lecturer names from pengampuIds
      let lecturerNames = "-"
      if (subject && subject.pengampuIds && subject.pengampuIds.length > 0) {
        const lecturers = subject.pengampuIds
          .map(id => getUserById(id))
          .filter((user): user is NonNullable<typeof user> => Boolean(user))
          .map(user => user.name || "")
          .filter(name => name.length > 0)
        
        if (lecturers.length > 0) {
          lecturerNames = lecturers.join(", ")
        }
      }
      
      // Get location from event or fallback to subject's slotRuang
      const location = event.location || subject?.slotRuang || "-"
      
      return {
        ...event,
        subject: subject?.nama || "Mata Kuliah Tidak Diketahui",
        lecturer: lecturerNames,
        code: subject?.kode || "-",
        time: `${startTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} - ${endTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`,
        day: dayName,
        room: location,
        type: "lecture" as const, // Default type
      }
    })
  }, [userEvents, subjects, users, getUserById])

  const filteredSchedule = eventsWithDetails.filter((item) => {
    const matchesSearch =
      item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.lecturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDay = selectedDay === "all" || item.day === selectedDay
    return matchesSearch && matchesDay
  })

  const getTypeColor = (type: string) => {
    switch (type) {
      case "lecture":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
      case "lab":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
      case "exam":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "lecture":
        return "Kuliah"
      case "lab":
        return "Praktikum"
      case "exam":
        return "Ujian"
      default:
        return type
    }
  }

  if (!session) return null

  if (showForm) {
    return (
      <div className="space-y-4 md:space-y-6 animate-fade-in">
        <div className="animate-slide-up">
          <ScheduleForm
            userId={session.id}
            event={editingEvent || undefined}
            defaultDay={defaultDay}
            onSuccess={handleFormSuccess}
            onCancel={handleCancel}
            viewMode={viewMode}
          />
        </div>
      </div>
    )
  }

  // Simple View Component
  const renderSimpleView = () => (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
          <Input
            placeholder="Cari mata kuliah atau dosen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 md:pl-10 text-xs md:text-sm h-9 md:h-10"
          />
        </div>
        <div className="flex gap-1.5 md:gap-2 flex-wrap">
          {days.map((day) => (
            <Button
              key={day}
              variant={selectedDay === day ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDay(day)}
              className="capitalize text-xs md:text-sm h-8 md:h-9 px-2 md:px-3"
            >
              {day === "all" ? "Semua" : day}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:gap-4 max-h-[calc(100vh-400px)] md:max-h-none overflow-y-auto">
        {filteredSchedule.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 md:py-12 px-4">
              <Calendar className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground mb-3 md:mb-4" />
              <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2">Tidak ada jadwal ditemukan</h3>
              <p className="text-muted-foreground text-center text-xs md:text-sm">
                {searchTerm || selectedDay !== "all"
                  ? "Coba ubah filter pencarian Anda"
                  : "Belum ada jadwal yang ditambahkan"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredSchedule.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow card-interactive">
              <CardContent className="p-3 md:p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 md:gap-4">
                  <div className="flex-1 space-y-2 md:space-y-3 w-full min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm md:text-base lg:text-lg font-semibold text-foreground truncate">{item.subject}</h3>
                        <p className="text-xs md:text-sm text-muted-foreground font-medium">{item.code}</p>
                      </div>
                      <Badge className={`${getTypeColor(item.type)} text-xs w-fit shrink-0`}>{getTypeLabel(item.type)}</Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3 text-xs md:text-sm">
                      <div className="flex items-center gap-1.5 md:gap-2 text-foreground min-w-0">
                        <User className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium truncate">{item.lecturer}</span>
                      </div>
                      <div className="flex items-center gap-1.5 md:gap-2 text-foreground min-w-0">
                        <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium truncate">
                          {item.day}, {item.time}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 md:gap-2 text-foreground min-w-0">
                        <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium truncate">{item.room}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleAddToReminder(item)}
                      className="h-8 md:h-9 px-2 md:px-3"
                      title="Tambah ke Pengingat"
                    >
                      <Bell className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEditEvent(item)} className="flex-1 sm:flex-none text-xs md:text-sm h-8 md:h-9">
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteEvent(item)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 md:h-9 px-2 md:px-3"
                    >
                      <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )

  // Weekly View Component
  const renderWeeklyView = () => (
    <div className="grid gap-4 md:gap-8 lg:grid-cols-4 animate-fade-in w-full">
      <div className="lg:col-span-3 w-full min-w-0">
        <Card className="glass-effect border-2 border-primary/20 card-interactive overflow-hidden w-full">
          <CardHeader className="px-3 md:px-6 py-3 md:py-6">
            <CardTitle className="flex items-center space-x-2 text-lg md:text-2xl">
              <Calendar className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              <span>Jadwal Mingguan</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 w-full">
            <ScheduleGrid userId={session.id} onEditEvent={handleEditEvent} onAddEvent={handleAddEvent} />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4 md:space-y-6 w-full min-w-0">
        <div className="animate-slide-in-right">
          <NextUpCard userId={session.id} />
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-slide-up px-2 md:px-0">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight truncate">
            Jadwal Kuliah
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Kelola jadwal mingguan Anda dengan mudah
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 animate-slide-in-right flex-shrink-0">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border-2 border-primary/20 bg-background p-1">
            <Button
              variant={viewMode === "simple" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("simple")}
              className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm flex-1 sm:flex-none h-8 md:h-9"
            >
              <List className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden xs:inline">Simpel</span>
            </Button>
            <Button
              variant={viewMode === "weekly" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("weekly")}
              className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm flex-1 sm:flex-none h-8 md:h-9"
            >
              <Grid3x3 className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden xs:inline">Mingguan</span>
            </Button>
          </div>

          <Button
            variant="default"
            onClick={() => handleAddEvent()}
            className="h-8 md:h-9 text-xs md:text-sm px-3 md:px-4"
          >
            <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
            <span className="hidden xs:inline">Tambah </span>Jadwal
          </Button>
        </div>
      </div>

      {/* KRS Info Alert */}
      {!hasKrsItems && (
        <div className="px-2 md:px-0">
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
                    ? "Untuk menambahkan jadwal mata kuliah, silakan ambil KRS terlebih dahulu di halaman KRS. Anda masih dapat menambahkan jadwal pribadi."
                    : "Untuk menambahkan jadwal mengajar, silakan tambahkan mata kuliah yang Anda ampu dengan status aktif di halaman Mata Kuliah."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Mode Content */}
      {viewMode === "simple" ? renderSimpleView() : renderWeeklyView()}

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="glass-effect border-2 border-primary/20">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5 text-primary" />
              <span>Import Jadwal ICS</span>
            </DialogTitle>
            <DialogDescription>Pilih file ICS untuk mengimpor jadwal dari aplikasi kalender lain</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="ics-file" className="text-base font-medium">
                File ICS
              </Label>
              <Input
                id="ics-file"
                type="file"
                accept=".ics,.ical"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="h-12 border-2 border-primary/20 focus:border-primary/50"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowImportDialog(false)} className="button-modern">
                Batal
              </Button>
              <Button onClick={handleImportICS} disabled={!importFile} className="button-modern">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }

          body {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }

          .schedule-grid {
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  )
}
