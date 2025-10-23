"use client"

import type React from "react"

import { useState } from "react"
import { useOfferingsStore } from "@/stores/offerings.store"
import { useSubjectsStore } from "@/stores/subjects.store"
import type { CourseOffering } from "@/data/schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { showSuccess } from "@/lib/alerts"

interface OfferingFormProps {
  offering?: CourseOffering
  onSuccess: () => void
  onCancel: () => void
}

export function OfferingForm({ offering, onSuccess, onCancel }: OfferingFormProps) {
  const { addOffering, updateOffering } = useOfferingsStore()
  const { subjects } = useSubjectsStore()

  const [formData, setFormData] = useState({
    subjectId: offering?.subjectId || "",
    angkatan: offering?.angkatan || new Date().getFullYear(),
    kelas: offering?.kelas || "",
    semester: offering?.semester || 1,
    term: offering?.term || "",
    capacity: offering?.capacity?.toString() || "",
    status: offering?.status || ("buka" as const),
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const activeSubjects = subjects.filter((subject) => subject.status === "aktif")

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.subjectId) {
      newErrors.subjectId = "Mata kuliah harus dipilih"
    }

    if (!formData.kelas.trim()) {
      newErrors.kelas = "Kelas harus diisi"
    }

    if (formData.angkatan < 2000 || formData.angkatan > 2050) {
      newErrors.angkatan = "Angkatan tidak valid"
    }

    if (formData.semester < 1 || formData.semester > 8) {
      newErrors.semester = "Semester harus antara 1-8"
    }

    if (formData.capacity && (Number.parseInt(String(formData.capacity)) < 1 || Number.parseInt(String(formData.capacity)) > 200)) {
      newErrors.capacity = "Kapasitas harus antara 1-200"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const offeringData: any = {
      subjectId: formData.subjectId,
      angkatan: formData.angkatan,
      kelas: formData.kelas.trim(),
      semester: formData.semester,
      term: formData.term.trim() || undefined,
      capacity: formData.capacity ? Number.parseInt(String(formData.capacity)) : undefined,
      status: formData.status,
    }

    try {
      if (offering) {
        await updateOffering(offering.id, offeringData)
        showSuccess("Penawaran berhasil diperbarui")
      } else {
        await addOffering(offeringData)
        showSuccess("Penawaran berhasil ditambahkan")
      }
      onSuccess()
    } catch (error) {
      console.error('Error saving offering:', error)
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{offering ? "Edit Penawaran" : "Tambah Penawaran"}</CardTitle>
        <CardDescription>
          {offering ? "Perbarui informasi penawaran mata kuliah" : "Buat penawaran mata kuliah baru"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="subjectId">Mata Kuliah *</Label>
              <Select
                value={formData.subjectId}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, subjectId: value }))}
              >
                <SelectTrigger className={errors.subjectId ? "border-red-500" : ""}>
                  <SelectValue placeholder="Pilih mata kuliah" />
                </SelectTrigger>
                <SelectContent>
                  {activeSubjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.kode} - {subject.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.subjectId && <p className="text-sm text-red-500 mt-1">{errors.subjectId}</p>}
            </div>

            <div>
              <Label htmlFor="angkatan">Angkatan *</Label>
              <Input
                id="angkatan"
                type="number"
                min="2000"
                max="2050"
                value={formData.angkatan}
                onChange={(e) => setFormData((prev) => ({ ...prev, angkatan: Number.parseInt(e.target.value) || 0 }))}
                className={errors.angkatan ? "border-red-500" : ""}
              />
              {errors.angkatan && <p className="text-sm text-red-500 mt-1">{errors.angkatan}</p>}
            </div>

            <div>
              <Label htmlFor="kelas">Kelas *</Label>
              <Input
                id="kelas"
                value={formData.kelas}
                onChange={(e) => setFormData((prev) => ({ ...prev, kelas: e.target.value }))}
                placeholder="A, B, TI-1, dll."
                className={errors.kelas ? "border-red-500" : ""}
              />
              {errors.kelas && <p className="text-sm text-red-500 mt-1">{errors.kelas}</p>}
            </div>

            <div>
              <Label htmlFor="semester">Semester *</Label>
              <Select
                value={formData.semester.toString()}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, semester: Number.parseInt(value) }))}
              >
                <SelectTrigger className={errors.semester ? "border-red-500" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <SelectItem key={sem} value={sem.toString()}>
                      Semester {sem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.semester && <p className="text-sm text-red-500 mt-1">{errors.semester}</p>}
            </div>

            <div>
              <Label htmlFor="term">Term (Opsional)</Label>
              <Input
                id="term"
                value={formData.term}
                onChange={(e) => setFormData((prev) => ({ ...prev, term: e.target.value }))}
                placeholder="2024/2025 Ganjil"
              />
            </div>

            <div>
              <Label htmlFor="capacity">Kapasitas (Opsional)</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                max="200"
                value={formData.capacity}
                onChange={(e) => setFormData((prev) => ({ ...prev, capacity: e.target.value }))}
                placeholder="Maksimal mahasiswa"
                className={errors.capacity ? "border-red-500" : ""}
              />
              {errors.capacity && <p className="text-sm text-red-500 mt-1">{errors.capacity}</p>}
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "buka" | "tutup") => setFormData((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buka">Buka</SelectItem>
                  <SelectItem value="tutup">Tutup</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Batal
            </Button>
            <Button type="submit">{offering ? "Perbarui" : "Tambah"} Penawaran</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
