"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { AssigneePicker } from "@/components/subjects/AssigneePicker"
import type { Subject } from "@/data/schema"
import { useSubjectsStore } from "@/stores/subjects.store"
import { useOfferingsStore } from "@/stores/offerings.store"
import { showSuccess, showError } from "@/lib/alerts"
import { parseTimeToMinutes, minutesToTimeString } from "@/lib/time"

const subjectFormSchema = z
  .object({
    kode: z.string().min(1, "Kode mata kuliah wajib diisi"),
    nama: z.string().min(1, "Nama mata kuliah wajib diisi"),
    sks: z.number().min(1, "SKS minimal 1").max(6, "SKS maksimal 6"),
    prodi: z.string().optional(),
    angkatan: z.number().min(2020, "Angkatan minimal 2020"),
    kelas: z.string().min(1, "Kelas wajib diisi"),
    color: z.string(),
    pengampuIds: z.array(z.string()),
    hasDefaultSlot: z.boolean(),
    defaultDay: z.number().min(0).max(6).optional(),
    defaultStartTime: z.string().optional(),
    defaultEndTime: z.string().optional(),
    defaultRuang: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.hasDefaultSlot) {
        return data.defaultDay !== undefined && data.defaultStartTime && data.defaultEndTime
      }
      return true
    },
    {
      message: "Jadwal default wajib diisi jika diaktifkan",
      path: ["defaultStartTime"],
    },
  )

type SubjectFormData = z.infer<typeof subjectFormSchema>

interface SubjectFormProps {
  subject?: Subject
  onSuccess?: () => void
  onCancel?: () => void
}

const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]

// Preset colors for subjects
const subjectColors = [
  "#3b82f6", // blue
  "#10b981", // green
  "#8b5cf6", // purple
  "#f59e0b", // amber
  "#ef4444", // red
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#84cc16", // lime
]

const getRandomColor = () => {
  return subjectColors[Math.floor(Math.random() * subjectColors.length)]
}

export function SubjectForm({ subject, onSuccess, onCancel }: SubjectFormProps) {
  const { subjects, addSubject, updateSubject } = useSubjectsStore()
  const { addOffering } = useOfferingsStore()

  const form = useForm<SubjectFormData>({
    resolver: zodResolver(subjectFormSchema),
    defaultValues: {
      kode: subject?.kode || "",
      nama: subject?.nama || "",
      sks: subject?.sks || 3,
      prodi: subject?.prodi || "",
      angkatan: subject?.angkatan || 2024,
      kelas: subject?.kelas || "",
      color: subject?.color || getRandomColor(),
      pengampuIds: subject?.pengampuIds || [],
      hasDefaultSlot: subject ? !!(subject?.slotDay !== null && subject?.slotDay !== undefined) : true,
      defaultDay: subject?.slotDay ?? undefined,
      defaultStartTime: subject?.slotStartUTC
        ? minutesToTimeString(Math.floor(subject.slotStartUTC / (1000 * 60)) % (24 * 60))
        : "",
      defaultEndTime: subject?.slotEndUTC
        ? minutesToTimeString(Math.floor(subject.slotEndUTC / (1000 * 60)) % (24 * 60))
        : "",
      defaultRuang: subject?.slotRuang || "",
    },
  })

  const onSubmit = async (data: SubjectFormData) => {
    // Check for duplicate kode (excluding current subject if editing)
    const existingSubject = subjects.find(
      (s) => s.kode.toLowerCase() === data.kode.toLowerCase() && s.id !== subject?.id,
    )

    if (existingSubject) {
      showError("Kode mata kuliah sudah digunakan")
      return
    }

    // Transform data to match Prisma schema
    const subjectData: any = {
      kode: data.kode,
      nama: data.nama,
      sks: data.sks,
      semester: 1, // default semester
      prodi: data.prodi,
      status: "aktif", // default status
      angkatan: data.angkatan,
      kelas: data.kelas,
      color: data.color,
      pengampuIds: data.pengampuIds,
    }

    // Add schedule slot fields if enabled
    if (data.hasDefaultSlot && data.defaultDay !== undefined && data.defaultStartTime && data.defaultEndTime) {
      subjectData.slotDay = data.defaultDay
      subjectData.slotStartUTC = parseTimeToMinutes(data.defaultStartTime) * 60 * 1000
      subjectData.slotEndUTC = parseTimeToMinutes(data.defaultEndTime) * 60 * 1000
      subjectData.slotRuang = data.defaultRuang
    }

    try {
      if (subject) {
        await updateSubject(subject.id, subjectData)
        showSuccess("Mata kuliah berhasil diperbarui")
      } else {
        // API will automatically create course offering
        await addSubject(subjectData)
        showSuccess("Mata kuliah berhasil ditambahkan")
      }
      onSuccess?.()
    } catch (error) {
      console.error('Error saving subject:', error)
      showError(error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan mata kuliah")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{subject ? "Edit Mata Kuliah" : "Tambah Mata Kuliah"}</CardTitle>
        <CardDescription>
          {subject ? "Perbarui informasi mata kuliah" : "Tambahkan mata kuliah baru ke katalog"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="kode">Kode Mata Kuliah</Label>
              <Input id="kode" placeholder="Contoh: IF101" {...form.register("kode")} />
              {form.formState.errors.kode && (
                <p className="text-sm text-destructive">{form.formState.errors.kode.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nama">Nama Mata Kuliah</Label>
              <Input id="nama" placeholder="Contoh: Pemrograman Dasar" {...form.register("nama")} />
              {form.formState.errors.nama && (
                <p className="text-sm text-destructive">{form.formState.errors.nama.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sks">SKS</Label>
              <Input id="sks" type="number" min="1" max="6" {...form.register("sks", { valueAsNumber: true })} />
              {form.formState.errors.sks && (
                <p className="text-sm text-destructive">{form.formState.errors.sks.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="prodi">Program Studi</Label>
              <Input id="prodi" placeholder="Contoh: Teknik Informatika" {...form.register("prodi")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="angkatan">Angkatan</Label>
              <Input id="angkatan" type="number" min="2020" {...form.register("angkatan", { valueAsNumber: true })} />
              {form.formState.errors.angkatan && (
                <p className="text-sm text-destructive">{form.formState.errors.angkatan.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="kelas">Kelas</Label>
              <Input id="kelas" placeholder="Contoh: A, B, TI-1" {...form.register("kelas")} />
              {form.formState.errors.kelas && (
                <p className="text-sm text-destructive">{form.formState.errors.kelas.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Label>Dosen Pengampu</Label>
            <AssigneePicker
              value={form.watch("pengampuIds")}
              onChange={(value) => form.setValue("pengampuIds", value)}
              placeholder="Pilih dosen pengampu..."
            />
            <p className="text-sm text-muted-foreground">
              Pilih satu dosen yang bertanggung jawab mengelola mata kuliah ini
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Switch
                id="hasDefaultSlot"
                checked={form.watch("hasDefaultSlot")}
                onCheckedChange={(checked) => form.setValue("hasDefaultSlot", checked)}
              />
              <Label htmlFor="hasDefaultSlot" className="text-base font-semibold">Jadwal Default</Label>
            </div>
            <p className="text-sm text-muted-foreground -mt-2">
              Atur waktu default untuk mata kuliah ini
            </p>

            {form.watch("hasDefaultSlot") && (
              <div className="space-y-4 p-6 border-2 rounded-lg bg-muted/30 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Hari</Label>
                    <Select
                      value={form.watch("defaultDay")?.toString()}
                      onValueChange={(value) => form.setValue("defaultDay", Number.parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih hari" />
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
                    <Label>Jam Mulai</Label>
                    <Input type="time" {...form.register("defaultStartTime")} />
                  </div>

                  <div className="space-y-2">
                    <Label>Jam Selesai</Label>
                    <Input type="time" {...form.register("defaultEndTime")} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultRuang">Ruang</Label>
                  <Input 
                    id="defaultRuang" 
                    placeholder="Contoh: Lab Komputer 1, Ruang 301" 
                    {...form.register("defaultRuang")} 
                  />
                  <p className="text-xs text-muted-foreground">
                    Lokasi/ruang default untuk mata kuliah ini
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Batal
              </Button>
            )}
            <Button type="submit">{subject ? "Perbarui" : "Tambah"} Mata Kuliah</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
