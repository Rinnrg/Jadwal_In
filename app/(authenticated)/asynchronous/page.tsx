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

export default function AsynchronousPage() {
  const { session } = useSessionStore()
  const { getSubjectsByPengampu, getActiveSubjects, getSubjectById } = useSubjectsStore()
  const { getKrsByUser } = useKrsStore()
  const [selectedSubject, setSelectedSubject] = useState("")

  const availableSubjects = useMemo(() => {
    if (!session) return []

    const dummyManajemenProyek = {
      id: "dummy-manajemen-proyek",
      kode: "TI301",
      nama: "Manajemen Proyek",
      semester: 5,
      sks: 3,
      kelas: "A",
      angkatan: "2022",
      status: "aktif" as const,
      pengampuIds: session.role === "dosen" ? [session.id] : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    let subjects = []

    if (session.role === "dosen") {
      subjects = getSubjectsByPengampu(session.id).filter((subject) => subject.status === "aktif")
      // Add dummy course for dosen
      subjects.push(dummyManajemenProyek)
    } else if (session.role === "mahasiswa") {
      // Mahasiswa can see subjects they are enrolled in (KRS)
      const krsItems = getKrsByUser(session.id)
      const activeSubjects = getActiveSubjects()
      subjects = activeSubjects.filter((subject) => arr(krsItems).some((krs) => krs.subjectId === subject.id))
      // Add dummy course for mahasiswa
      subjects.push(dummyManajemenProyek)
    } else if (session.role === "kaprodi") {
      subjects = getActiveSubjects()
      // Add dummy course for kaprodi
      subjects.push(dummyManajemenProyek)
    }

    return subjects
  }, [session, getSubjectsByPengampu, getActiveSubjects, getKrsByUser])

  const selectedSubjectData =
    selectedSubject === "dummy-manajemen-proyek"
      ? availableSubjects.find((s) => s.id === "dummy-manajemen-proyek")
      : getSubjectById(selectedSubject)

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
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-balance">Konten Asynchronous</h1>
          <p className="text-muted-foreground text-pretty">Kelola tugas, materi, dan kehadiran untuk mata kuliah.</p>
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
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-balance">Konten Asynchronous</h1>
        <p className="text-muted-foreground text-pretty">
          {canManage
            ? "Kelola tugas dan materi untuk mata kuliah yang Anda ampu."
            : "Lihat tugas dan materi untuk mata kuliah yang Anda ambil."}
        </p>
      </div>

      {/* Subject Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Pilih Mata Kuliah</CardTitle>
          <CardDescription>
            Pilih mata kuliah untuk {canManage ? "mengelola" : "melihat"} tugas dan materi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="subject">Mata Kuliah</Label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih mata kuliah" />
              </SelectTrigger>
              <SelectContent>
                {availableSubjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {subject.kode} - {subject.nama}
                      </span>
                      <span className="text-sm text-muted-foreground">
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {selectedSubjectData.nama}
            </CardTitle>
            <CardDescription>
              {selectedSubjectData.kode} • Semester {selectedSubjectData.semester} • {selectedSubjectData.sks} SKS
              {selectedSubjectData.kelas && ` • Kelas ${selectedSubjectData.kelas}`}
              {selectedSubjectData.angkatan && ` • Angkatan ${selectedSubjectData.angkatan}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="assignments" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="assignments" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Tugas
                </TabsTrigger>
                <TabsTrigger value="materials" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Materi
                </TabsTrigger>
              </TabsList>

              <TabsContent value="assignments" className="mt-6">
                <AssignmentTab subjectId={selectedSubject} canManage={canManage} userRole={session.role} />
              </TabsContent>

              <TabsContent value="materials" className="mt-6">
                <MaterialTab subjectId={selectedSubject} canManage={canManage} userRole={session.role} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
