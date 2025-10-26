"use client"

import { useState, useMemo } from "react"
import { Users, CheckCircle, XCircle, Clock, Search, Save, FileDown, BookOpen, TrendingUp, AlertCircle, ChevronRight, ArrowLeft, GraduationCap } from "lucide-react"
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
import Folder from "@/components/ui/folder"

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
  const { getSubjectsByPengampu, subjects } = useSubjectsStore()
  const { getMahasiswaUsers } = useUsersStore()
  const { getKrsBySubject } = useKrsStore()
  
  // Guard: Only dosen and kaprodi can access attendance page
  if (!session || !canAccessAttendance(session.role)) {
    redirect("/dashboard")
    return null
  }
  
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  const [selectedAngkatan, setSelectedAngkatan] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMeeting, setSelectedMeeting] = useState("1")
  const [attendanceData, setAttendanceData] = useState<Record<string, string>>({})

  // Available subjects based on role
  const availableSubjects = useMemo(() => {
    if (!session) return []

    let subjects: Subject[] = []

    if (session.role === "kaprodi") {
      subjects = useSubjectsStore.getState().subjects.filter((subject) => subject.status === "aktif") as Subject[]
    } else if (session.role === "dosen") {
      subjects = getSubjectsByPengampu(session.id).filter((subject) => subject.status === "aktif") as Subject[]
    }

    return subjects
  }, [session, subjects, getSubjectsByPengampu])

  // Group subjects by angkatan for dosen/kaprodi
  const subjectsByAngkatan = useMemo(() => {
    const grouped: Record<string, Record<string, Subject[]>> = {}
    availableSubjects.forEach((subject) => {
      const angkatan = subject.angkatan || 'Tidak Ada Angkatan'
      const kelas = subject.kelas || 'A'
      
      if (!grouped[angkatan]) {
        grouped[angkatan] = {}
      }
      if (!grouped[angkatan][kelas]) {
        grouped[angkatan][kelas] = []
      }
      grouped[angkatan][kelas].push(subject)
    })
    
    return grouped
  }, [availableSubjects])

  // Enrolled students for selected subject
  const enrolledStudents = useMemo(() => {
    if (!selectedSubject) return []

    const krsItems = getKrsBySubject(selectedSubject.id)
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
  }, [selectedSubject, selectedMeeting, getKrsBySubject, getMahasiswaUsers])

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
    console.log("Exporting attendance for subject:", selectedSubject?.id)
    alert("Export kehadiran berhasil!")
  }

  const getAttendanceBadgeColor = (status: string) => {
    const option = attendanceOptions.find((opt) => opt.value === status)
    return option?.color || "bg-gray-100 text-gray-800"
  }

  const handleAngkatanClick = (angkatan: string) => {
    setSelectedAngkatan(angkatan)
  }

  const handleClassClick = (angkatan: string, className: string) => {
    setSelectedAngkatan(angkatan)
    setSelectedClass(className)
  }

  const handleSubjectClick = (subject: Subject) => {
    setSelectedSubject(subject)
  }

  const handleBackToClassList = () => {
    setSelectedClass(null)
    setSelectedSubject(null)
  }

  const handleBackToAngkatanList = () => {
    setSelectedAngkatan(null)
    setSelectedClass(null)
    setSelectedSubject(null)
  }

  const handleBackToSubjectList = () => {
    setSelectedSubject(null)
  }

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
    <div className="space-y-4 md:space-y-6">
      {!selectedSubject ? (
        <>
          {/* Header */}
          <div className="px-3 md:px-4">
            <h1 className="text-lg md:text-2xl lg:text-3xl font-bold tracking-tight">Data Kehadiran Mahasiswa</h1>
            <p className="text-muted-foreground text-xs md:text-sm mt-1">
              Kelola dan input kehadiran mahasiswa untuk mata kuliah yang diampu
            </p>
          </div>

          {/* Statistics Cards - Responsive Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 px-3 md:px-4">
            <Card>
              <CardContent className="p-3 md:p-4 lg:p-6">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] md:text-xs lg:text-sm font-medium text-muted-foreground truncate">
                      {session.role === "dosen" ? "Mata Kuliah Diampu" : "Total Mata Kuliah"}
                    </p>
                    <p className="text-lg md:text-xl lg:text-2xl font-bold">{availableSubjects.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 md:p-4 lg:p-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] md:text-xs lg:text-sm font-medium text-muted-foreground truncate">Angkatan Tersedia</p>
                    <p className="text-lg md:text-xl lg:text-2xl font-bold">{Object.keys(subjectsByAngkatan).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 md:p-4 lg:p-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] md:text-xs lg:text-sm font-medium text-muted-foreground truncate">Total Kelas</p>
                    <p className="text-lg md:text-xl lg:text-2xl font-bold text-green-600">
                      {Object.values(subjectsByAngkatan).reduce((total, classes) => total + Object.keys(classes).length, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 md:p-4 lg:p-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] md:text-xs lg:text-sm font-medium text-muted-foreground truncate">Total Mata Kuliah</p>
                    <p className="text-lg md:text-xl lg:text-2xl font-bold">{availableSubjects.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Show angkatan grouping with Folder component */}
          {!selectedClass ? (
            <div className="px-4 md:px-6 lg:px-8 mt-12 overflow-hidden">
              <div className="space-y-8">
                {Object.entries(subjectsByAngkatan)
                  .sort(([a], [b]) => b.localeCompare(a)) // Sort descending (newest first)
                  .map(([angkatan, classes]) => {
                    const totalClasses = Object.keys(classes).length
                    
                    return (
                      <div key={angkatan} className="space-y-4">
                        {/* Angkatan Header */}
                        <div className="text-center">
                          <h3 className="text-lg md:text-xl font-bold text-foreground mb-1">
                            Pilih Kelas - Angkatan {angkatan}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {totalClasses} kelas tersedia
                          </p>
                        </div>

                        {/* Floating Cards Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 overflow-visible p-2">
                          {Object.entries(classes)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([kelas, classSubjects]) => (
                              <div
                                key={kelas}
                                onClick={() => handleClassClick(angkatan, kelas)}
                                className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-visible border border-gray-100 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 will-change-transform hover:[transform:scale(1.05)] origin-center"
                              >
                                {/* Card Content */}
                                <div className="p-6 flex flex-col items-center gap-4">
                                  {/* Folder Icon */}
                                  <div className="transition-transform group-hover:scale-110 group-hover:-translate-y-1">
                                    <Folder 
                                      size={1} 
                                      color="#60A5FA" 
                                      className=""
                                      items={[]}
                                    />
                                  </div>
                                  
                                  {/* Class Info */}
                                  <div className="text-center space-y-1">
                                    <h4 className="text-base md:text-lg font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                      Kelas {kelas}
                                    </h4>
                                    <p className="text-xs md:text-sm text-muted-foreground">
                                      {classSubjects.length} mata kuliah
                                    </p>
                                  </div>
                                </div>

                                {/* Hover Effect Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-600/0 group-hover:from-blue-500/5 group-hover:to-blue-600/10 transition-all duration-300 pointer-events-none" />
                                
                                {/* Click Ripple Effect */}
                                <div className="absolute inset-0 bg-blue-400/20 opacity-0 group-active:opacity-100 transition-opacity duration-150 pointer-events-none" />
                              </div>
                            ))}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          ) : (
            /* Show subjects in selected class */
            <>
              <div className="px-3 md:px-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToClassList}
                  className="gap-2 -ml-2 hover:bg-muted"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Kembali ke Daftar Angkatan
                </Button>
                <h2 className="text-base md:text-xl font-bold mt-3">
                  Mata Kuliah Kelas {selectedClass} - Angkatan {selectedAngkatan}
                </h2>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {subjectsByAngkatan[selectedAngkatan!]?.[selectedClass]?.length || 0} mata kuliah tersedia
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 px-3 md:px-4">
                {subjectsByAngkatan[selectedAngkatan!]?.[selectedClass]?.map((subject) => (
                  <Card
                    key={subject.id}
                    className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all duration-200 overflow-hidden group"
                    onClick={() => handleSubjectClick(subject)}
                  >
                    <CardHeader className="p-4 pb-3">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                          <BookOpen className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm md:text-base leading-tight line-clamp-2 mb-1">
                            {subject.nama}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground font-medium">
                            {subject.kode}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {subject.sks} SKS
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Semester {subject.semester}
                        </Badge>
                      </div>
                      {subject.prodi && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                          {subject.prodi}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <>
          {/* Back Button & Header */}
          <div className="px-3 md:px-4 space-y-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToSubjectList}
              className="gap-2 -ml-2 hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Daftar Mata Kuliah
            </Button>
            
            <div className="flex items-start gap-3 p-4 bg-card border rounded-lg">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-base md:text-xl lg:text-2xl font-bold leading-tight mb-1">
                  {selectedSubject.nama}
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {selectedSubject.kode} • Semester {selectedSubject.semester} • {selectedSubject.sks} SKS
                  {selectedSubject.kelas && ` • Kelas ${selectedSubject.kelas}`}
                  {selectedSubject.angkatan && ` • Angkatan ${selectedSubject.angkatan}`}
                </p>
                {selectedSubject.prodi && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedSubject.prodi}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Statistics Cards - Responsive Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 px-3 md:px-4">
            <Card>
              <CardContent className="p-3 md:p-4 lg:p-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] md:text-xs lg:text-sm font-medium text-muted-foreground truncate">Mahasiswa Terdaftar</p>
                    <p className="text-lg md:text-xl lg:text-2xl font-bold">{totalStudents}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 md:p-4 lg:p-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] md:text-xs lg:text-sm font-medium text-muted-foreground truncate">Hadir Hari Ini</p>
                    <p className="text-lg md:text-xl lg:text-2xl font-bold text-green-600">{hadirCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 md:p-4 lg:p-6">
                <div className="flex items-center space-x-2">
                  <XCircle className="h-4 w-4 md:h-5 md:w-5 text-red-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] md:text-xs lg:text-sm font-medium text-muted-foreground truncate">Alfa</p>
                    <p className="text-lg md:text-xl lg:text-2xl font-bold text-red-600">{alfaCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 md:p-4 lg:p-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] md:text-xs lg:text-sm font-medium text-muted-foreground truncate">Tingkat Kehadiran</p>
                    <p className="text-lg md:text-xl lg:text-2xl font-bold">{attendanceRate.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Meeting Selection */}
          <Card className="mx-3 md:mx-4">
            <CardHeader className="px-3 md:px-6 pt-3 md:pt-6 pb-2 md:pb-4">
              <CardTitle className="text-sm md:text-base">Filter dan Pencarian</CardTitle>
              <CardDescription className="text-[10px] md:text-xs">
                Pilih pertemuan dan cari mahasiswa untuk input kehadiran
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="meeting" className="text-xs md:text-sm">Pertemuan</Label>
                  <Select value={selectedMeeting} onValueChange={setSelectedMeeting}>
                    <SelectTrigger className="text-xs md:text-sm h-9 md:h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 16 }, (_, i) => i + 1).map((meeting) => (
                        <SelectItem key={meeting} value={meeting.toString()} className="text-xs md:text-sm">
                          Pertemuan {meeting}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="search" className="text-xs md:text-sm">Cari Mahasiswa</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Cari berdasarkan nama atau NIM"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 md:pl-10 text-xs md:text-sm h-9 md:h-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Entry Table */}
          <Card className="mx-3 md:mx-4">
            <CardHeader className="px-3 md:px-6 pt-3 md:pt-6 pb-2 md:pb-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 md:gap-4">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm md:text-base truncate">
                    Daftar Kehadiran - Pertemuan {selectedMeeting}
                  </CardTitle>
                  <CardDescription className="text-[10px] md:text-xs">Input kehadiran untuk {filteredStudents.length} mahasiswa yang terdaftar</CardDescription>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button onClick={handleSaveAttendance} className="gap-1.5 md:gap-2 flex-1 sm:flex-none text-xs md:text-sm h-8 md:h-10">
                    <Save className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    <span className="hidden sm:inline">Simpan Kehadiran</span>
                    <span className="sm:hidden">Simpan</span>
                  </Button>
                  <Button variant="outline" onClick={handleExportAttendance} className="gap-1.5 md:gap-2 bg-transparent px-2 md:px-4 text-xs md:text-sm h-8 md:h-10">
                    <FileDown className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    <span className="hidden md:inline">Export</span>
                  </Button>
                </div>
              </div>
              </CardHeader>
            <CardContent className="px-0 md:px-6 pb-3 md:pb-6">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-6 md:py-8 px-3">
                  <Users className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground mx-auto mb-3 md:mb-4" />
                  <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2">Tidak Ada Mahasiswa</h3>
                  <p className="text-muted-foreground text-xs md:text-sm">
                    {searchTerm
                      ? "Tidak ada mahasiswa yang sesuai dengan pencarian"
                      : "Belum ada mahasiswa yang mengambil mata kuliah ini"}
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block rounded-md border max-h-[600px] overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-muted/50 z-10">
                        <TableRow>
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
                              <Badge variant="secondary" className={`${getAttendanceBadgeColor(student.currentAttendance!)} text-xs`}>
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

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3 px-3">
                    {filteredStudents.map((student) => (
                      <Card key={student.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{student.name}</p>
                              <p className="text-xs text-muted-foreground font-mono">{student.nim}</p>
                            </div>
                            <Badge variant="secondary" className={`${getAttendanceBadgeColor(student.currentAttendance!)} text-xs ml-2`}>
                              {attendanceOptions.find(opt => opt.value === student.currentAttendance)?.label}
                            </Badge>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs text-muted-foreground">Kehadiran Hari Ini</Label>
                              <Select
                                value={attendanceData[student.id] || student.currentAttendance || ""}
                                onValueChange={(value) => handleAttendanceChange(student.id, value)}
                              >
                                <SelectTrigger className="w-full mt-1 h-9 text-xs">
                                  <SelectValue placeholder="Pilih status" />
                                </SelectTrigger>
                                <SelectContent>
                                  {attendanceOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value} className="text-xs">
                                      <div className="flex items-center gap-2">
                                        <option.icon className="h-3.5 w-3.5" />
                                        {option.label}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label className="text-xs text-muted-foreground">Persentase Kehadiran</Label>
                              <div className="flex items-center gap-2 mt-1">
                                <Progress value={student.attendancePercentage} className="flex-1 h-2" />
                                <span className="text-xs font-medium min-w-[40px] text-right">{student.attendancePercentage}%</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
