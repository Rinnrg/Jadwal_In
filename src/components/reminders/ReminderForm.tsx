"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useEffect } from "react"
import { useSubjectsStore } from "@/stores/subjects.store"
import { useRemindersStore } from "@/stores/reminders.store"
import { useScheduleStore } from "@/stores/schedule.store"
import { useKrsStore } from "@/stores/krs.store"
import type { Reminder } from "@/data/schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { showSuccess, showError } from "@/lib/alerts"
import { toUTC, toZoned } from "@/lib/time"
import { ActivityLogger } from "@/lib/activity-logger"

const reminderFormSchema = z.object({
  title: z.string().min(1, "Judul pengingat wajib diisi"),
  dueDate: z.string().min(1, "Tanggal wajib diisi"),
  dueTime: z.string().min(1, "Waktu wajib diisi"),
  relatedSubjectId: z.string().optional(),
  isActive: z.boolean(),
  sendEmail: z.boolean(),
})

type ReminderFormData = z.infer<typeof reminderFormSchema>

interface ReminderFormProps {
  userId: string
  reminder?: Reminder
  onSuccess?: () => void
  onCancel?: () => void
}

export function ReminderForm({ userId, reminder, onSuccess, onCancel }: ReminderFormProps) {
  const { subjects, getSubjectById } = useSubjectsStore()
  const { addReminder, updateReminder } = useRemindersStore()
  const { getEventsByUser } = useScheduleStore()
  const { getKrsByUser } = useKrsStore()

  // Get user's KRS subjects with schedules
  const userKrs = getKrsByUser(userId)
  const userSchedules = getEventsByUser(userId)
  
  // Get subjects that have schedules
  const subjectsWithSchedule = userKrs
    .map(krs => {
      const subject = getSubjectById(krs.subjectId)
      const schedule = userSchedules.find(s => s.subjectId === krs.subjectId)
      return { subject, schedule }
    })
    .filter(item => item.subject && item.schedule)
    .map(item => ({
      id: item.schedule!.id,
      subjectId: item.subject!.id,
      subjectName: `${item.subject!.kode} - ${item.subject!.nama}`,
      dayOfWeek: item.schedule!.dayOfWeek,
      startUTC: item.schedule!.startUTC,
      endUTC: item.schedule!.endUTC,
      location: item.schedule!.location,
    }))

  const form = useForm<ReminderFormData>({
    resolver: zodResolver(reminderFormSchema),
    defaultValues: {
      title: reminder?.title || "",
      dueDate: reminder ? toZoned(reminder.dueUTC).toISOString().split("T")[0] : "",
      dueTime: reminder ? toZoned(reminder.dueUTC).toTimeString().slice(0, 5) : "09:00",
      relatedSubjectId: reminder?.relatedSubjectId || "",
      isActive: reminder?.isActive ?? true,
      sendEmail: reminder?.sendEmail ?? false,
    },
  })

  // Auto-fill when schedule is selected
  const handleScheduleSelect = (scheduleId: string) => {
    if (!scheduleId || scheduleId === "none") {
      form.setValue("relatedSubjectId", "")
      return
    }

    const selected = subjectsWithSchedule.find(s => s.id === scheduleId)
    if (!selected) return

    // Get next occurrence of this schedule
    const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
    const now = new Date()
    const currentDay = now.getDay()
    const targetDay = selected.dayOfWeek
    
    // Calculate days until next occurrence
    let daysUntil = targetDay - currentDay
    if (daysUntil <= 0) daysUntil += 7
    
    const nextDate = new Date(now)
    nextDate.setDate(now.getDate() + daysUntil)
    
    // Convert startUTC (milliseconds in day) to time
    const hours = Math.floor(selected.startUTC / (60 * 60 * 1000))
    const minutes = Math.floor((selected.startUTC % (60 * 60 * 1000)) / (60 * 1000))
    
    // Set form values
    const subject = getSubjectById(selected.subjectId)
    form.setValue("title", `${subject?.nama || "Kuliah"} - ${dayNames[targetDay]}`)
    form.setValue("dueDate", nextDate.toISOString().split("T")[0])
    form.setValue("dueTime", `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`)
    form.setValue("relatedSubjectId", selected.subjectId)
  }

  const onSubmit = (data: ReminderFormData) => {
    try {
      // Combine date and time
      const dueDateTime = new Date(`${data.dueDate}T${data.dueTime}:00`)
      const dueUTC = toUTC(dueDateTime)

      const reminderData: Omit<Reminder, "id"> = {
        userId,
        title: data.title,
        dueUTC,
        relatedSubjectId: data.relatedSubjectId || undefined,
        isActive: data.isActive,
        sendEmail: data.sendEmail,
      }

      if (reminder) {
        updateReminder(reminder.id, reminderData)
        showSuccess("Pengingat berhasil diperbarui")
        
        // Log activity
        ActivityLogger.reminderUpdated(userId, data.title)
      } else {
        addReminder(reminderData)
        showSuccess("Pengingat berhasil ditambahkan")
        
        // Log activity
        ActivityLogger.reminderCreated(userId, data.title)
      }

      onSuccess?.()
    } catch (error) {
      showError("Terjadi kesalahan saat menyimpan pengingat")
    }
  }

  const formContent = (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Schedule Selector - Top Position (only show if user has schedules) */}
      {subjectsWithSchedule.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs md:text-sm">Pilih dari Jadwal (Opsional)</Label>
          <Select onValueChange={handleScheduleSelect}>
            <SelectTrigger className="text-xs md:text-sm">
              <SelectValue placeholder="Pilih mata kuliah dari jadwal Anda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="text-xs md:text-sm">Input Manual</SelectItem>
              {subjectsWithSchedule.map((item) => {
                const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
                const hours = Math.floor(item.startUTC / (60 * 60 * 1000))
                const minutes = Math.floor((item.startUTC % (60 * 60 * 1000)) / (60 * 1000))
                return (
                  <SelectItem key={item.id} value={item.id} className="text-xs md:text-sm">
                    <div className="flex flex-col">
                      <span className="font-medium">{item.subjectName}</span>
                      <span className="text-[10px] md:text-xs text-muted-foreground">
                        {dayNames[item.dayOfWeek]} • {hours.toString().padStart(2, "0")}:{minutes.toString().padStart(2, "0")}
                        {item.location && ` • ${item.location}`}
                      </span>
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Info if no schedule but has KRS */}
      {userKrs.length > 0 && subjectsWithSchedule.length === 0 && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Belum Ada Jadwal
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Tambahkan jadwal untuk mata kuliah KRS Anda terlebih dahulu untuk menggunakan fitur quick select.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title" className="text-xs md:text-sm">Judul Pengingat</Label>
        <Input 
          id="title" 
          placeholder="Contoh: Tugas Pemrograman Web" 
          {...form.register("title")}
          className="text-xs md:text-sm"
        />
        {form.formState.errors.title && (
          <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dueDate" className="text-xs md:text-sm">Tanggal</Label>
          <Input 
            id="dueDate" 
            type="date" 
            {...form.register("dueDate")}
            className="text-xs md:text-sm"
          />
          {form.formState.errors.dueDate && (
            <p className="text-xs text-destructive">{form.formState.errors.dueDate.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="dueTime" className="text-xs md:text-sm">Waktu</Label>
          <Input 
            id="dueTime" 
            type="time" 
            {...form.register("dueTime")}
            className="text-xs md:text-sm"
          />
          {form.formState.errors.dueTime && (
            <p className="text-xs text-destructive">{form.formState.errors.dueTime.message}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={form.watch("isActive")}
            onCheckedChange={(checked) => form.setValue("isActive", checked)}
          />
          <Label htmlFor="isActive" className="text-xs md:text-sm">Aktifkan pengingat</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="sendEmail"
            checked={form.watch("sendEmail")}
            onCheckedChange={(checked) => form.setValue("sendEmail", checked)}
          />
          <Label htmlFor="sendEmail" className="text-xs md:text-sm">Kirim email (ICS)</Label>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="text-xs md:text-sm">
            Batal
          </Button>
        )}
        <Button type="submit" className="text-xs md:text-sm">
          {reminder ? "Perbarui" : "Tambah"} Pengingat
        </Button>
      </div>
    </form>
  )

  return (
    <Card>
      <CardHeader className="px-4 md:px-6 pt-4 md:pt-6 pb-3 md:pb-4">
        <CardTitle className="text-base md:text-lg">{reminder ? "Edit Pengingat" : "Tambah Pengingat Baru"}</CardTitle>
        <CardDescription className="text-xs md:text-sm">
          {subjectsWithSchedule.length > 0 
            ? "Pilih mata kuliah dari jadwal untuk mengisi otomatis atau isi manual"
            : "Isi form untuk menambahkan pengingat baru"}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
        {formContent}
      </CardContent>
    </Card>
  )
}
