"use client"

import { useState, useMemo } from "react"
import { Users, CheckCircle, XCircle, Clock, Search, Save, FileDown, BookOpen, TrendingUp, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useSessionStore } from "@/stores/session.store"
import { useSubjectsStore } from "@/stores/subjects.store"
import { useUsersStore } from "@/stores/users.store"
import { useKrsStore } from "@/stores/krs.store"
import { canAccessAttendance } from "@/lib/rbac"
import { redirect } from "next/navigation"
import { arr } from "@/lib/utils"
import type { Subject } from "@/data/schema"

interface Student {
  id: string
  nim: string
  name: string
  currentAttendance?: "hadir" | "alfa" | "izin" | "sakit"
  attendancePercentage?: number
}

const attendanceOptions = [
  { value: "hadir", label: "Hadir", color: "bg-green-100 text-green-800", icon: CheckCircle },
  { value: "alfa", label: "Alfa", color: "bg-red-100 text-red-800", icon: XCircle },
  { value: "izin", label: "Izin", color: "bg-blue-100 text-blue-800", icon: Clock },
  { value: "sakit", label: "Sakit", color: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
]

export default function KehadiranPage() {
  const { session } = useSessionStore()
  const { getSubjectsByPengampu } = useSubjectsStore()
  const { getMahasiswaUsers } = useUsersStore()
  const { getKrsBySubject } = useKrsStore()
  
  // Guard: Only dosen and kaprodi can access attendance page
  if (!session || !canAccessAttendance(session.role)) {
    redirect("/dashboard")
    return null
  }
  
  const [selectedSubject, setSelectedSubject] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMeeting, setSelectedMeeting] = useState("1")
  const [attendanceData, setAttendanceData] = useState<Record<string, string>>({})

  // Available subjects based on role
  const availableSubjects = useMemo(() => {
    if (!session) return []

    const dummyManajemenProyek: Subject = {
      id: "dummy-manajemen-proyek",
      kode: "TI301",
      nama: "Manajemen Proyek",
      semester: 5,
      sks: 3,
      kelas: "A",
      angkatan: 2022,
      status: "aktif" as const,
      color: "#8b5cf6",
      pengampuIds: session.role === "dosen" ? [session.id] : [],
      prodi: "Teknik Informatika",
    }

    let subjects: Subject[] = []

    if (session.role === "kaprodi") {
      subjects = useSubjectsStore.getState().subjects.filter((subject) => subject.status === "aktif") as Subject[]
      subjects.push(dummyManajemenProyek)
    } else if (session.role === "dosen") {
      subjects = getSubjectsByPengampu(session.id).filter((subject) => subject.status === "aktif") as Subject[]
      subjects.push(dummyManajemenProyek)
    }

    return subjects
  }, [session, getSubjectsByPengampu])

  // Enrolled students for selected subject
  const enrolledStudents = useMemo(() => {
    if (!selectedSubject) return []

    const selectedSubjectData =
      selectedSubject === "dummy-manajemen-proyek"
        ? availableSubjects.find((s) => s.id === "dummy-manajemen-proyek")
        : availableSubjects.find((s) => s.id === selectedSubject)

    if (!selectedSubjectData) return []

    if (selectedSubject === "dummy-manajemen-proyek") {
      const meetingData: Record<string, Record<string, string>> = {
        "1": { "dummy-student-1": "hadir", "dummy-student-2": "hadir", "dummy-student-3": "hadir", "dummy-student-4": "hadir" },
        "2": { "dummy-student-1": "hadir", "dummy-student-2": "hadir", "dummy-student-3": "alfa", "dummy-student-4": "hadir" },
        "3": { "dummy-student-1": "hadir", "dummy-student-2": "alfa", "dummy-student-3": "alfa", "dummy-student-4": "hadir" },
        "4": { "dummy-student-1": "hadir", "dummy-student-2": "hadir", "dummy-student-3": "hadir", "dummy-student-4": "hadir" },
        "5": { "dummy-student-1": "hadir", "dummy-student-2": "hadir", "dummy-student-3": "hadir", "dummy-student-4": "izin" },
        "6": { "dummy-student-1": "hadir", "dummy-student-2": "hadir", "dummy-student-3": "hadir", "dummy-student-4": "hadir" },
        "7": { "dummy-student-1": "hadir", "dummy-student-2": "hadir", "dummy-student-3": "alfa", "dummy-student-4": "hadir" },
        "8": { "dummy-student-1": "hadir", "dummy-student-2": "hadir", "dummy-student-3": "hadir", "dummy-student-4": "hadir" },
        "9": { "dummy-student-1": "hadir", "dummy-student-2": "hadir", "dummy-student-3": "hadir", "dummy-student-4": "hadir" },
        "10": { "dummy-student-1": "hadir", "dummy-student-2": "izin", "dummy-student-3": "izin", "dummy-student-4": "hadir" },
        "11": { "dummy-student-1": "hadir", "dummy-student-2": "hadir", "dummy-student-3": "hadir", "dummy-student-4": "hadir" },
        "12": { "dummy-student-1": "hadir", "dummy-student-2": "hadir", "dummy-student-3": "alfa", "dummy-student-4": "alfa" },
        "13": { "dummy-student-1": "hadir", "dummy-student-2": "hadir", "dummy-student-3": "hadir", "dummy-student-4": "hadir" },
        "14": { "dummy-student-1": "alfa", "dummy-student-2": "hadir", "dummy-student-3": "hadir", "dummy-student-4": "hadir" },
        "15": { "dummy-student-1": "hadir", "dummy-student-2": "hadir", "dummy-student-3": "hadir", "dummy-student-4": "izin" },
      }
      
      return [
        {
          id: "dummy-student-1",
          nim: "20220001",
          name: "Ahmad Rizki",
          currentAttendance: meetingData[selectedMeeting]?.["dummy-student-1"] as "hadir" | "alfa" | "izin" | "sakit" || "hadir",
          attendancePercentage: 95,
        },
        {
          id: "dummy-student-2",
          nim: "20220002", 
          name: "Sari Dewi",
          currentAttendance: meetingData[selectedMeeting]?.["dummy-student-2"] as "hadir" | "alfa" | "izin" | "sakit" || "hadir",
          attendancePercentage: 88,
        },
        {
          id: "dummy-student-3",
          nim: "20220003",
          name: "Budi Santoso",
          currentAttendance: meetingData[selectedMeeting]?.["dummy-student-3"] as "hadir" | "alfa" | "izin" | "sakit" || "hadir",
          attendancePercentage: 72,
        },
        {
          id: "dummy-student-4",
          nim: "20220004",
          name: "Dewi Sartika",
          currentAttendance: meetingData[selectedMeeting]?.["dummy-student-4"] as "hadir" | "alfa" | "izin" | "sakit" || "hadir",
          attendancePercentage: 85,
        },
      ]
    }

    const krsItems = getKrsBySubject(selectedSubject)
    const mahasiswaUsers = getMahasiswaUsers()

    return arr(krsItems)
      .map((krs) => {
        const student = mahasiswaUsers.find((user) => user.id === krs.userId)
        return student
          ? {
              id: student.id,
              nim: `202${Math.floor(Math.random() * 10000)
                .toString()
                .padStart(4, "0")}`,
              name: student.name,
              currentAttendance: "hadir" as const,
              attendancePercentage: Math.floor(Math.random() * 20) + 80, // 80-100%
            }
          : null
      })
      .filter(Boolean) as Student[]
  }, [selectedSubject, selectedMeeting, availableSubjects, getKrsBySubject, getMahasiswaUsers])

  const filteredStudents = enrolledStudents.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) || student.nim.includes(searchTerm),
  )

  const handleAttendanceChange = (studentId: string, status: string) => {
    setAttendanceData((prev) => ({ ...prev, [studentId]: status }))
  }

  const handleSaveAttendance = () => {
    console.log("Saving attendance:", attendanceData)
    alert("Data kehadiran berhasil disimpan!")
  }

  const handleExportAttendance = () => {
    console.log("Exporting attendance for subject:", selectedSubject)
    alert("Export kehadiran berhasil!")
  }

  const getAttendanceBadgeColor = (status: string) => {
    const option = attendanceOptions.find((opt) => opt.value === status)
    return option?.color || "bg-gray-100 text-gray-800"
  }

  const selectedSubjectData =
    selectedSubject === "dummy-manajemen-proyek"
      ? availableSubjects.find((s) => s.id === "dummy-manajemen-proyek")
      : availableSubjects.find((s) => s.id === selectedSubject)

  // Statistics
  const totalStudents = enrolledStudents.length
  const hadirCount = enrolledStudents.filter((s) => (attendanceData[s.id] || s.currentAttendance) === "hadir").length
  const alfaCount = enrolledStudents.filter((s) => (attendanceData[s.id] || s.currentAttendance) === "alfa").length
  const izinCount = enrolledStudents.filter((s) => (attendanceData[s.id] || s.currentAttendance) === "izin").length
  const sakitCount = enrolledStudents.filter((s) => (attendanceData[s.id] || s.currentAttendance) === "sakit").length
  const attendanceRate = totalStudents > 0 ? ((hadirCount + izinCount + sakitCount) / totalStudents) * 100 : 0

  if (!session || !canAccessAttendance(session.role)) {
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

  if (availableSubjects.length === 0) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-balance">Data Kehadiran Mahasiswa</h1>
          <p className="text-muted-foreground text-pretty">
            Kelola dan input kehadiran mahasiswa untuk mata kuliah yang diampu.
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
        <h1 className="text-3xl font-bold tracking-tight text-balance">Data Kehadiran Mahasiswa</h1>
        <p className="text-muted-foreground text-pretty">
          Kelola dan input kehadiran mahasiswa untuk mata kuliah yang diampu. Pilih mata kuliah dan masukkan kehadiran
          untuk setiap mahasiswa.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {session.role === "dosen" ? "Mata Kuliah Diampu" : "Total Mata Kuliah"}
                </p>
                <p className="text-2xl font-bold">{availableSubjects.length}</p>
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
                <p className="text-2xl font-bold">{totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hadir Hari Ini</p>
                <p className="text-2xl font-bold text-green-600">{hadirCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tingkat Kehadiran</p>
                <p className="text-2xl font-bold">{attendanceRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Pilih Mata Kuliah</CardTitle>
          <CardDescription>
            {session.role === "dosen"
              ? "Pilih mata kuliah yang Anda ampu untuk melakukan input kehadiran"
              : "Pilih mata kuliah untuk melakukan input kehadiran mahasiswa"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Attendance Entry Table */}
      {selectedSubject && selectedSubjectData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  Daftar Kehadiran - {selectedSubjectData.nama}
                  {selectedSubjectData.kelas && ` (Kelas ${selectedSubjectData.kelas})`}
                </CardTitle>
                <CardDescription>Input kehadiran untuk {filteredStudents.length} mahasiswa yang terdaftar</CardDescription>
                
                {/* Meeting Selection */}
                <div className="flex items-center gap-2 mt-4">
                  <Label htmlFor="meeting" className="text-sm font-medium">
                    Pertemuan:
                  </Label>
                  <Select value={selectedMeeting} onValueChange={setSelectedMeeting}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 15 }, (_, i) => i + 1).map((meeting) => (
                        <SelectItem key={meeting} value={meeting.toString()}>
                          Pertemuan {meeting}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveAttendance} className="gap-2">
                  <Save className="h-4 w-4" />
                  Simpan Kehadiran
                </Button>
                <Button variant="outline" onClick={handleExportAttendance} className="gap-2 bg-transparent">
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
                      <TableHead className="font-semibold">Status Saat Ini</TableHead>
                      <TableHead className="font-semibold">Kehadiran Hari Ini</TableHead>
                      <TableHead className="font-semibold">Persentase Kehadiran</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student, index) => (
                      <TableRow key={student.id} className={index % 2 === 0 ? "bg-card" : "bg-background"}>
                        <TableCell className="font-mono font-medium">{student.nim}</TableCell>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getAttendanceBadgeColor(student.currentAttendance!)}>
                            {attendanceOptions.find(opt => opt.value === student.currentAttendance)?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={attendanceData[student.id] || student.currentAttendance || ""}
                            onValueChange={(value) => handleAttendanceChange(student.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Pilih status" />
                            </SelectTrigger>
                            <SelectContent>
                              {attendanceOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="flex items-center gap-2">
                                    <option.icon className="h-4 w-4" />
                                    {option.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium">{student.attendancePercentage}%</div>
                            <Progress value={student.attendancePercentage} className="w-16 h-2" />
                          </div>
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
