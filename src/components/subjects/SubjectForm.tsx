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
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { AssigneePicker } from "@/components/subjects/AssigneePicker"
import type { Subject } from "@/data/schema"
import { useSubjectsStore } from "@/stores/subjects.store"
import { useOfferingsStore } from "@/stores/offerings.store"
import { showSuccess, showError } from "@/lib/alerts"
import { parseTimeToMinutes, minutesToTimeString } from "@/lib/time"
import { useState, useEffect } from "react"

interface KelasSchedule {
  kelas: string
  day?: number
  startTime?: string
  endTime?: string
  ruang?: string
  pengampuIds?: string[]
}

const subjectFormSchema = z
  .object({
    nama: z.string().min(1, "Nama mata kuliah wajib diisi"),
    sks: z.number().min(1, "SKS minimal 1").max(6, "SKS maksimal 6"),
    angkatan: z.number().min(2020, "Angkatan minimal 2020"),
    kelasList: z.array(z.string()).min(1, "Minimal pilih 1 kelas"),
    color: z.string(),
    hasManualSchedule: z.boolean(),
  })

type SubjectFormData = z.infer<typeof subjectFormSchema>

interface SubjectFormProps {
  subject?: Subject
  onSuccess?: () => void
  onCancel?: () => void
}

const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]

// Available class options
const kelasOptions = ["A", "B", "C", "D", "E", "F", "G", "H"]

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

// Generate code with format: 2 first letters + Kelas + 3 digit number
// Example: Mata Kuliah "Pemrograman Dasar" Kelas A -> PDA001
const generateSubjectCode = (subjects: Subject[], subjectName: string, kelas: string) => {
  // Get first 2 letters from subject name (uppercase)
  const words = subjectName.trim().split(/\s+/)
  let prefix = ''
  
  if (words.length >= 2) {
    // Take first letter from first 2 words
    prefix = (words[0][0] + words[1][0]).toUpperCase()
  } else if (words.length === 1 && words[0].length >= 2) {
    // Take first 2 letters from single word
    prefix = words[0].substring(0, 2).toUpperCase()
  } else {
    prefix = 'MK' // Default prefix
  }
  
  // Get existing codes with same prefix and class
  const codePattern = new RegExp(`^${prefix}${kelas}\\d{3}$`)
  const existingNumbers = subjects
    .map(s => s.kode)
    .filter(k => codePattern.test(k))
    .map(k => parseInt(k.substring(prefix.length + 1))) // Skip prefix + kelas
    .filter(n => !isNaN(n))
  
  let nextNumber = 1
  while (existingNumbers.includes(nextNumber)) {
    nextNumber++
  }
  
  return `${prefix}${kelas}${String(nextNumber).padStart(3, '0')}`
}

// Generate default schedule based on SKS
const generateDefaultSchedule = (sks: number, dayOffset: number = 0) => {
  const days = [1, 2, 3, 4, 5] // Senin - Jumat
  const dayIndex = dayOffset % days.length
  const day = days[dayIndex]
  
  // Calculate time based on SKS (each SKS = 50 minutes)
  const startHour = 8 + (dayOffset * 2) % 6 // Vary start time 8-14
  const durationMinutes = sks * 50
  const endMinutes = (startHour * 60) + durationMinutes
  const endHour = Math.floor(endMinutes / 60)
  const endMin = endMinutes % 60
  
  return {
    day,
    startTime: `${String(startHour).padStart(2, '0')}:00`,
    endTime: `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`,
  }
}

// Generate room code (A10.lantai.nomor)
const generateRoomCode = (classIndex: number) => {
  const floor = Math.floor(classIndex / 20) + 1
  const roomNumber = (classIndex % 20) + 1
  return `A10.${String(floor).padStart(2, '0')}.${String(roomNumber).padStart(2, '0')}`
}

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

// Calculate end time based on start time and SKS
const calculateEndTime = (startTime: string, sks: number): string => {
  if (!startTime) return ''
  
  const startMinutes = parseTimeToMinutes(startTime)
  const durationMinutes = sks * 50 // 1 SKS = 50 minutes
  const endMinutes = startMinutes + durationMinutes
  
  const hours = Math.floor(endMinutes / 60)
  const minutes = endMinutes % 60
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function SubjectForm({ subject, onSuccess, onCancel }: SubjectFormProps) {
  const { subjects, addSubject, updateSubject } = useSubjectsStore()
  const { addOffering } = useOfferingsStore()
  const [selectedKelas, setSelectedKelas] = useState<string[]>(subject?.kelas ? [subject.kelas] : [])
  const [kelasInput, setKelasInput] = useState("")
  const [kelasSchedules, setKelasSchedules] = useState<KelasSchedule[]>([])

  const form = useForm<SubjectFormData>({
    resolver: zodResolver(subjectFormSchema),
    defaultValues: {
      nama: subject?.nama || "",
      sks: subject?.sks || 3,
      angkatan: subject?.angkatan || 2024,
      kelasList: subject?.kelas ? [subject.kelas] : [],
      color: subject?.color || getRandomColor(),
      hasManualSchedule: false,
    },
  })

  // Sync selectedKelas with form
  useEffect(() => {
    form.setValue("kelasList", selectedKelas)
    
    // Update kelasSchedules when selectedKelas changes
    const newSchedules = selectedKelas.map(kelas => {
      const existing = kelasSchedules.find(s => s.kelas === kelas)
      if (existing) {
        return existing
      }
      // Initialize with pengampuIds from subject if editing
      return { 
        kelas,
        pengampuIds: subject?.kelas === kelas ? subject.pengampuIds : []
      }
    })
    setKelasSchedules(newSchedules)
  }, [selectedKelas, form])

  const handleAddKelas = (kelas: string) => {
    if (kelas && !selectedKelas.includes(kelas)) {
      setSelectedKelas([...selectedKelas, kelas])
      setKelasInput("")
    }
  }

  const handleRemoveKelas = (kelas: string) => {
    setSelectedKelas(selectedKelas.filter(k => k !== kelas))
    setKelasSchedules(kelasSchedules.filter(s => s.kelas !== kelas))
  }

  const updateKelasSchedule = (kelas: string, field: keyof KelasSchedule, value: any) => {
    setKelasSchedules(prev => 
      prev.map(s => {
        if (s.kelas === kelas) {
          const updated = { ...s, [field]: value }
          
          // Auto-calculate end time when start time changes
          if (field === 'startTime' && value) {
            const sks = form.watch('sks')
            updated.endTime = calculateEndTime(value, sks)
          }
          
          return updated
        }
        return s
      })
    )
  }

  // Check for schedule conflicts
  const checkScheduleConflict = (schedules: KelasSchedule[]): string | null => {
    for (let i = 0; i < schedules.length; i++) {
      const s1 = schedules[i]
      if (!s1.day || !s1.startTime || !s1.endTime) continue

      const start1 = parseTimeToMinutes(s1.startTime)
      const end1 = parseTimeToMinutes(s1.endTime)

      for (let j = i + 1; j < schedules.length; j++) {
        const s2 = schedules[j]
        if (!s2.day || !s2.startTime || !s2.endTime) continue

        // Same day check
        if (s1.day === s2.day) {
          const start2 = parseTimeToMinutes(s2.startTime)
          const end2 = parseTimeToMinutes(s2.endTime)

          // Check overlap
          if ((start1 < end2 && end1 > start2) || (start2 < end1 && end2 > start1)) {
            return `Jadwal bentrok antara Kelas ${s1.kelas} dan Kelas ${s2.kelas} pada hari ${dayNames[s1.day]}`
          }
        }
      }
    }
    return null
  }

  const onSubmit = async (data: SubjectFormData) => {
    if (selectedKelas.length === 0) {
      showError("Minimal pilih 1 kelas")
      return
    }

    // Validate that each class has at least one pengampu
    for (const schedule of kelasSchedules) {
      if (!schedule.pengampuIds || schedule.pengampuIds.length === 0) {
        showError(`Kelas ${schedule.kelas} belum memiliki dosen pengampu`)
        return
      }
    }

    // Validate manual schedules if enabled
    if (data.hasManualSchedule) {
      // Check if all schedules are filled
      for (const schedule of kelasSchedules) {
        if (!schedule.day || !schedule.startTime || !schedule.endTime) {
          showError(`Jadwal untuk Kelas ${schedule.kelas} belum lengkap`)
          return
        }
      }

      // Check for conflicts
      const conflict = checkScheduleConflict(kelasSchedules)
      if (conflict) {
        showError(conflict)
        return
      }
    }

    // EDIT MODE: Update current subject + create new ones for additional classes
    if (subject) {
      try {
        let updatedCount = 0
        let createdCount = 0
        
        // Get the original class of the subject being edited
        const originalKelas = subject.kelas
        
        for (let i = 0; i < selectedKelas.length; i++) {
          const kelas = selectedKelas[i]
          
          // Get pengampuIds for this class
          const kelasSchedule = kelasSchedules.find(s => s.kelas === kelas)
          const pengampuIds = kelasSchedule?.pengampuIds || []
          
          // Determine schedule for this class
          let scheduleData: any = {}
          
          if (data.hasManualSchedule) {
            if (kelasSchedule && kelasSchedule.day !== undefined && kelasSchedule.startTime && kelasSchedule.endTime) {
              scheduleData = {
                slotDay: kelasSchedule.day,
                slotStartUTC: parseTimeToMinutes(kelasSchedule.startTime) * 60 * 1000,
                slotEndUTC: parseTimeToMinutes(kelasSchedule.endTime) * 60 * 1000,
                slotRuang: kelasSchedule.ruang || generateRoomCode(i),
              }
            }
          } else {
            const schedule = generateDefaultSchedule(data.sks, i)
            scheduleData = {
              slotDay: schedule.day,
              slotStartUTC: parseTimeToMinutes(schedule.startTime) * 60 * 1000,
              slotEndUTC: parseTimeToMinutes(schedule.endTime) * 60 * 1000,
              slotRuang: generateRoomCode(i),
            }
          }

          const subjectData: any = {
            nama: data.nama,
            sks: data.sks,
            prodi: "S1 Pendidikan Teknologi Informasi",
            angkatan: data.angkatan,
            kelas,
            color: data.color,
            pengampuIds,
            ...scheduleData,
          }

          // Check if this is the original class being edited
          if (kelas === originalKelas) {
            // Update the existing subject
            await updateSubject(subject.id, subjectData)
            updatedCount++
          } else {
            // Check for duplicate before creating new
            const existingSubject = subjects.find(
              (s) => s.nama.toLowerCase() === data.nama.toLowerCase() && 
                     s.angkatan === data.angkatan && 
                     s.kelas === kelas &&
                     s.id !== subject.id
            )

            if (existingSubject) {
              showError(`Mata kuliah "${data.nama}" kelas ${kelas} sudah ada untuk angkatan ${data.angkatan}`)
              continue
            }

            // Create new subject with unique code
            const kode = generateSubjectCode(subjects, data.nama, kelas)
            await addSubject({
              kode,
              ...subjectData,
              semester: 1,
              status: "aktif",
            })
            createdCount++
          }
        }
        
        const messages = []
        if (updatedCount > 0) messages.push(`${updatedCount} mata kuliah diperbarui`)
        if (createdCount > 0) messages.push(`${createdCount} mata kuliah baru ditambahkan`)
        
        showSuccess(messages.join(", "))
        onSuccess?.()
      } catch (error) {
        console.error('Error saving subject:', error)
        showError(error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan mata kuliah")
      }
      return
    }

    try {
      // Pre-generate codes for all selected classes
      const generatedCodes: string[] = []
      const tempSubjects = [...subjects]
      
      for (let i = 0; i < selectedKelas.length; i++) {
        const kelas = selectedKelas[i]
        const kode = generateSubjectCode(tempSubjects, data.nama, kelas)
        generatedCodes.push(kode)
        
        // Add to temp list to prevent duplicate codes
        tempSubjects.push({
          id: `temp-${i}`,
          kode,
          nama: data.nama,
          kelas,
        } as Subject)
      }
      
      let createdCount = 0
      
      // Create subject for each selected class with pre-generated codes
      for (let i = 0; i < selectedKelas.length; i++) {
        const kelas = selectedKelas[i]
        const kode = generatedCodes[i]
        
        // Get pengampuIds for this class
        const kelasSchedule = kelasSchedules.find(s => s.kelas === kelas)
        const pengampuIds = kelasSchedule?.pengampuIds || []
        
        // Determine schedule
        let scheduleData: any = {}
        
        if (data.hasManualSchedule) {
          // Use manual schedule for this specific class
          if (kelasSchedule && kelasSchedule.day !== undefined && kelasSchedule.startTime && kelasSchedule.endTime) {
            scheduleData = {
              slotDay: kelasSchedule.day,
              slotStartUTC: parseTimeToMinutes(kelasSchedule.startTime) * 60 * 1000,
              slotEndUTC: parseTimeToMinutes(kelasSchedule.endTime) * 60 * 1000,
              slotRuang: kelasSchedule.ruang || generateRoomCode(i),
            }
          }
        } else {
          // Auto-generate schedule (different day for each class to avoid conflict)
          const schedule = generateDefaultSchedule(data.sks, i)
          scheduleData = {
            slotDay: schedule.day,
            slotStartUTC: parseTimeToMinutes(schedule.startTime) * 60 * 1000,
            slotEndUTC: parseTimeToMinutes(schedule.endTime) * 60 * 1000,
            slotRuang: generateRoomCode(i),
          }
        }

        // Transform data to match Prisma schema
        const subjectData: any = {
          kode,
          nama: data.nama,
          sks: data.sks,
          prodi: "S1 Pendidikan Teknologi Informasi", // Default program studi
          angkatan: data.angkatan,
          kelas,
          color: data.color,
          pengampuIds,
          semester: 1, // default semester
          status: "aktif", // default status
          ...scheduleData,
        }

        // Check for duplicate subject with same name, angkatan, and kelas
        const existingSubject = subjects.find(
          (s) => s.nama.toLowerCase() === data.nama.toLowerCase() && 
                 s.angkatan === data.angkatan && 
                 s.kelas === kelas
        )

        if (existingSubject) {
          showError(`Mata kuliah "${data.nama}" kelas ${kelas} sudah ada untuk angkatan ${data.angkatan}`)
          continue
        }

        // API will automatically create course offering
        await addSubject(subjectData)
        createdCount++
      }
      
      if (createdCount > 0) {
        showSuccess(
          `Berhasil menambahkan ${createdCount} mata kuliah${createdCount > 1 ? ` (Kode: ${generatedCodes.slice(0, createdCount).join(', ')})` : ` (Kode: ${generatedCodes[0]})`}`
        )
        onSuccess?.()
      } else {
        showError("Tidak ada mata kuliah yang berhasil ditambahkan")
      }
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
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="nama">Nama Mata Kuliah</Label>
              <Input id="nama" placeholder="Contoh: Pemrograman Dasar" {...form.register("nama")} />
              {form.formState.errors.nama && (
                <p className="text-sm text-destructive">{form.formState.errors.nama.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Kode akan di-generate otomatis dengan format: <strong>2 huruf depan + Kelas + 3 digit</strong>
                <br />
                Contoh: "Pemrograman Dasar" Kelas A → <strong>PDA001</strong>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sks">SKS</Label>
              <Input id="sks" type="number" min="1" max="6" {...form.register("sks", { valueAsNumber: true })} />
              {form.formState.errors.sks && (
                <p className="text-sm text-destructive">{form.formState.errors.sks.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="angkatan">Angkatan</Label>
              <Input id="angkatan" type="number" min="2020" {...form.register("angkatan", { valueAsNumber: true })} />
              {form.formState.errors.angkatan && (
                <p className="text-sm text-destructive">{form.formState.errors.angkatan.message}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Kelas</Label>
              {subject && (
                <div className="p-3 mb-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                    💡 Mode Edit: Kelas <strong>{subject.kelas}</strong> akan diperbarui. Jika memilih kelas tambahan, akan membuat mata kuliah baru dengan kode unik.
                  </p>
                </div>
              )}
              <div className="flex gap-2">
                <Select 
                  value={kelasInput} 
                  onValueChange={(value) => {
                    handleAddKelas(value)
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Pilih kelas..." />
                  </SelectTrigger>
                  <SelectContent>
                    {kelasOptions.map((kelas) => (
                      <SelectItem 
                        key={kelas} 
                        value={kelas}
                        disabled={selectedKelas.includes(kelas)}
                      >
                        Kelas {kelas}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedKelas.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 p-3 border rounded-md bg-muted/30">
                  {selectedKelas.map((kelas) => (
                    <Badge 
                      key={kelas} 
                      variant={subject && kelas === subject.kelas ? "default" : "secondary"} 
                      className="gap-1"
                    >
                      Kelas {kelas} {subject && kelas === subject.kelas && "(Update)"}
                      <button
                        type="button"
                        onClick={() => handleRemoveKelas(kelas)}
                        className="ml-1 hover:bg-destructive/20 rounded-full"
                        aria-label={`Hapus kelas ${kelas}`}
                        title={`Hapus kelas ${kelas}`}
                        disabled={subject && kelas === subject.kelas && selectedKelas.length === 1}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              {form.formState.errors.kelasList && (
                <p className="text-sm text-destructive">{form.formState.errors.kelasList.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {subject 
                  ? `Kelas ${subject.kelas} akan di-update. Kelas tambahan akan membuat mata kuliah baru.`
                  : "Pilih satu atau lebih kelas. Setiap kelas akan membuat mata kuliah terpisah dengan kode unik."}
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label>Program Studi</Label>
                <Badge variant="outline">Default</Badge>
              </div>
              <Input value="S1 Pendidikan Teknologi Informasi" disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Program studi default untuk semua mata kuliah</p>
            </div>

            {selectedKelas.length > 0 && (
              <div className="space-y-3 md:col-span-2 pt-2 border-t">
                <Label className="text-base font-semibold">Dosen Pengampu Per Kelas</Label>
                <p className="text-sm text-muted-foreground -mt-1">
                  Pilih dosen pengampu untuk setiap kelas yang dipilih
                </p>
                {kelasSchedules.map((schedule) => (
                  <Card key={schedule.kelas} className="border-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Badge variant={subject && schedule.kelas === subject.kelas ? "default" : "secondary"}>
                          Kelas {schedule.kelas}
                        </Badge>
                        {subject && schedule.kelas === subject.kelas && (
                          <span className="text-xs text-muted-foreground font-normal">(akan diperbarui)</span>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AssigneePicker
                        value={schedule.pengampuIds || []}
                        onChange={(value) => updateKelasSchedule(schedule.kelas, 'pengampuIds', value)}
                        placeholder={`Pilih dosen pengampu untuk kelas ${schedule.kelas}...`}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Switch
                id="hasManualSchedule"
                checked={form.watch("hasManualSchedule")}
                onCheckedChange={(checked) => form.setValue("hasManualSchedule", checked)}
              />
              <Label htmlFor="hasManualSchedule" className="text-base font-semibold">Atur Jadwal Manual Per Kelas</Label>
            </div>
            <p className="text-sm text-muted-foreground -mt-2">
              {form.watch("hasManualSchedule") 
                ? "Atur jadwal untuk setiap kelas secara manual. Sistem akan memvalidasi agar tidak ada jadwal yang bentrok."
                : "Jika tidak dicentang, jadwal akan otomatis di-generate untuk setiap kelas (Senin-Jumat, waktu sesuai SKS, tidak bentrok)"}
            </p>

            {form.watch("hasManualSchedule") && selectedKelas.length > 0 && (
              <div className="space-y-4 mt-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                    💡 Tips: Pastikan jadwal antar kelas tidak bentrok agar tidak terjadi konflik
                  </p>
                </div>
                
                {kelasSchedules.map((schedule, index) => (
                  <Card key={schedule.kelas} className="border-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Badge variant="outline" className="text-sm">Kelas {schedule.kelas}</Badge>
                        <span className="text-sm font-normal text-muted-foreground">
                          - Jadwal untuk kelas {schedule.kelas}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Hari</Label>
                          <Select
                            value={schedule.day?.toString()}
                            onValueChange={(value) => updateKelasSchedule(schedule.kelas, 'day', Number.parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih hari" />
                            </SelectTrigger>
                            <SelectContent>
                              {dayNames.map((day, idx) => (
                                <SelectItem key={idx} value={idx.toString()}>
                                  {day}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Jam Mulai</Label>
                          <Input 
                            type="time" 
                            value={schedule.startTime || ''}
                            onChange={(e) => updateKelasSchedule(schedule.kelas, 'startTime', e.target.value)}
                            placeholder="08:00"
                          />
                          <p className="text-xs text-muted-foreground">
                            Jam selesai akan otomatis ter-set sesuai SKS
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label>Jam Selesai</Label>
                          <div className="relative">
                            <Input 
                              type="time" 
                              value={schedule.endTime || ''}
                              disabled
                              className="bg-muted cursor-not-allowed"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Badge variant="secondary" className="text-xs">Auto</Badge>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Dihitung otomatis: {form.watch('sks')} SKS × 50 menit
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Ruang</Label>
                        <Select
                          value={schedule.ruang || ''}
                          onValueChange={(value) => updateKelasSchedule(schedule.kelas, 'ruang', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih ruangan (opsional)" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            <SelectItem value="">
                              <span className="text-muted-foreground">Auto-generate</span>
                            </SelectItem>
                            {generateRoomOptions().map((room) => (
                              <SelectItem key={room} value={room}>
                                {room} (Lantai {room.split('.')[1]}, Ruang {room.split('.')[2]})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Tersedia: Lantai 01-05, Ruang 01-20. Kosongkan untuk auto-generate.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
