"use client"

import { useState, useMemo, useEffect } from "react"
import { useSessionStore } from "@/stores/session.store"
import { useSubjectsStore } from "@/stores/subjects.store"
import { useOfferingsStore } from "@/stores/offerings.store"
import { useUsersStore } from "@/stores/users.store"
import { useKrsStore } from "@/stores/krs.store"
import { useCourseworkStore } from "@/stores/coursework.store"
import { useSubmissionsStore } from "@/stores/submissions.store"
import { useRealtimeSync } from "@/hooks/use-realtime-sync"
import { canAccessEntryNilai } from "@/lib/rbac"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Save, FileDown, Users, BookOpen, TrendingUp, AlertCircle, Info, ChevronRight, ArrowLeft } from "lucide-react"
import { arr } from "@/lib/utils"
import type { Subject } from "@/data/schema"
import { gradeOptions, getGradeFromScore, getGradeColor } from "@/components/grade-info-card"
import Folder from "@/components/ui/folder"

export default function EntryNilaiPage() {
  const { session } = useSessionStore()
  const { getSubjectsByPengampu, getSubjectById, subjects } = useSubjectsStore()
  const { getOfferingsByPengampu, getOffering, offerings } = useOfferingsStore()
  const { getMahasiswaUsers, getUserById } = useUsersStore()
  const { getKrsByOffering, krsItems } = useKrsStore()
  const { getAttendanceBySubject } = useCourseworkStore()
  const { getSubmissionByStudent, getSubmissionsByAssignment } = useSubmissionsStore()
  const { getAssignmentsBySubject } = useCourseworkStore()
  
  // Force re-render trigger for reactive updates
  const [, setForceUpdate] = useState(0)
  
  // Enable real-time sync for Entry Nilai page
  useRealtimeSync({
    enabled: true,
    pollingInterval: 2000, // 2 seconds for real-time updates
  })
  
  // Force update when store data changes
  useEffect(() => {
    setForceUpdate(prev => prev + 1)
  }, [subjects.length, offerings.length, krsItems.length])
  
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  const [selectedAngkatan, setSelectedAngkatan] = useState<string | null>(null)
  const [selectedOffering, setSelectedOffering] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [grades, setGrades] = useState<Record<string, { nilaiAngka?: number; nilaiHuruf?: string }>>({})

  const availableOfferings = useMemo(() => {
    if (!session) return []

    let subjects: Subject[] = []

    if (session.role === "kaprodi") {
      subjects = [...useSubjectsStore.getState().subjects.filter((subject) => subject.status === "aktif")]
    } else if (session.role === "dosen") {
      // Use the same logic as asynchronous page - get subjects by pengampu
      subjects = [...getSubjectsByPengampu(session.id).filter((subject) => subject.status === "aktif")]
    }

    return subjects
  }, [session, subjects, getSubjectsByPengampu])

  // Group subjects by angkatan and class
  const subjectsByAngkatan = useMemo(() => {
    const grouped: Record<string, Record<string, Subject[]>> = {}
    availableOfferings.forEach((subject) => {
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
  }, [availableOfferings])

  const enrolledStudents = useMemo(() => {
    if (!selectedSubject) return []

    const krsItems = getKrsByOffering(selectedSubject.id)
    const mahasiswaUsers = getMahasiswaUsers()
    const attendanceSessions = getAttendanceBySubject(selectedSubject.id)
    const assignments = getAssignmentsBySubject(selectedSubject.id)

    return arr(krsItems)
      .map((krs) => {
        const student = mahasiswaUsers.find((user) => user.id === krs.userId)
        if (!student) return null

        // Calculate attendance percentage
        const studentAttendance = attendanceSessions.map(session => 
          session.records.find(r => r.studentId === student.id)
        )
        const hadirCount = studentAttendance.filter(a => a?.status === "hadir").length
        const attendancePercentage = attendanceSessions.length > 0 
          ? Math.round((hadirCount / attendanceSessions.length) * 100) 
          : 0

        // Calculate assignment completion
        const submittedAssignments = assignments.filter(assignment => {
          const submission = getSubmissionByStudent(assignment.id, student.id)
          return submission && (submission.status === "submitted" || submission.status === "graded")
        }).length
        const assignmentPercentage = assignments.length > 0
          ? Math.round((submittedAssignments / assignments.length) * 100)
          : 0

        // Get UTS score (meeting 8)
        const utsSession = attendanceSessions.find(s => s.sessionType === "UTS")
        const utsAssignment = assignments.find(a => 
          a.title.toLowerCase().includes("uts") || 
          a.title.toLowerCase().includes("ujian tengah")
        )
        const utsSubmission = utsAssignment ? getSubmissionByStudent(utsAssignment.id, student.id) : null
        const utsScore = utsSubmission?.grade

        // Get UAS score (meeting 16)
        const uasSession = attendanceSessions.find(s => s.sessionType === "UAS")
        const uasAssignment = assignments.find(a => 
          a.title.toLowerCase().includes("uas") || 
          a.title.toLowerCase().includes("ujian akhir")
        )
        const uasSubmission = uasAssignment ? getSubmissionByStudent(uasAssignment.id, student.id) : null
        const uasScore = uasSubmission?.grade

        return {
          id: student.id,
          nim: `202${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`,
          name: student.name,
          currentGrade: "B+",
          status: "active",
          attendancePercentage,
          assignmentCompletion: assignmentPercentage,
          assignmentCount: { submitted: submittedAssignments, total: assignments.length },
          utsScore,
          uasScore,
        }
      })
      .filter(Boolean)
  }, [selectedOffering, availableOfferings, krsItems, getKrsByOffering, getMahasiswaUsers, getAttendanceBySubject, getAssignmentsBySubject, getSubmissionByStudent])

  const selectedOfferingData = availableOfferings.find((s) => s.id === selectedOffering)

  const filteredStudents = enrolledStudents.filter(
    (student) =>
      student && (student.name.toLowerCase().includes(searchTerm.toLowerCase()) || student.nim.includes(searchTerm)),
  )

  const handleScoreChange = (studentId: string, score: number) => {
    const grade = getGradeFromScore(score)
    setGrades((prev) => ({
      ...prev,
      [studentId]: { nilaiAngka: score, nilaiHuruf: grade.value },
    }))
  }

  const handleGradeChange = (studentId: string, gradeValue: string) => {
    const grade = gradeOptions.find(g => g.value === gradeValue)
    if (grade) {
      // Use middle of range as default score
      const defaultScore = Math.round((grade.minScore + grade.maxScore) / 2)
      setGrades((prev) => ({
        ...prev,
        [studentId]: { nilaiAngka: prev[studentId]?.nilaiAngka || defaultScore, nilaiHuruf: gradeValue },
      }))
    }
  }

  const handleSaveGrades = () => {
    console.log("Saving grades:", grades)
    alert("Nilai berhasil disimpan!")
  }

  // Calculate statistics
  const totalGraded = Object.keys(grades).length
  const averageScore = totalGraded > 0 
    ? Object.values(grades).reduce((sum, g) => sum + (g.nilaiAngka || 0), 0) / totalGraded 
    : 0
  const averageGPA = totalGraded > 0
    ? Object.values(grades).reduce((sum, g) => {
        const grade = gradeOptions.find(opt => opt.value === g.nilaiHuruf)
        return sum + (grade?.bobot || 0)
      }, 0) / totalGraded
    : 0

  const handleExportGrades = () => {
    console.log("Exporting grades for offering:", selectedOffering)
    alert("Export nilai berhasil!")
  }

  // Navigation handlers for angkatan/class/subject selection
  const handleClassClick = (angkatan: string, kelas: string) => {
    setSelectedAngkatan(angkatan)
    setSelectedClass(kelas)
  }

  const handleSubjectClick = (subject: Subject) => {
    setSelectedSubject(subject)
    // Also set selectedOffering for backward compatibility with existing code
    setSelectedOffering(subject.id)
  }

  const handleBackToSubjectList = () => {
    setSelectedSubject(null)
    setSelectedOffering("")
    setGrades({})
  }

  const handleBackToClassList = () => {
    setSelectedClass(null)
    setSelectedAngkatan(null)
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
    <div className="space-y-4 md:space-y-6">
      <div className="space-y-1 md:space-y-2">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-balance">Entry Nilai Mahasiswa</h1>
        <p className="text-muted-foreground text-pretty text-xs md:text-sm">
          Kelola dan input nilai mahasiswa untuk penawaran mata kuliah yang diampu. Pilih penawaran dan masukkan nilai
          untuk setiap mahasiswa.
        </p>
      </div>

      {/* Statistics Cards - Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-3 md:p-4 lg:p-6">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] md:text-xs lg:text-sm font-medium text-muted-foreground truncate">
                  {session.role === "dosen" ? "Mata Kuliah Diampu" : "Total Mata Kuliah"}
                </p>
                <p className="text-lg md:text-xl lg:text-2xl font-bold">{availableOfferings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4 lg:p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] md:text-xs lg:text-sm font-medium text-muted-foreground truncate">Mahasiswa Terdaftar</p>
                <p className="text-lg md:text-xl lg:text-2xl font-bold">{enrolledStudents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4 lg:p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] md:text-xs lg:text-sm font-medium text-muted-foreground truncate">Nilai Terinput</p>
                <p className="text-lg md:text-xl lg:text-2xl font-bold">{totalGraded}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4 lg:p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-green-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] md:text-xs lg:text-sm font-medium text-muted-foreground truncate">Rata-rata Nilai</p>
                <p className="text-lg md:text-xl lg:text-2xl font-bold">{averageScore.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Box */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
        <CardHeader className="px-3 md:px-6 pt-3 md:pt-6 pb-2 md:pb-4">
          <CardTitle className="text-blue-800 dark:text-blue-200 text-sm md:text-base flex items-center gap-2">
            <Info className="h-4 w-4" />
            Sistem Penilaian
          </CardTitle>
          <CardDescription className="text-blue-700 dark:text-blue-300 text-[10px] md:text-xs">
            Masukkan nilai angka (0-100) atau pilih nilai huruf. Sistem akan otomatis menghitung bobot (mutu) sesuai standar akademik.
            Nilai akan otomatis tersinkronisasi dengan KHS mahasiswa.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Subject Selection dengan Angkatan/Class hierarchy */}
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
                        .map(([kelas, classSubjects]) => {
                          return (
                            <div
                              key={`${angkatan}-${kelas}`}
                              onClick={() => handleClassClick(angkatan, kelas)}
                              className="relative cursor-pointer group"
                            >
                              {/* Floating Card Container */}
                              <div className="relative transition-all duration-300 ease-out group-hover:-translate-y-2 group-active:scale-95">
                                {/* Folder Icon and Label */}
                                <div className="flex flex-col items-center space-y-2 p-4 rounded-xl bg-gradient-to-br from-background to-muted/30 border-2 border-muted group-hover:border-primary/30 group-hover:shadow-xl shadow-md transition-all duration-300">
                                  <Folder className="w-16 h-16 md:w-20 md:h-20 text-primary group-hover:text-primary/80 transition-colors duration-300 drop-shadow-md" />
                                  <div className="text-center space-y-1">
                                    <p className="font-semibold text-sm md:text-base text-foreground group-hover:text-primary transition-colors duration-200">
                                      Kelas {kelas}
                                    </p>
                                    <p className="text-xs md:text-sm text-muted-foreground">
                                      {classSubjects.length} mata kuliah
                                    </p>
                                  </div>
                                </div>

                                {/* Hover Effect Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-600/0 group-hover:from-blue-500/5 group-hover:to-blue-600/10 transition-all duration-300 pointer-events-none rounded-xl" />
                                
                                {/* Click Ripple Effect */}
                                <div className="absolute inset-0 bg-blue-400/20 opacity-0 group-active:opacity-100 transition-opacity duration-150 pointer-events-none rounded-xl" />
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      ) : !selectedSubject ? (
        <>
          {/* Show subjects in selected class */}
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
              {subjectsByAngkatan[selectedAngkatan!]?.[selectedClass!]?.length || 0} mata kuliah tersedia
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 px-3 md:px-4">
            {subjectsByAngkatan[selectedAngkatan!]?.[selectedClass!]?.map((subject) => (
              <Card
                key={subject.id}
                className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all duration-200 overflow-hidden group"
                onClick={() => handleSubjectClick(subject)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm md:text-base mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                        {subject.nama}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {subject.kode}
                      </CardDescription>
                    </div>
                    <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5 md:gap-2">
                    <Badge variant="secondary" className="text-[10px] md:text-xs">
                      {subject.sks} SKS
                    </Badge>
                    <Badge variant="outline" className="text-[10px] md:text-xs">
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
      ) : (
        <>
          {/* Grade Entry Form - When subject is selected */}
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

            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-base md:text-xl lg:text-2xl font-bold leading-tight mb-1">
                  {selectedSubject?.nama}
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {selectedSubject?.kode} • Semester {selectedSubject?.semester} • {selectedSubject?.sks} SKS
                  {selectedSubject?.kelas && ` • Kelas ${selectedSubject.kelas}`}
                  {selectedSubject?.angkatan && ` • Angkatan ${selectedSubject.angkatan}`}
                </p>
                {selectedSubject?.prodi && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedSubject.prodi}
                  </p>
                )}
              </div>
            </div>
          </div>

      {/* Offering Selection */}
      <Card className="hidden">
        <CardHeader className="px-3 md:px-6 pt-3 md:pt-6 pb-2 md:pb-4">
          <CardTitle className="text-sm md:text-base">Pilih Mata Kuliah</CardTitle>
          <CardDescription className="text-[10px] md:text-xs">
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
      {selectedSubject && (
        <Card>
          <CardHeader className="px-3 md:px-6 pt-3 md:pt-6 pb-2 md:pb-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 md:gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-sm md:text-base truncate">
                  Daftar Mahasiswa - {selectedSubject.nama}
                  {selectedSubject.kelas && ` (Kelas ${selectedSubject.kelas})`}
                </CardTitle>
                <CardDescription className="text-[10px] md:text-xs">
                  Input nilai untuk {filteredStudents.length} mahasiswa yang terdaftar
                </CardDescription>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button onClick={handleSaveGrades} className="gap-1.5 md:gap-2 flex-1 sm:flex-none text-xs md:text-sm h-8 md:h-10">
                  <Save className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Simpan Nilai</span>
                  <span className="sm:hidden">Simpan</span>
                </Button>
                <Button variant="outline" onClick={handleExportGrades} className="gap-1.5 md:gap-2 bg-transparent px-2 md:px-4 text-xs md:text-sm h-8 md:h-10">
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
                        <TableHead className="font-semibold">Nama</TableHead>
                        <TableHead className="font-semibold text-center">Kehadiran</TableHead>
                        <TableHead className="font-semibold text-center">Tugas</TableHead>
                        <TableHead className="font-semibold text-center">UTS</TableHead>
                        <TableHead className="font-semibold text-center">UAS</TableHead>
                        <TableHead className="font-semibold">Nilai Angka</TableHead>
                        <TableHead className="font-semibold">Nilai Huruf</TableHead>
                        <TableHead className="font-semibold">Bobot</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student, index) => {
                        const currentGrade = grades[student!.id]
                        const gradeInfo = currentGrade?.nilaiHuruf ? gradeOptions.find(g => g.value === currentGrade.nilaiHuruf) : null
                        
                        return (
                          <TableRow key={student!.id} className={index % 2 === 0 ? "bg-card" : "bg-background"}>
                            <TableCell className="font-mono font-medium text-sm">{student!.nim}</TableCell>
                            <TableCell className="font-medium">{student!.name}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-sm font-medium">{student!.attendancePercentage}%</span>
                                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full transition-all ${student!.attendancePercentage >= 75 ? 'bg-green-500' : student!.attendancePercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                    style={{ width: `${Math.min(100, student!.attendancePercentage)}%` }}
                                  />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-xs text-muted-foreground">
                                  {student!.assignmentCount.submitted}/{student!.assignmentCount.total}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {student!.assignmentCompletion}%
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {student!.utsScore !== undefined ? (
                                <span className="text-sm font-medium">{student!.utsScore.toFixed(0)}</span>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {student!.uasScore !== undefined ? (
                                <span className="text-sm font-medium">{student!.uasScore.toFixed(0)}</span>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={currentGrade?.nilaiAngka || ""}
                                onChange={(e) => handleScoreChange(student!.id, parseFloat(e.target.value) || 0)}
                                placeholder="0-100"
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={currentGrade?.nilaiHuruf || ""}
                                onValueChange={(value) => handleGradeChange(student!.id, value)}
                              >
                                <SelectTrigger className="w-24">
                                  <SelectValue placeholder="Pilih" />
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
                              {gradeInfo && (
                                <Badge variant="secondary" className={gradeInfo.color}>
                                  {gradeInfo.bobot.toFixed(1)}
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3 px-3">
                  {filteredStudents.map((student) => {
                    const currentGrade = grades[student!.id]
                    const gradeInfo = currentGrade?.nilaiHuruf ? gradeOptions.find(g => g.value === currentGrade.nilaiHuruf) : null
                    
                    return (
                      <Card key={student!.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{student!.name}</p>
                              <p className="text-xs text-muted-foreground font-mono">{student!.nim}</p>
                            </div>
                            <Badge variant={student!.status === "active" ? "default" : "secondary"} className="text-xs ml-2">
                              {student!.status === "active" ? "Aktif" : "Tidak Aktif"}
                            </Badge>
                          </div>

                          {/* Student Stats */}
                          <div className="grid grid-cols-4 gap-2 mb-3 p-2 bg-muted/50 rounded-md">
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Hadir</p>
                              <p className="text-sm font-semibold">{student!.attendancePercentage}%</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Tugas</p>
                              <p className="text-sm font-semibold">{student!.assignmentCount.submitted}/{student!.assignmentCount.total}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">UTS</p>
                              <p className="text-sm font-semibold">
                                {student!.utsScore !== undefined ? student!.utsScore.toFixed(0) : "-"}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">UAS</p>
                              <p className="text-sm font-semibold">
                                {student!.uasScore !== undefined ? student!.uasScore.toFixed(0) : "-"}
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs text-muted-foreground">Nilai Angka (0-100)</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={currentGrade?.nilaiAngka || ""}
                                  onChange={(e) => handleScoreChange(student!.id, parseFloat(e.target.value) || 0)}
                                  placeholder="0-100"
                                  className="mt-1 h-9 text-sm"
                                />
                              </div>
                              
                              <div>
                                <Label className="text-xs text-muted-foreground">Nilai Huruf</Label>
                                <Select
                                  value={currentGrade?.nilaiHuruf || ""}
                                  onValueChange={(value) => handleGradeChange(student!.id, value)}
                                >
                                  <SelectTrigger className="mt-1 h-9 text-xs">
                                    <SelectValue placeholder="Pilih" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {gradeOptions.map((grade) => (
                                      <SelectItem key={grade.value} value={grade.value} className="text-xs">
                                        <div className="flex items-center gap-2">
                                          <div className={`w-3 h-3 rounded-full ${grade.color.split(" ")[0]}`} />
                                          {grade.label}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            
                            {gradeInfo && (
                              <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                                <span className="text-xs text-muted-foreground">Bobot (Mutu)</span>
                                <Badge variant="secondary" className={`${gradeInfo.color} text-xs`}>
                                  {gradeInfo.bobot.toFixed(1)}
                                </Badge>
                              </div>
                            )}
                            
                            {currentGrade?.nilaiAngka && gradeInfo && (
                              <div className="text-xs text-muted-foreground">
                                Range: {gradeInfo.minScore} - {gradeInfo.maxScore}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
      </>
      )}
    </div>
  )
}
