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
import { ColorPicker } from "@/components/subjects/ColorPicker"
import { AssigneePicker } from "@/components/subjects/AssigneePicker"
import type { Subject } from "@/data/schema"
import { useSubjectsStore } from "@/stores/subjects.store"
import { showSuccess, showError } from "@/lib/alerts"
import { parseTimeToMinutes, minutesToTimeString } from "@/lib/time"

const subjectFormSchema = z
  .object({
    kode: z.string().min(1, "Kode mata kuliah wajib diisi"),
    nama: z.string().min(1, "Nama mata kuliah wajib diisi"),
    sks: z.number().min(1, "SKS minimal 1").max(6, "SKS maksimal 6"),
    semester: z.number().min(1, "Semester minimal 1").max(8, "Semester maksimal 8"),
    prodi: z.string().optional(),
    status: z.enum(["aktif", "arsip"]),
    angkatan: z.number().min(2020, "Angkatan minimal 2020"),
    kelas: z.string().min(1, "Kelas wajib diisi"),
    color: z.string(),
    pengampuIds: z.array(z.string()).default([]),
    hasDefaultSlot: z.boolean(),
    defaultDay: z.number().min(0).max(6).optional(),
    defaultStartTime: z.string().optional(),
    defaultEndTime: z.string().optional(),
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

export function SubjectForm({ subject, onSuccess, onCancel }: SubjectFormProps) {
  const { subjects, addSubject, updateSubject } = useSubjectsStore()

  const form = useForm<SubjectFormData>({
    resolver: zodResolver(subjectFormSchema),
    defaultValues: {
      kode: subject?.kode || "",
      nama: subject?.nama || "",
      sks: subject?.sks || 3,
      semester: subject?.semester || 1,
      prodi: subject?.prodi || "",
      status: subject?.status || "aktif",
      angkatan: subject?.angkatan || 2024,
      kelas: subject?.kelas || "",
      color: subject?.color || "#3b82f6",
      pengampuIds: subject?.pengampuIds || [],
      hasDefaultSlot: !!subject?.slotDefault,
      defaultDay: subject?.slotDefault?.day,
      defaultStartTime: subject?.slotDefault
        ? minutesToTimeString(Math.floor(subject.slotDefault.startUTC / (1000 * 60)) % (24 * 60))
        : "",
      defaultEndTime: subject?.slotDefault
        ? minutesToTimeString(Math.floor(subject.slotDefault.endUTC / (1000 * 60)) % (24 * 60))
        : "",
    },
  })

  const onSubmit = (data: SubjectFormData) => {
    // Check for duplicate kode (excluding current subject if editing)
    const existingSubject = subjects.find(
      (s) => s.kode.toLowerCase() === data.kode.toLowerCase() && s.id !== subject?.id,
    )

    if (existingSubject) {
      showError("Kode mata kuliah sudah digunakan")
      return
    }

    const subjectData: Omit<Subject, "id"> = {
      kode: data.kode,
      nama: data.nama,
      sks: data.sks,
      semester: data.semester,
      prodi: data.prodi,
      status: data.status,
      angkatan: data.angkatan,
      kelas: data.kelas,
      color: data.color,
      pengampuIds: data.pengampuIds,
      slotDefault:
        data.hasDefaultSlot && data.defaultDay !== undefined && data.defaultStartTime && data.defaultEndTime
          ? {
              day: data.defaultDay,
              startUTC: parseTimeToMinutes(data.defaultStartTime) * 60 * 1000,
              endUTC: parseTimeToMinutes(data.defaultEndTime) * 60 * 1000,
            }
          : undefined,
    }

    try {
      if (subject) {
        updateSubject(subject.id, subjectData)
        showSuccess("Mata kuliah berhasil diperbarui")
      } else {
        addSubject(subjectData)
        showSuccess("Mata kuliah berhasil ditambahkan")
      }
      onSuccess?.()
    } catch (error) {
      showError("Terjadi kesalahan saat menyimpan mata kuliah")
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
              <Label htmlFor="semester">Semester</Label>
              <Input
                id="semester"
                type="number"
                min="1"
                max="8"
                {...form.register("semester", { valueAsNumber: true })}
              />
              {form.formState.errors.semester && (
                <p className="text-sm text-destructive">{form.formState.errors.semester.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="prodi">Program Studi</Label>
              <Input id="prodi" placeholder="Contoh: Teknik Informatika" {...form.register("prodi")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(value) => form.setValue("status", value as "aktif" | "arsip")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aktif">Aktif</SelectItem>
                  <SelectItem value="arsip">Arsip</SelectItem>
                </SelectContent>
              </Select>
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

          <div className="space-y-2">
            <Label>Dosen Pengampu</Label>
            <AssigneePicker
              value={form.watch("pengampuIds")}
              onChange={(value) => form.setValue("pengampuIds", value)}
              placeholder="Pilih dosen pengampu..."
            />
            <p className="text-sm text-muted-foreground">Pilih dosen yang berhak mengelola mata kuliah ini</p>
          </div>

          <div className="space-y-2">
            <Label>Warna</Label>
            <ColorPicker value={form.watch("color")} onChange={(color) => form.setValue("color", color)} />
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="hasDefaultSlot"
                checked={form.watch("hasDefaultSlot")}
                onCheckedChange={(checked) => form.setValue("hasDefaultSlot", checked)}
              />
              <Label htmlFor="hasDefaultSlot">Jadwal Default</Label>
            </div>

            {form.watch("hasDefaultSlot") && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
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
