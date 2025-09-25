"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useSubjectsStore } from "@/stores/subjects.store"
import { useScheduleStore } from "@/stores/schedule.store"
import type { ScheduleEvent } from "@/data/schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ColorPicker } from "@/components/subjects/ColorPicker"
import { showSuccess, showError, confirmAction } from "@/lib/alerts"
import { parseTimeToMinutes, minutesToTimeString } from "@/lib/time"
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

export function ScheduleForm({ userId, event, onSuccess, onCancel, defaultDay }: ScheduleFormProps) {
  const { subjects } = useSubjectsStore()
  const { addEvent, updateEvent, getConflicts } = useScheduleStore()

  const activeSubjects = subjects.filter((s) => s.status === "aktif")

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
      } else {
        addEvent(eventData)
        showSuccess("Jadwal berhasil ditambahkan")
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
                  {activeSubjects.map((subject) => (
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
              <Input id="startTime" type="time" {...form.register("startTime")} />
              {form.formState.errors.startTime && (
                <p className="text-sm text-destructive">{form.formState.errors.startTime.message}</p>
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
              <Label htmlFor="location">Lokasi</Label>
              <Input id="location" placeholder="Contoh: Ruang A101" {...form.register("location")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="joinUrl">URL Meeting</Label>
              <Input id="joinUrl" type="url" placeholder="https://..." {...form.register("joinUrl")} />
              {form.formState.errors.joinUrl && (
                <p className="text-sm text-destructive">{form.formState.errors.joinUrl.message}</p>
              )}
            </div>
          </div>

          {!selectedSubject && (
            <div className="space-y-2">
              <Label>Warna</Label>
              <ColorPicker
                value={form.watch("color") || "#3b82f6"}
                onChange={(color) => form.setValue("color", color)}
              />
            </div>
          )}

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
