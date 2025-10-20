"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useSubjectsStore } from "@/stores/subjects.store"
import { useRemindersStore } from "@/stores/reminders.store"
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
  const { subjects } = useSubjectsStore()
  const { addReminder, updateReminder } = useRemindersStore()

  const activeSubjects = subjects.filter((s) => s.status === "aktif")

  const form = useForm<ReminderFormData>({
    resolver: zodResolver(reminderFormSchema),
    defaultValues: {
      title: reminder?.title || "",
      dueDate: reminder ? toZoned(reminder.dueUTC).toISOString().split("T")[0] : "",
      dueTime: reminder ? toZoned(reminder.dueUTC).toTimeString().slice(0, 5) : "09:00",
      relatedSubjectId: reminder?.relatedSubjectId || "defaultSubjectId", // Updated default value
      isActive: reminder?.isActive ?? true,
      sendEmail: reminder?.sendEmail ?? false,
    },
  })

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{reminder ? "Edit Pengingat" : "Tambah Pengingat"}</CardTitle>
        <CardDescription>
          {reminder ? "Perbarui informasi pengingat" : "Buat pengingat baru untuk tugas atau kegiatan"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Judul Pengingat</Label>
            <Input id="title" placeholder="Contoh: Tugas Pemrograman Web" {...form.register("title")} />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Tanggal</Label>
              <Input id="dueDate" type="date" {...form.register("dueDate")} />
              {form.formState.errors.dueDate && (
                <p className="text-sm text-destructive">{form.formState.errors.dueDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueTime">Waktu</Label>
              <Input id="dueTime" type="time" {...form.register("dueTime")} />
              {form.formState.errors.dueTime && (
                <p className="text-sm text-destructive">{form.formState.errors.dueTime.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Mata Kuliah Terkait (Opsional)</Label>
            <Select
              value={form.watch("relatedSubjectId")}
              onValueChange={(value) => form.setValue("relatedSubjectId", value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih mata kuliah" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="defaultSubjectId">Tidak ada</SelectItem> {/* Updated value */}
                {activeSubjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.kode} - {subject.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={form.watch("isActive")}
                onCheckedChange={(checked) => form.setValue("isActive", checked)}
              />
              <Label htmlFor="isActive">Aktifkan pengingat</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="sendEmail"
                checked={form.watch("sendEmail")}
                onCheckedChange={(checked) => form.setValue("sendEmail", checked)}
              />
              <Label htmlFor="sendEmail">Kirim pengingat email (via ICS)</Label>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Batal
              </Button>
            )}
            <Button type="submit">{reminder ? "Perbarui" : "Tambah"} Pengingat</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
