"use client"

import { useState, useMemo } from "react"
import { useSessionStore } from "@/stores/session.store"
import { useSubjectsStore } from "@/stores/subjects.store"
import { useKrsStore } from "@/stores/krs.store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { AlertCircle, BookOpen, FileText } from "lucide-react"
import { AssignmentTab } from "@/components/asynchronous/AssignmentTab"
import { MaterialTab } from "@/components/asynchronous/MaterialTab"
import { arr } from "@/lib/utils"
import type { Subject } from "@/data/schema"

export default function AsynchronousPage() {
  const { session } = useSessionStore()
  const { subjects, getSubjectsByPengampu, getActiveSubjects, getSubjectById } = useSubjectsStore()
  const { krsItems, getKrsByUser } = useKrsStore()
  const [selectedSubject, setSelectedSubject] = useState("")

  const availableSubjects = useMemo(() => {
    if (!session) return []

    let subjects: Subject[] = []

    if (session.role === "dosen") {
      subjects = getSubjectsByPengampu(session.id).filter((subject) => subject.status === "aktif") as Subject[]
    } else if (session.role === "mahasiswa") {
      // Mahasiswa can see subjects they are enrolled in (KRS)
      const krsItems = getKrsByUser(session.id)
      const activeSubjects = getActiveSubjects()
      subjects = activeSubjects.filter((subject) => arr(krsItems).some((krs) => krs.subjectId === subject.id)) as Subject[]
    } else if (session.role === "kaprodi") {
      subjects = getActiveSubjects() as Subject[]
    }

    return subjects
  }, [session, subjects, krsItems, getSubjectsByPengampu, getActiveSubjects, getKrsByUser])

  const selectedSubjectData = selectedSubject ? getSubjectById(selectedSubject) : undefined

  const canManage = session?.role === "dosen" || session?.role === "kaprodi"

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-destructive">Akses Ditolak</CardTitle>
            <CardDescription className="text-center">Anda harus login untuk mengakses halaman ini.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (availableSubjects.length === 0) {
    return (
      <div className="space-y-4 md:space-y-6 px-2 md:px-4">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">Konten Asynchronous</h1>
          <p className="text-gray-900 dark:text-gray-100 font-bold text-sm md:text-base">Kelola tugas, materi, dan kehadiran untuk mata kuliah</p>
        </div>

        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tidak Ada Mata Kuliah</h3>
            <p className="text-muted-foreground">
              {session.role === "dosen"
                ? "Anda belum ditugaskan sebagai pengampu mata kuliah."
                : session.role === "mahasiswa"
                  ? "Anda belum mengambil mata kuliah. Silakan lakukan KRS terlebih dahulu."
                  : "Belum ada mata kuliah aktif yang tersedia."}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6 px-2 md:px-4">
      <div>
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">Konten Asynchronous</h1>
        <p className="text-gray-900 dark:text-gray-100 font-bold text-sm md:text-base">
          {canManage
            ? "Kelola tugas dan materi untuk mata kuliah yang Anda ampu"
            : "Lihat tugas dan materi untuk mata kuliah yang Anda ambil"}
        </p>
      </div>

      {/* Subject Selection */}
      <Card>
        <CardHeader className="px-3 md:px-6 pt-3 md:pt-6 pb-2 md:pb-4">
          <CardTitle className="text-sm md:text-base">Pilih Mata Kuliah</CardTitle>
          <CardDescription className="text-[10px] md:text-xs">
            Pilih mata kuliah untuk {canManage ? "mengelola" : "melihat"} tugas dan materi
          </CardDescription>
        </CardHeader>
        <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-xs md:text-sm">Mata Kuliah</Label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="text-xs md:text-sm h-9 md:h-10">
                <SelectValue placeholder="Pilih mata kuliah" />
              </SelectTrigger>
              <SelectContent>
                {availableSubjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id} className="text-xs md:text-sm">
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {subject.kode} - {subject.nama}
                      </span>
                      <span className="text-[10px] md:text-xs text-muted-foreground">
                        Semester {subject.semester} • {subject.sks} SKS
                        {subject.kelas && ` • Kelas ${subject.kelas}`}
                        {subject.angkatan && ` • Angkatan ${subject.angkatan}`}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      {selectedSubject && selectedSubjectData && (
        <Card>
          <CardHeader className="px-3 md:px-6 pt-3 md:pt-6 pb-2 md:pb-4">
            <CardTitle className="flex items-center gap-2 text-sm md:text-base lg:text-lg">
              <BookOpen className="h-4 w-4 md:h-5 md:w-5" />
              {selectedSubjectData.nama}
            </CardTitle>
            <CardDescription className="text-[10px] md:text-xs lg:text-sm">
              {selectedSubjectData.kode} • Semester {selectedSubjectData.semester} • {selectedSubjectData.sks} SKS
              {selectedSubjectData.kelas && ` • Kelas ${selectedSubjectData.kelas}`}
              {selectedSubjectData.angkatan && ` • Angkatan ${selectedSubjectData.angkatan}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
            <Tabs defaultValue="assignments" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="assignments" className="flex items-center gap-2 text-xs md:text-sm">
                  <FileText className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  Tugas
                </TabsTrigger>
                <TabsTrigger value="materials" className="flex items-center gap-2 text-xs md:text-sm">
                  <BookOpen className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  Materi
                </TabsTrigger>
              </TabsList>

              <TabsContent value="assignments" className="mt-4 md:mt-6">
                <AssignmentTab subjectId={selectedSubject} canManage={canManage} userRole={session.role} />
              </TabsContent>

              <TabsContent value="materials" className="mt-4 md:mt-6">
                <MaterialTab subjectId={selectedSubject} canManage={canManage} userRole={session.role} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
