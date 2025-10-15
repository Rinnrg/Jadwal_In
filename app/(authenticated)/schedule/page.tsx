"use client"

import { useState, useEffect } from "react"
import { useSessionStore } from "@/stores/session.store"
import { useScheduleStore } from "@/stores/schedule.store"
import { useSubjectsStore } from "@/stores/subjects.store"
import { useUIStore } from "@/stores/ui.store"
import type { ScheduleEvent } from "@/data/schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScheduleGrid } from "@/components/schedule/ScheduleGrid"
import { ScheduleForm } from "@/components/schedule/ScheduleForm"
import { NextUpCard } from "@/components/schedule/NextUpCard"
import { Legend } from "@/components/schedule/Legend"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  ArrowLeft,
  Download,
  Upload,
  Printer,
  Trash2,
  Command,
  Calendar,
  Clock,
  Users,
  Sparkles,
  TrendingUp,
  Activity,
  Settings,
} from "lucide-react"
import { confirmAction, showSuccess, showError } from "@/lib/alerts"
import { exportICS, parseICS } from "@/lib/ics"

export default function SchedulePage() {
  const { session } = useSessionStore()
  const { getEventsByUser, clearUserSchedule, addEvent } = useScheduleStore()
  const { subjects } = useSubjectsStore()
  const { showNowLine, showLegend, setShowNowLine, setShowLegend } = useUIStore()

  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null)
  const [defaultDay, setDefaultDay] = useState<number | undefined>()
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)

  const handleAddEvent = (day?: number, hour?: number) => {
    setDefaultDay(day)
    setEditingEvent(null)
    setShowForm(true)
  }

  const handleEditEvent = (event: ScheduleEvent) => {
    setEditingEvent(event)
    setDefaultDay(undefined)
    setShowForm(true)
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

  const userEvents = session ? getEventsByUser(session.id) : []

  useEffect(() => {
    document.addEventListener("keydown", handleKeyboardShortcut)
    return () => document.removeEventListener("keydown", handleKeyboardShortcut)
  }, [])

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
            <h1 className="text-4xl font-bold tracking-tight gradient-primary bg-clip-text text-transparent">
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

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-5xl font-bold tracking-tight gradient-primary bg-clip-text text-transparent animate-float">
            Jadwal Kuliah
          </h1>
          <p className="text-muted-foreground text-xl mt-2 animate-slide-in-left" style={{ animationDelay: "0.1s" }}>
            Kelola jadwal mingguan Anda dengan mudah
          </p>
        </div>

        <div className="flex items-center space-x-3 animate-slide-in-right">
          <Button
            variant="outline"
            onClick={() => handleAddEvent()}
            className="button-modern border-2 border-primary/20 hover:border-primary/50"
          >
            <Plus className="h-5 w-5 mr-2" />
            Tambah Jadwal
            <kbd className="ml-3 pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-xs font-medium text-muted-foreground">
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
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowNowLine(!showNowLine)} className="hover:bg-primary/10">
                {showNowLine ? "Sembunyikan" : "Tampilkan"} Garis Waktu
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowLegend(!showLegend)} className="hover:bg-primary/10">
                {showLegend ? "Sembunyikan" : "Tampilkan"} Legenda
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleClearSchedule} className="text-destructive hover:bg-destructive/10">
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus Semua
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
        <Card className="card-interactive border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-bold">Total Jadwal</CardTitle>
            <Calendar className="h-6 w-6 text-blue-500 group-hover:scale-125 transition-transform duration-300" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-600 mb-2">{weeklyStats.totalEvents}</div>
            <p className="text-sm text-muted-foreground">Jadwal mingguan</p>
            <div className="mt-3 flex items-center text-xs text-blue-600">
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
            <div className="text-4xl font-bold text-green-600 mb-2">{weeklyStats.todayEvents}</div>
            <p className="text-sm text-muted-foreground">Kelas hari ini</p>
            <div className="mt-3 flex items-center text-xs text-green-600">
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
            <div className="text-4xl font-bold text-purple-600 mb-2">{weeklyStats.uniqueSubjects}</div>
            <p className="text-sm text-muted-foreground">Mata kuliah aktif</p>
            <div className="mt-3 flex items-center text-xs text-purple-600">
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
            <div className="text-4xl font-bold text-orange-600 mb-2">{Math.round(weeklyStats.totalHours)}</div>
            <p className="text-sm text-muted-foreground">Jam per minggu</p>
            <div className="mt-3 flex items-center text-xs text-orange-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              {Math.round(weeklyStats.totalHours / 7)} jam/hari
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-4 animate-slide-up" style={{ animationDelay: "0.3s" }}>
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
            <div className="animate-slide-in-right" style={{ animationDelay: "0.1s" }}>
              <Legend userId={session.id} />
            </div>
          )}
        </div>
      </div>

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
