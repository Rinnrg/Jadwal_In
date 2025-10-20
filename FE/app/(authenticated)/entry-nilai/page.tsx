"use client"

import { useSessionStore } from "@/stores/session.store"
import { useSubjectsStore } from "@/stores/subjects.store"
import { useOfferingsStore } from "@/stores/offerings.store"
import { useUsersStore } from "@/stores/users.store"
import { useKrsStore } from "@/stores/krs.store"
import { canAccessEntryNilai } from "@/lib/rbac"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Save, FileDown, Users, BookOpen, TrendingUp, AlertCircle } from "lucide-react"
import { useState, useMemo } from "react"
import { arr } from "@/lib/utils"
import type { Subject } from "@/data/schema"

const gradeOptions = [
  { value: "A", label: "A (4.0)", color: "bg-green-100 text-green-800" },
  { value: "A-", label: "A- (3.7)", color: "bg-green-100 text-green-700" },
  { value: "B+", label: "B+ (3.3)", color: "bg-blue-100 text-blue-800" },
  { value: "B", label: "B (3.0)", color: "bg-blue-100 text-blue-700" },
  { value: "B-", label: "B- (2.7)", color: "bg-blue-100 text-blue-600" },
  { value: "C+", label: "C+ (2.3)", color: "bg-yellow-100 text-yellow-800" },
  { value: "C", label: "C (2.0)", color: "bg-yellow-100 text-yellow-700" },
  { value: "C-", label: "C- (1.7)", color: "bg-yellow-100 text-yellow-600" },
  { value: "D", label: "D (1.0)", color: "bg-orange-100 text-orange-800" },
  { value: "E", label: "E (0.0)", color: "bg-red-100 text-red-800" },
]

export default function EntryNilaiPage() {
  const { session } = useSessionStore()
  const { getSubjectsByPengampu, getSubjectById } = useSubjectsStore()
  const { getOfferingsByPengampu, getOffering } = useOfferingsStore()
  const { getMahasiswaUsers, getUserById } = useUsersStore()
  const { getKrsByOffering } = useKrsStore()
  const [selectedOffering, setSelectedOffering] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [grades, setGrades] = useState<Record<string, string>>({})

  const availableOfferings = useMemo(() => {
    if (!session) return []

    const dummyManajemenProyek = {
      id: "dummy-manajemen-proyek",
      kode: "TI301",
      nama: "Manajemen Proyek",
      semester: 5,
      sks: 3,
      kelas: "A",
      angkatan: 2022,
      status: "aktif" as const,
      color: "#3b82f6",
      pengampuIds: session.role === "dosen" ? [session.id] : [],
    }

    let subjects: Subject[] = []

    if (session.role === "kaprodi") {
      subjects = [...useSubjectsStore.getState().subjects.filter((subject) => subject.status === "aktif")]
      subjects.push(dummyManajemenProyek)
    } else if (session.role === "dosen") {
      // Use the same logic as asynchronous page - get subjects by pengampu
      subjects = [...getSubjectsByPengampu(session.id).filter((subject) => subject.status === "aktif")]
      subjects.push(dummyManajemenProyek)
    }

    return subjects
  }, [session, getSubjectsByPengampu])

  const enrolledStudents = useMemo(() => {
    if (!selectedOffering) return []

    const selectedSubject =
      selectedOffering === "dummy-manajemen-proyek"
        ? availableOfferings.find((s) => s.id === "dummy-manajemen-proyek")
        : availableOfferings.find((s) => s.id === selectedOffering)

    if (!selectedSubject) return []

    if (selectedOffering === "dummy-manajemen-proyek") {
      return [
        {
          id: "dummy-student-1",
          nim: "20220001",
          name: "Ahmad Rizki",
          currentGrade: "B+",
          status: "active",
        },
        {
          id: "dummy-student-2",
          nim: "20220002",
          name: "Sari Dewi",
          currentGrade: "A-",
          status: "active",
        },
        {
          id: "dummy-student-3",
          nim: "20220003",
          name: "Budi Santoso",
          currentGrade: "B",
          status: "active",
        },
      ]
    }

    const krsItems = getKrsByOffering(selectedOffering)
    const mahasiswaUsers = getMahasiswaUsers()

    return arr(krsItems)
      .map((krs) => {
        const student = mahasiswaUsers.find((user) => user.id === krs.userId)
        return student
          ? {
              id: student.id,
              nim: `202${Math.floor(Math.random() * 10000)
                .toString()
                .padStart(4, "0")}`, // Mock NIM
              name: student.name,
              currentGrade: "B+", // Mock current grade
              status: "active",
            }
          : null
      })
      .filter(Boolean)
  }, [selectedOffering, availableOfferings, getKrsByOffering, getMahasiswaUsers])

  const selectedOfferingData =
    selectedOffering === "dummy-manajemen-proyek"
      ? availableOfferings.find((s) => s.id === "dummy-manajemen-proyek")
      : availableOfferings.find((s) => s.id === selectedOffering)

  const filteredStudents = enrolledStudents.filter(
    (student) =>
      student && (student.name.toLowerCase().includes(searchTerm.toLowerCase()) || student.nim.includes(searchTerm)),
  )

  const handleGradeChange = (studentId: string, grade: string) => {
    setGrades((prev) => ({ ...prev, [studentId]: grade }))
  }

  const handleSaveGrades = () => {
    console.log("Saving grades:", grades)
    alert("Nilai berhasil disimpan!")
  }

  const handleExportGrades = () => {
    console.log("Exporting grades for offering:", selectedOffering)
    alert("Export nilai berhasil!")
  }

  const getGradeBadgeColor = (grade: string) => {
    const gradeOption = gradeOptions.find((g) => g.value === grade)
    return gradeOption?.color || "bg-gray-100 text-gray-800"
  }

  if (!session || !canAccessEntryNilai(session.role)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-destructive">Akses Ditolak</CardTitle>
            <CardDescription className="text-center">Anda tidak memiliki akses untuk halaman ini.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (availableOfferings.length === 0) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-balance">Entry Nilai Mahasiswa</h1>
          <p className="text-muted-foreground text-pretty">
            Kelola dan input nilai mahasiswa untuk penawaran mata kuliah yang diampu.
          </p>
        </div>

        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tidak Ada Mata Kuliah</h3>
            <p className="text-muted-foreground">
              {session.role === "dosen"
                ? "Anda belum ditugaskan sebagai pengampu mata kuliah."
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
        <h1 className="text-3xl font-bold tracking-tight text-balance">Entry Nilai Mahasiswa</h1>
        <p className="text-muted-foreground text-pretty">
          Kelola dan input nilai mahasiswa untuk penawaran mata kuliah yang diampu. Pilih penawaran dan masukkan nilai
          untuk setiap mahasiswa.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {session.role === "dosen" ? "Mata Kuliah Diampu" : "Total Mata Kuliah"}
                </p>
                <p className="text-2xl font-bold">{availableOfferings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mahasiswa Terdaftar</p>
                <p className="text-2xl font-bold">{enrolledStudents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nilai Terinput</p>
                <p className="text-2xl font-bold">{Object.keys(grades).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Offering Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Pilih Mata Kuliah</CardTitle>
          <CardDescription>
            {session.role === "dosen"
              ? "Pilih mata kuliah yang Anda ampu untuk melakukan entry nilai"
              : "Pilih mata kuliah untuk melakukan entry nilai mahasiswa"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="offering">Mata Kuliah</Label>
              <Select value={selectedOffering} onValueChange={setSelectedOffering}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih mata kuliah" />
                </SelectTrigger>
                <SelectContent>
                  {availableOfferings.map((subject) => (
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
            <div className="space-y-2">
              <Label htmlFor="search">Cari Mahasiswa</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Cari berdasarkan nama atau NIM"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grades Entry Table */}
      {selectedOffering && selectedOfferingData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  Daftar Mahasiswa - {selectedOfferingData.nama}
                  {selectedOfferingData.kelas && ` (Kelas ${selectedOfferingData.kelas})`}
                </CardTitle>
                <CardDescription>Input nilai untuk {filteredStudents.length} mahasiswa yang terdaftar</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveGrades} className="gap-2">
                  <Save className="h-4 w-4" />
                  Simpan Nilai
                </Button>
                <Button variant="outline" onClick={handleExportGrades} className="gap-2 bg-transparent">
                  <FileDown className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredStudents.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Tidak Ada Mahasiswa</h3>
                <p className="text-muted-foreground">
                  {searchTerm
                    ? "Tidak ada mahasiswa yang sesuai dengan pencarian"
                    : "Belum ada mahasiswa yang mengambil mata kuliah ini"}
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">NIM</TableHead>
                      <TableHead className="font-semibold">Nama Mahasiswa</TableHead>
                      <TableHead className="font-semibold">Nilai Saat Ini</TableHead>
                      <TableHead className="font-semibold">Nilai Baru</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student, index) => (
                      <TableRow key={student!.id} className={index % 2 === 0 ? "bg-card" : "bg-background"}>
                        <TableCell className="font-mono font-medium">{student!.nim}</TableCell>
                        <TableCell className="font-medium">{student!.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getGradeBadgeColor(student!.currentGrade)}>
                            {student!.currentGrade}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={grades[student!.id] || ""}
                            onValueChange={(value) => handleGradeChange(student!.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Pilih nilai" />
                            </SelectTrigger>
                            <SelectContent>
                              {gradeOptions.map((grade) => (
                                <SelectItem key={grade.value} value={grade.value}>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${grade.color.split(" ")[0]}`} />
                                    {grade.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge variant={student!.status === "active" ? "default" : "secondary"}>
                            {student!.status === "active" ? "Aktif" : "Tidak Aktif"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
