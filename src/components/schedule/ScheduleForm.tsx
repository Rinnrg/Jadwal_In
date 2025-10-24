"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useSubjectsStore } from "@/stores/subjects.store"
import { useScheduleStore } from "@/stores/schedule.store"
import { useKrsStore } from "@/stores/krs.store"
import type { ScheduleEvent } from "@/data/schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { showSuccess, showError, confirmAction } from "@/lib/alerts"
import { parseTimeToMinutes, minutesToTimeString } from "@/lib/time"
import { ActivityLogger } from "@/lib/activity-logger"
import { AlertTriangle } from "lucide-react"

const scheduleFormSchema = z
  .object({
    subjectId: z.string().optional(),
    dayOfWeek: z.number().min(0).max(6),
    startTime: z.string().min(1, "Jam mulai wajib diisi"),
    endTime: z.string().min(1, "Jam selesai wajib diisi"),
    location: z.string().optional(),
    joinUrl: z.string().url("URL tidak valid").optional().or(z.literal("")),
    notes: z.string().optional(),
    color: z.string().optional(),
  })
  .refine(
    (data) => {
      const startMinutes = parseTimeToMinutes(data.startTime)
      const endMinutes = parseTimeToMinutes(data.endTime)
      return endMinutes > startMinutes
    },
    {
      message: "Jam selesai harus lebih besar dari jam mulai",
      path: ["endTime"],
    },
  )

type ScheduleFormData = z.infer<typeof scheduleFormSchema>

interface ScheduleFormProps {
  userId: string
  event?: ScheduleEvent
  onSuccess?: () => void
  onCancel?: () => void
  defaultDay?: number
}

const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]

// Generate room options (A10.01.01 - A10.05.20)
const generateRoomOptions = () => {
  const rooms: string[] = []
  for (let floor = 1; floor <= 5; floor++) {
    for (let room = 1; room <= 20; room++) {
      rooms.push(`A10.${String(floor).padStart(2, '0')}.${String(room).padStart(2, '0')}`)
    }
  }
  return rooms
}

export function ScheduleForm({ userId, event, onSuccess, onCancel, defaultDay }: ScheduleFormProps) {
  const { subjects } = useSubjectsStore()
  const { addEvent, updateEvent, getConflicts } = useScheduleStore()
  const { getKrsByUser } = useKrsStore()

  // Get current term
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()
  const isOddSemester = currentMonth >= 8 || currentMonth <= 1
  const currentTerm = `${currentYear}/${currentYear + 1}-${isOddSemester ? "Ganjil" : "Genap"}`

  // Get user's KRS subjects
  const userKrsItems = getKrsByUser(userId, currentTerm)
  const krsSubjectIds = new Set(userKrsItems.map(item => item.subjectId))
  
  // Filter subjects to only show those in KRS and active
  const availableSubjects = subjects.filter((s) => 
    s.status === "aktif" && krsSubjectIds.has(s.id)
  )

  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      subjectId: event?.subjectId || "defaultSubjectId", // Updated default value
      dayOfWeek: event?.dayOfWeek ?? defaultDay ?? 1,
      startTime: event ? minutesToTimeString(Math.floor(event.startUTC / (1000 * 60)) % (24 * 60)) : "08:00",
      endTime: event ? minutesToTimeString(Math.floor(event.endUTC / (1000 * 60)) % (24 * 60)) : "10:00",
      location: event?.location || "",
      joinUrl: event?.joinUrl || "",
      notes: event?.notes || "",
      color: event?.color || "#3b82f6",
    },
  })

  const watchedValues = form.watch()
  const selectedSubject = watchedValues.subjectId ? subjects.find((s) => s.id === watchedValues.subjectId) : null

  // Auto-calculate end time when subject or start time changes
  const handleStartTimeChange = (startTime: string) => {
    form.setValue("startTime", startTime)
    
    if (selectedSubject && watchedValues.subjectId !== "defaultSubjectId") {
      const sks = selectedSubject.sks || 2
      const startMinutes = parseTimeToMinutes(startTime)
      const durationMinutes = sks * 50 // 1 SKS = 50 menit
      const endMinutes = startMinutes + durationMinutes
      const endTime = minutesToTimeString(endMinutes)
      form.setValue("endTime", endTime)
    }
  }

  // Check for conflicts
  const conflicts =
    watchedValues.startTime && watchedValues.endTime
      ? getConflicts(
          userId,
          watchedValues.dayOfWeek,
          parseTimeToMinutes(watchedValues.startTime) * 60 * 1000,
          parseTimeToMinutes(watchedValues.endTime) * 60 * 1000,
          event?.id,
        )
      : []

  const onSubmit = async (data: ScheduleFormData) => {
    const startUTC = parseTimeToMinutes(data.startTime) * 60 * 1000
    const endUTC = parseTimeToMinutes(data.endTime) * 60 * 1000

    // Check if subject already has a schedule (prevent duplicate subject schedules)
    if (data.subjectId && data.subjectId !== "defaultSubjectId") {
      const { hasSubjectScheduled } = useScheduleStore.getState()
      const existingSchedule = hasSubjectScheduled(userId, data.subjectId)
      
      // If editing, check if it's a different event
      if (!event || event.subjectId !== data.subjectId) {
        if (existingSchedule) {
          const subject = subjects.find((s) => s.id === data.subjectId)
          showError(`${subject?.nama || "Mata kuliah ini"} sudah memiliki jadwal. Silakan edit jadwal yang ada atau hapus terlebih dahulu.`)
          return
        }
      }
    }

    // Check conflicts again
    const currentConflicts = getConflicts(userId, data.dayOfWeek, startUTC, endUTC, event?.id)

    if (currentConflicts.length > 0) {
      const conflictNames = currentConflicts
        .map((conflict) => {
          const subject = conflict.subjectId ? subjects.find((s) => s.id === conflict.subjectId) : null
          return subject ? `${subject.kode} - ${subject.nama}` : "Jadwal Pribadi"
        })
        .join(", ")

      const confirmed = await confirmAction(
        "Konflik Jadwal Terdeteksi",
        `Jadwal ini bertabrakan dengan: ${conflictNames}. Apakah Anda yakin ingin melanjutkan?`,
        "Ya, Tetap Simpan",
      )

      if (!confirmed) return
    }

    const eventData: Omit<ScheduleEvent, "id"> = {
      userId,
      subjectId: data.subjectId || undefined,
      dayOfWeek: data.dayOfWeek,
      startUTC,
      endUTC,
      location: data.location || undefined,
      joinUrl: data.joinUrl || undefined,
      notes: data.notes || undefined,
      color: selectedSubject ? undefined : data.color,
    }

    try {
      if (event) {
        updateEvent(event.id, eventData)
        showSuccess("Jadwal berhasil diperbarui")
        
        // Log activity
        const courseName = selectedSubject ? `${selectedSubject.kode} - ${selectedSubject.nama}` : "Jadwal Pribadi"
        ActivityLogger.scheduleUpdated(userId, courseName)
      } else {
        addEvent(eventData)
        showSuccess("Jadwal berhasil ditambahkan")
        
        // Log activity
        const courseName = selectedSubject ? `${selectedSubject.kode} - ${selectedSubject.nama}` : "Jadwal Pribadi"
        ActivityLogger.scheduleAdded(userId, courseName)
      }
      onSuccess?.()
    } catch (error) {
      showError("Terjadi kesalahan saat menyimpan jadwal")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{event ? "Edit Jadwal" : "Tambah Jadwal"}</CardTitle>
        <CardDescription>
          {event ? "Perbarui informasi jadwal" : "Tambahkan jadwal baru ke kalender Anda"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mata Kuliah (Opsional)</Label>
              <Select
                value={form.watch("subjectId")}
                onValueChange={(value) => form.setValue("subjectId", value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih mata kuliah atau kosongkan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="defaultSubjectId">Jadwal Pribadi</SelectItem> {/* Updated value */}
                  {availableSubjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.kode} - {subject.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Hari</Label>
              <Select
                value={form.watch("dayOfWeek").toString()}
                onValueChange={(value) => form.setValue("dayOfWeek", Number.parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dayNames.map((day, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime">Jam Mulai</Label>
              <Input 
                id="startTime" 
                type="time" 
                value={watchedValues.startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
              />
              {form.formState.errors.startTime && (
                <p className="text-sm text-destructive">{form.formState.errors.startTime.message}</p>
              )}
              {selectedSubject && selectedSubject.sks && watchedValues.subjectId !== "defaultSubjectId" && (
                <p className="text-xs text-muted-foreground">
                  Durasi otomatis: {selectedSubject.sks} SKS × 50 menit = {selectedSubject.sks * 50} menit
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">Jam Selesai</Label>
              <Input id="endTime" type="time" {...form.register("endTime")} />
              {form.formState.errors.endTime && (
                <p className="text-sm text-destructive">{form.formState.errors.endTime.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Ruangan</Label>
              <Select
                value={form.watch("location") || "none"}
                onValueChange={(value) => {
                  if (value === "none") {
                    form.setValue("location", "")
                  } else {
                    form.setValue("location", value)
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih ruangan (opsional)" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="none">
                    <span className="text-muted-foreground">Tidak ada ruangan</span>
                  </SelectItem>
                  {generateRoomOptions().map((room) => (
                    <SelectItem key={room} value={room}>
                      {room} (Lantai {room.split('.')[1]}, Ruang {room.split('.')[2]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Tersedia: Lantai 01-05, Ruang 01-20
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="joinUrl">URL Meeting</Label>
              <Input id="joinUrl" type="url" placeholder="https://..." {...form.register("joinUrl")} />
              {form.formState.errors.joinUrl && (
                <p className="text-sm text-destructive">{form.formState.errors.joinUrl.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Catatan</Label>
            <Textarea id="notes" placeholder="Catatan tambahan..." {...form.register("notes")} />
          </div>

          {conflicts.length > 0 && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-destructive">Konflik Jadwal Terdeteksi</p>
                  <p className="text-sm text-destructive/80 mt-1">
                    Jadwal ini bertabrakan dengan:{" "}
                    {conflicts
                      .map((conflict) => {
                        const subject = conflict.subjectId ? subjects.find((s) => s.id === conflict.subjectId) : null
                        return subject ? `${subject.kode}` : "Jadwal Pribadi"
                      })
                      .join(", ")}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Batal
              </Button>
            )}
            <Button type="submit">{event ? "Perbarui" : "Tambah"} Jadwal</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
