"use client"

import { useMemo, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSubjectsStore } from "@/stores/subjects.store"
import { useOfferingsStore } from "@/stores/offerings.store"
import { useKrsStore } from "@/stores/krs.store"
import { useScheduleStore } from "@/stores/schedule.store"
import { useRemindersStore } from "@/stores/reminders.store"
import { useSessionStore } from "@/stores/session.store"
import type { KrsItem } from "@/data/schema"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, Calendar, Bell } from "lucide-react"
import { confirmAction, showSuccess, showError } from "@/lib/alerts"
import { fmtDateTime, nowUTC } from "@/lib/time"
import { ActivityLogger } from "@/lib/activity-logger"
import { generateUniqueColor } from "@/lib/utils"

// Helper function untuk format hari
const getDayName = (dayIndex: number): string => {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
  return days[dayIndex] || "-"
}

// Helper function untuk format jam dari UTC milliseconds
const formatTime = (utcMs: number): string => {
  const hours = Math.floor(utcMs / (60 * 60 * 1000))
  const minutes = Math.floor((utcMs % (60 * 60 * 1000)) / (60 * 1000))
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
}

interface KrsTableProps {
  userId: string
  term: string
  onScheduleSuggestion?: (subjectId: string) => void
}

export function KrsTable({ userId, term, onScheduleSuggestion }: KrsTableProps) {
  const router = useRouter()
  const { getSubjectById, subjects } = useSubjectsStore()
  const { getOffering, offerings } = useOfferingsStore()
  const { getKrsByUser, removeKrsItem, krsItems: allKrsItems } = useKrsStore()
  const { addEvent, getEventsByUser } = useScheduleStore()
  const { addReminder } = useRemindersStore()
  const { session } = useSessionStore()
  
  // Force re-render trigger
  const [, setForceUpdate] = useState(0)
  
  const [reminderDialog, setReminderDialog] = useState<{
    open: boolean
    subjectId: string
    subjectName: string
    dueDate: string
    dueTime: string
  }>({
    open: false,
    subjectId: '',
    subjectName: '',
    dueDate: '',
    dueTime: '08:00'
  })

  // Force update when allKrsItems, subjects, or offerings change
  useEffect(() => {
    setForceUpdate(prev => prev + 1)
  }, [allKrsItems.length, subjects.length, offerings.length])

  const krsItems = useMemo(() => {
    return getKrsByUser(userId, term)
  }, [userId, term, allKrsItems]) // React to allKrsItems changes
  
  const userSchedule = getEventsByUser(userId)

  const krsWithDetails = useMemo(() => {
    return krsItems
      .map((krsItem) => {
        const subject = getSubjectById(krsItem.subjectId)
        const offering = krsItem.offeringId ? getOffering(krsItem.offeringId) : null
        // Filter: Only include if subject exists AND is active
        return subject && subject.status === "aktif" ? { ...krsItem, subject, offering } : null
      })
      .filter(Boolean)
      .sort((a, b) => a!.subject.semester - b!.subject.semester)
  }, [krsItems, getSubjectById, getOffering])

  // Group KRS by angkatan and kelas
  const groupedKrs = useMemo(() => {
    const groups = krsWithDetails.reduce((acc, item) => {
      if (!item) return acc
      
      // Prioritize offering data, fallback to subject data
      const angkatan = item.offering?.angkatan || item.subject.angkatan || "Tidak ada angkatan"
      const kelas = (item.offering?.kelas || item.subject.kelas || "Tidak ada kelas").trim()
      const key = `${angkatan}-${kelas}`
      
      if (!acc[key]) {
        acc[key] = {
          angkatan,
          kelas,
          items: []
        }
      }
      
      acc[key].items.push(item)
      return acc
    }, {} as Record<string, { angkatan: string | number; kelas: string; items: typeof krsWithDetails }>)

    // Sort groups by angkatan desc, then kelas asc
    return Object.values(groups).sort((a, b) => {
      const angkatanA = typeof a.angkatan === 'number' ? a.angkatan : 0
      const angkatanB = typeof b.angkatan === 'number' ? b.angkatan : 0
      if (angkatanB !== angkatanA) return angkatanB - angkatanA
      return a.kelas.localeCompare(b.kelas)
    })
  }, [krsWithDetails])

  const handleRemoveSubject = async (krsItem: KrsItem, subjectName: string, kelas?: string) => {
    const displayName = kelas ? `${subjectName} (Kelas ${kelas})` : subjectName
    const confirmed = await confirmAction(
      "Hapus dari KRS",
      `Apakah Anda yakin ingin menghapus "${displayName}" dari KRS?`,
      "Ya, Hapus",
    )

    if (confirmed) {
      try {
        await removeKrsItem(krsItem.id, userId, displayName)
        
        // Force UI update
        setForceUpdate(prev => prev + 1)
        
        showSuccess(`${displayName} berhasil dihapus dari KRS`)
      } catch (error) {
        console.error('[KRS Table] Error removing from KRS:', error)
        const errorMessage = error instanceof Error ? error.message : "Gagal menghapus dari KRS"
        showError(errorMessage)
      }
    }
  }

  const handleAddToSchedule = (krsItem: KrsItem, subject: any, offering: any) => {
    // Check if subject already has a schedule
    const hasSchedule = userSchedule.some(event => event.subjectId === krsItem.subjectId)
    if (hasSchedule) {
      showError(`${subject.nama} sudah ada di jadwal`)
      return
    }

    // Get schedule info from offering or subject
    const slotDay = offering?.slotDay ?? subject?.slotDay
    const slotStartUTC = offering?.slotStartUTC ?? subject?.slotStartUTC
    const slotEndUTC = offering?.slotEndUTC ?? subject?.slotEndUTC
    const location = offering?.slotRuang ?? subject?.slotRuang

    // Validate all required fields
    if (slotDay === undefined || slotDay === null || !slotStartUTC || !slotEndUTC) {
      showError("Data jadwal tidak tersedia untuk mata kuliah ini")
      return
    }

    // Generate unique color for this schedule
    const usedColors = userSchedule
      .map(e => e.color)
      .filter(Boolean) as string[]
    const uniqueColor = generateUniqueColor(usedColors)

    console.log('Adding schedule with subjectId:', krsItem.subjectId, 'for subject:', subject.nama)

    // Add to schedule - PASTIKAN subjectId tersimpan
    addEvent({
      userId: userId,
      subjectId: krsItem.subjectId, // PENTING: Ini harus ada
      dayOfWeek: slotDay,
      startUTC: slotStartUTC,
      endUTC: slotEndUTC,
      location: location || undefined,
      color: uniqueColor,
    })

    showSuccess(`${subject.nama} berhasil ditambahkan ke jadwal`)
    
    // Log activity
    if (session) {
      ActivityLogger.scheduleAdded(session.id, subject.nama)
    }
  }

  const handleOpenReminderDialog = (subjectId: string, subjectName: string) => {
    // Set default to tomorrow at 8 AM
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split('T')[0]
    
    setReminderDialog({
      open: true,
      subjectId,
      subjectName,
      dueDate: dateStr,
      dueTime: '08:00'
    })
  }

  const handleSaveReminder = () => {
    if (!reminderDialog.dueDate || !reminderDialog.dueTime) {
      showError("Mohon isi tanggal dan waktu reminder")
      return
    }

    // Combine date and time to UTC timestamp
    const dateTimeStr = `${reminderDialog.dueDate}T${reminderDialog.dueTime}:00`
    const dueUTC = new Date(dateTimeStr).getTime()

    if (dueUTC < nowUTC()) {
      showError("Waktu reminder tidak boleh di masa lalu")
      return
    }

    addReminder({
      userId,
      title: `Reminder: ${reminderDialog.subjectName}`,
      dueUTC,
      relatedSubjectId: reminderDialog.subjectId,
      isActive: true,
    })

    showSuccess(`Reminder untuk ${reminderDialog.subjectName} berhasil ditambahkan`)
    setReminderDialog({ open: false, subjectId: '', subjectName: '', dueDate: '', dueTime: '08:00' })
  }

  const handleSyncAllToSchedule = (groupItems: typeof krsWithDetails) => {
    let addedCount = 0
    let skippedCount = 0
    let errorCount = 0

    groupItems.forEach((item) => {
      if (!item) return

      // Check if already in schedule
      const hasSchedule = userSchedule.some(event => event.subjectId === item.subject.id)
      if (hasSchedule) {
        skippedCount++
        return
      }

      // Get schedule info
      const slotDay = item.offering?.slotDay ?? item.subject?.slotDay
      const slotStartUTC = item.offering?.slotStartUTC ?? item.subject?.slotStartUTC
      const slotEndUTC = item.offering?.slotEndUTC ?? item.subject?.slotEndUTC
      const location = item.offering?.slotRuang ?? item.subject?.slotRuang

      // Validate all required fields are present and not null
      if (
        slotDay === undefined || 
        slotDay === null || 
        slotStartUTC === undefined || 
        slotStartUTC === null || 
        slotEndUTC === undefined || 
        slotEndUTC === null
      ) {
        console.warn('Missing schedule data for:', item.subject.nama, {
          slotDay,
          slotStartUTC,
          slotEndUTC
        })
        errorCount++
        return
      }

      // Generate unique color
      const usedColors = userSchedule
        .map(e => e.color)
        .filter(Boolean) as string[]
      const uniqueColor = generateUniqueColor(usedColors)

      console.log('Syncing schedule:', {
        subjectId: item.subject.id,
        subjectName: item.subject.nama,
        dayOfWeek: slotDay,
        startUTC: slotStartUTC,
        endUTC: slotEndUTC
      })

      // Add to schedule - PASTIKAN subjectId tersimpan dengan benar
      addEvent({
        userId: userId,
        subjectId: item.subject.id, // PENTING: Ini harus ada dan valid
        dayOfWeek: slotDay,
        startUTC: slotStartUTC,
        endUTC: slotEndUTC,
        location: location || undefined,
        color: uniqueColor,
      })

      addedCount++
      
      // Log activity
      if (session) {
        ActivityLogger.scheduleAdded(session.id, item.subject.nama)
      }
    })

    // Show result
    if (addedCount > 0) {
      showSuccess(`${addedCount} mata kuliah berhasil ditambahkan ke jadwal`)
    }
    if (skippedCount > 0) {
      showError(`${skippedCount} mata kuliah sudah ada di jadwal`)
    }
    if (errorCount > 0) {
      showError(`${errorCount} mata kuliah tidak memiliki data jadwal`)
    }
  }

  const getSemesterBadge = (semester: number) => {
    const colors = [
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    ]
    return colors[(semester - 1) % colors.length]
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Empty State */}
      {krsWithDetails.length === 0 ? (
        <div className="text-center py-8 md:py-12 px-3">
          <p className="text-sm md:text-base text-muted-foreground">Belum ada mata kuliah yang diambil.</p>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">Pilih mata kuliah dari daftar di atas.</p>
        </div>
      ) : (
        /* Content - Grouped by Class */
        <div className="space-y-3 md:space-y-4">
          {groupedKrs.map((group, groupIndex) => (
            <div key={`${group.angkatan}-${group.kelas}`} className="animate-slide-in-left">
              {/* Group Header Card */}
              <Card className="border-2 border-primary/10">
                <CardHeader className="px-3 md:px-6 py-2.5 md:py-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm md:text-base font-semibold">KRS Anda</span>
                      <Badge variant="default" className="text-xs">
                        Angkatan {group.angkatan}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Kelas {group.kelas}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {group.items.length} mata kuliah
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSyncAllToSchedule(group.items)}
                        className="h-7 px-2 md:px-3 text-xs hover:bg-blue-50 dark:hover:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                        title="Sinkronisasi semua ke jadwal"
                      >
                        <Calendar className="h-3 w-3 md:mr-1" />
                        <span className="hidden md:inline">Sync Jadwal</span>
                      </Button>
                      <Badge variant="secondary" className="text-xs">
                        {group.items.reduce((total, item) => total + (item?.subject.sks || 0), 0)} SKS
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                {/* Desktop Table View */}
                <CardContent className="hidden md:block p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>SKS</TableHead>
                        <TableHead>Jadwal</TableHead>
                        <TableHead>Ditambahkan</TableHead>
                        <TableHead className="w-[180px]">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.items.map((item) => {
                        // Get schedule info from offering or subject
                        const slotDay = item!.offering?.slotDay ?? item!.subject.slotDay
                        const slotStartUTC = item!.offering?.slotStartUTC ?? item!.subject.slotStartUTC
                        const slotEndUTC = item!.offering?.slotEndUTC ?? item!.subject.slotEndUTC
                        const slotRuang = item!.offering?.slotRuang ?? item!.subject.slotRuang
                        
                        const hasSchedule = slotDay !== undefined && slotDay !== null && slotStartUTC && slotEndUTC
                        
                        return (
                          <TableRow
                            key={item!.id}
                            className="hover:bg-muted/50 transition-all duration-300 hover:shadow-md hover:scale-[1.01]"
                          >
                            <TableCell>
                              <div>
                                <p className="font-medium">{item!.subject.nama}</p>
                                {item!.subject.prodi && <p className="text-sm text-muted-foreground">{item!.subject.prodi}</p>}
                                {item!.offering?.term && <p className="text-xs text-muted-foreground">{item!.offering.term}</p>}
                              </div>
                            </TableCell>
                            <TableCell>{item!.subject.sks}</TableCell>
                            <TableCell>
                              {hasSchedule ? (
                                <div className="text-sm">
                                  <p className="font-medium">{getDayName(slotDay!)}</p>
                                  <p className="text-muted-foreground">
                                    {formatTime(slotStartUTC!)} - {formatTime(slotEndUTC!)}
                                  </p>
                                  {slotRuang && (
                                    <p className="text-xs text-muted-foreground">{slotRuang}</p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">Belum ada jadwal</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{fmtDateTime(item!.createdAt)}</TableCell>
                            <TableCell>
                              <div className="flex space-x-1">
                              {((item!.offering?.slotDay !== undefined && item!.offering?.slotStartUTC) || 
                                (item!.subject.slotDay !== undefined && item!.subject.slotStartUTC)) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAddToSchedule(item!, item!.subject, item!.offering)}
                                  title="Tambah ke jadwal"
                                  className="hover:scale-110 transition-all duration-200 hover:shadow-md"
                                  disabled={userSchedule.some(e => e.subjectId === item!.subject.id)}
                                >
                                  <Calendar className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenReminderDialog(item!.subject.id, item!.subject.nama)}
                                title="Tambah reminder"
                                className="hover:scale-110 transition-all duration-200 hover:shadow-md"
                              >
                                <Bell className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRemoveSubject(item!, item!.subject.nama, item!.offering?.kelas)}
                                title="Hapus dari KRS"
                                className="text-destructive hover:text-destructive hover:scale-110 transition-all duration-200 hover:shadow-md"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>

                {/* Mobile List View - Lebih kompak */}
                <CardContent className="md:hidden p-2">
                  <div className="space-y-2">
                    {group.items.map((item) => {
                      // Get schedule info from offering or subject
                      const slotDay = item!.offering?.slotDay ?? item!.subject.slotDay
                      const slotStartUTC = item!.offering?.slotStartUTC ?? item!.subject.slotStartUTC
                      const slotEndUTC = item!.offering?.slotEndUTC ?? item!.subject.slotEndUTC
                      const slotRuang = item!.offering?.slotRuang ?? item!.subject.slotRuang
                      
                      const hasSchedule = slotDay !== undefined && slotDay !== null && slotStartUTC && slotEndUTC
                      
                      return (
                        <div 
                          key={item!.id} 
                          className="border rounded-lg p-3 bg-card hover:border-primary/50 transition-colors space-y-2"
                        >
                          {/* Header Row */}
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm leading-tight line-clamp-2">
                                {item!.subject.nama}
                              </h4>
                              {item!.subject.prodi && (
                                <p className="text-xs text-muted-foreground truncate mt-0.5">{item!.subject.prodi}</p>
                              )}
                            </div>
                            <Badge className="text-xs flex-shrink-0">{item!.subject.sks} SKS</Badge>
                          </div>

                          {/* Schedule Info */}
                          {hasSchedule && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Calendar className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                              <span className="font-medium">{getDayName(slotDay!)}</span>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-muted-foreground">
                                {formatTime(slotStartUTC!)} - {formatTime(slotEndUTC!)}
                              </span>
                              {slotRuang && (
                                <>
                                  <span className="text-muted-foreground">•</span>
                                  <span className="text-muted-foreground">{slotRuang}</span>
                                </>
                              )}
                            </div>
                          )}

                          {/* Date Info */}
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{fmtDateTime(item!.createdAt)}</span>
                          </div>

                          {/* Actions - Horizontal layout */}
                          <div className="flex items-center gap-2 pt-1">
                            {((item!.offering?.slotDay !== undefined && item!.offering?.slotStartUTC) || 
                              (item!.subject.slotDay !== undefined && item!.subject.slotStartUTC)) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAddToSchedule(item!, item!.subject, item!.offering)}
                                className="h-8 px-2"
                                disabled={userSchedule.some(e => e.subjectId === item!.subject.id)}
                              >
                                <Calendar className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenReminderDialog(item!.subject.id, item!.subject.nama)}
                              className="h-8 px-2"
                            >
                              <Bell className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveSubject(item!, item!.subject.nama, item!.offering?.kelas)}
                              className="text-destructive hover:text-destructive h-8 px-2"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Reminder Dialog */}
      <Dialog open={reminderDialog.open} onOpenChange={(open) => setReminderDialog({ ...reminderDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Reminder</DialogTitle>
            <DialogDescription>
              Buat reminder untuk mata kuliah {reminderDialog.subjectName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reminder-date">Tanggal</Label>
              <Input
                id="reminder-date"
                type="date"
                value={reminderDialog.dueDate}
                onChange={(e) => setReminderDialog({ ...reminderDialog, dueDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reminder-time">Waktu</Label>
              <Input
                id="reminder-time"
                type="time"
                value={reminderDialog.dueTime}
                onChange={(e) => setReminderDialog({ ...reminderDialog, dueTime: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReminderDialog({ ...reminderDialog, open: false })}>
              Batal
            </Button>
            <Button onClick={handleSaveReminder}>
              Simpan Reminder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
