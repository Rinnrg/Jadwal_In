"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, MapPin, User, Plus, Search, Grid3x3, List, ArrowLeft, Download, Upload, Printer, Trash2, Command, Users, Sparkles, TrendingUp, Activity, Settings } from "lucide-react"
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
import type { ScheduleEvent } from "@/data/schema"
import { ScheduleGrid } from "@/components/schedule/ScheduleGrid"
import { ScheduleForm } from "@/components/schedule/ScheduleForm"
import { NextUpCard } from "@/components/schedule/NextUpCard"
import { Legend } from "@/components/schedule/Legend"
import { confirmAction, showSuccess, showError } from "@/lib/alerts"
import { exportICS, parseICS } from "@/lib/ics"

type ViewMode = "simple" | "weekly"

export default function JadwalPage() {
  const { session } = useSessionStore()
  const { getEventsByUser, clearUserSchedule, addEvent, deleteEvent } = useScheduleStore()
  const { subjects } = useSubjectsStore()
  const { getKrsByUser } = useKrsStore()
  const { showNowLine, showLegend, setShowNowLine, setShowLegend } = useUIStore()

  const [viewMode, setViewMode] = useState<ViewMode>("simple")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDay, setSelectedDay] = useState("all")
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null)
  const [defaultDay, setDefaultDay] = useState<number | undefined>()
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)

  const userEvents = session ? getEventsByUser(session.id) : []
  const userKrsItems = session ? getKrsByUser(session.id) : []
  const hasKrsItems = userKrsItems.length > 0

  const handleAddEvent = (day?: number, hour?: number) => {
    if (!hasKrsItems) {
      showError("Anda belum mengambil mata kuliah di KRS. Silakan ambil KRS terlebih dahulu.")
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

  const eventsWithDetails = userEvents.map((event) => {
    const subject = subjects.find((s) => s.id === event.subjectId)
    const startTime = new Date(event.startUTC)
    const endTime = new Date(event.endUTC)
    const dayName = Object.keys(dayMap).find(key => dayMap[key] === event.dayOfWeek) || "Unknown"
    
    return {
      ...event,
      subject: subject?.nama || "Mata Kuliah Tidak Diketahui",
      lecturer: "-", // Will be filled from pengampu data later if needed
      code: subject?.kode || "-",
      time: `${startTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} - ${endTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`,
      day: dayName,
      room: event.location || "-",
      type: "lecture" as const, // Default type
    }
  })

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

  const todayEvents = userEvents.filter((event) => {
    const today = new Date().getDay()
    return event.dayOfWeek === today
  })

  const weeklyStats = {
    totalEvents: userEvents.length,
    todayEvents: todayEvents.length,
    uniqueSubjects: new Set(userEvents.map((e) => e.subjectId)).size,
    totalHours: userEvents.reduce((acc, event) => {
      const start = new Date(event.startUTC)
      const end = new Date(event.endUTC)
      return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    }, 0),
  }

  if (!session) return null

  if (showForm) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center space-x-6 animate-slide-in-left">
          <Button variant="ghost" onClick={handleCancel} className="button-modern">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              {editingEvent ? "Edit Jadwal" : "Tambah Jadwal"}
            </h1>
            <p className="text-muted-foreground text-lg mt-2">
              {editingEvent ? "Perbarui informasi jadwal" : "Tambahkan jadwal baru ke kalender"}
            </p>
          </div>
        </div>

        <div className="animate-slide-up">
          <ScheduleForm
            userId={session.id}
            event={editingEvent || undefined}
            defaultDay={defaultDay}
            onSuccess={handleFormSuccess}
            onCancel={handleCancel}
          />
        </div>
      </div>
    )
  }

  // Simple View Component
  const renderSimpleView = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari mata kuliah atau dosen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {days.map((day) => (
            <Button
              key={day}
              variant={selectedDay === day ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDay(day)}
              className="capitalize"
            >
              {day === "all" ? "Semua" : day}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {filteredSchedule.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Tidak ada jadwal ditemukan</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm || selectedDay !== "all"
                  ? "Coba ubah filter pencarian Anda"
                  : "Belum ada jadwal yang ditambahkan"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredSchedule.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow card-interactive">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{item.subject}</h3>
                        <p className="text-sm text-muted-foreground font-medium">{item.code}</p>
                      </div>
                      <Badge className={getTypeColor(item.type)}>{getTypeLabel(item.type)}</Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-foreground">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{item.lecturer}</span>
                      </div>
                      <div className="flex items-center gap-2 text-foreground">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {item.day}, {item.time}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-foreground">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{item.room}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditEvent(item)}>
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteEvent(item)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
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
    <div className="grid gap-8 lg:grid-cols-4 animate-fade-in">
      <div className="lg:col-span-3">
        <Card className="glass-effect border-2 border-primary/20 card-interactive overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3 text-2xl">
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
              <span>Jadwal Mingguan</span>
            </CardTitle>
            <CardDescription className="text-base">Klik pada slot waktu untuk menambah jadwal baru</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScheduleGrid userId={session.id} onEditEvent={handleEditEvent} onAddEvent={handleAddEvent} />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="animate-slide-in-right">
          <NextUpCard userId={session.id} />
        </div>
        {showLegend && (
          <div className="animate-slide-in-right">
            <Legend userId={session.id} />
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-100 animate-float">
            Jadwal Kuliah
          </h1>
          <p className="text-gray-900 dark:text-gray-100 text-xl mt-2 animate-slide-in-left font-bold">
            Kelola jadwal mingguan Anda dengan mudah
          </p>
        </div>

        <div className="flex items-center space-x-3 animate-slide-in-right">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border-2 border-primary/20 bg-background p-1">
            <Button
              variant={viewMode === "simple" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("simple")}
              className="flex items-center gap-2"
            >
              <List className="h-4 w-4" />
              Simpel
            </Button>
            <Button
              variant={viewMode === "weekly" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("weekly")}
              className="flex items-center gap-2"
            >
              <Grid3x3 className="h-4 w-4" />
              Mingguan
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={() => handleAddEvent()}
            className="button-modern border-2 border-primary/20 hover:border-primary/50"
          >
            <Plus className="h-5 w-5 mr-2" />
            Tambah Jadwal
            <kbd className="ml-3 pointer-events-none hidden sm:inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-xs font-medium text-muted-foreground">
              <Command className="h-3 w-3" />K
            </kbd>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="button-modern border-2 border-primary/20 hover:border-primary/50 bg-transparent"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-effect border-2 border-primary/20">
              <DropdownMenuItem onClick={handleExportICS} className="hover:bg-primary/10">
                <Download className="mr-2 h-4 w-4" />
                Export ICS
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowImportDialog(true)} className="hover:bg-primary/10">
                <Upload className="mr-2 h-4 w-4" />
                Import ICS
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handlePrint} className="hover:bg-primary/10">
                <Printer className="mr-2 h-4 w-4" />
                Print
              </DropdownMenuItem>
              {viewMode === "weekly" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowNowLine(!showNowLine)} className="hover:bg-primary/10">
                    {showNowLine ? "Sembunyikan" : "Tampilkan"} Garis Waktu
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowLegend(!showLegend)} className="hover:bg-primary/10">
                    {showLegend ? "Sembunyikan" : "Tampilkan"} Legenda
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleClearSchedule} className="text-destructive hover:bg-destructive/10">
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus Semua
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4 animate-slide-up">
        <Card className="card-interactive border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-bold">Total Jadwal</CardTitle>
            <Calendar className="h-6 w-6 text-blue-500 group-hover:scale-125 transition-transform duration-300" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">{weeklyStats.totalEvents}</div>
            <p className="text-sm text-gray-700 dark:text-gray-300 font-semibold">Jadwal mingguan</p>
            <div className="mt-3 flex items-center text-xs text-blue-600 dark:text-blue-400 font-medium">
              <TrendingUp className="h-3 w-3 mr-1" />
              {weeklyStats.uniqueSubjects} mata kuliah
            </div>
          </CardContent>
        </Card>

        <Card className="card-interactive border-2 border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-bold">Hari Ini</CardTitle>
            <Clock className="h-6 w-6 text-green-500 group-hover:scale-125 transition-transform duration-300" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">{weeklyStats.todayEvents}</div>
            <p className="text-sm text-gray-700 dark:text-gray-300 font-semibold">Kelas hari ini</p>
            <div className="mt-3 flex items-center text-xs text-green-600 dark:text-green-400 font-medium">
              <Activity className="h-3 w-3 mr-1" />
              {weeklyStats.todayEvents > 0 ? "Ada kelas" : "Tidak ada kelas"}
            </div>
          </CardContent>
        </Card>

        <Card className="card-interactive border-2 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-bold">Mata Kuliah</CardTitle>
            <Users className="h-6 w-6 text-purple-500 group-hover:scale-125 transition-transform duration-300" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">{weeklyStats.uniqueSubjects}</div>
            <p className="text-sm text-gray-700 dark:text-gray-300 font-semibold">Mata kuliah aktif</p>
            <div className="mt-3 flex items-center text-xs text-purple-600 dark:text-purple-400 font-medium">
              <Sparkles className="h-3 w-3 mr-1" />
              Semester ini
            </div>
          </CardContent>
        </Card>

        <Card className="card-interactive border-2 border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-600 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-bold">Total Jam</CardTitle>
            <Clock className="h-6 w-6 text-orange-500 group-hover:scale-125 transition-transform duration-300" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">{Math.round(weeklyStats.totalHours)}</div>
            <p className="text-sm text-gray-700 dark:text-gray-300 font-semibold">Jam per minggu</p>
            <div className="mt-3 flex items-center text-xs text-orange-600 dark:text-orange-400 font-medium">
              <TrendingUp className="h-3 w-3 mr-1" />
              {Math.round(weeklyStats.totalHours / 7)} jam/hari
            </div>
          </CardContent>
        </Card>
      </div>

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
