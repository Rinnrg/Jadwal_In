"use client"

import { useState, useEffect } from "react"
import { useSessionStore } from "@/stores/session.store"
import { useSubjectsStore } from "@/stores/subjects.store"
import { useGradesStore } from "@/stores/grades.store"
import { useProfileStore } from "@/stores/profile.store"
import { useNotificationStore } from "@/stores/notification.store"
import { canAccessKHS } from "@/lib/rbac"
import { generateTranscriptPDF } from "@/lib/pdf-transcript"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Printer, GraduationCap, TrendingUp } from "lucide-react"
import { showSuccess, showError } from "@/lib/alerts"

export default function KhsPage() {
  const { session } = useSessionStore()
  const { subjects, fetchSubjects } = useSubjectsStore()
  const { getGradesByUser, calculateGPA, calculateSemesterGPA, grades: allGrades } = useGradesStore()
  const { getProfile } = useProfileStore()
  const { markAsRead } = useNotificationStore()

  const [selectedTerm, setSelectedTerm] = useState("Semua Semester")

  // Fetch subjects on mount
  useEffect(() => {
    fetchSubjects()
  }, [fetchSubjects])

  // Mark KHS notification as read when user opens this page
  useEffect(() => {
    if (session?.id) {
      markAsRead("khs", session.id)
    }
  }, [session?.id, markAsRead])

  // Get all unique semesters from user's grades
  const userGrades = getGradesByUser(session?.id || "")
  const availableSemesters = ["Semua Semester", ...Array.from(new Set(userGrades.map(g => g.term))).sort().reverse()]

  if (!session || !canAccessKHS(session.role)) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Anda tidak memiliki akses ke halaman ini.</p>
      </div>
    )
  }

  const profile = getProfile(session.id)
  const grades = getGradesByUser(session.id, selectedTerm === "Semua Semester" ? undefined : selectedTerm)
  const cumulativeGPA = calculateGPA(session.id, undefined, subjects)
  const semesterGPA = selectedTerm !== "Semua Semester" ? calculateSemesterGPA(session.id, selectedTerm, subjects) : 0

  // Group grades by semester for better organization
  const gradesBySemester = grades.reduce(
    (acc, grade) => {
      if (!acc[grade.term]) {
        acc[grade.term] = []
      }
      acc[grade.term].push(grade)
      return acc
    },
    {} as Record<string, typeof grades>,
  )

  const getGradeColor = (nilaiHuruf?: string) => {
    switch (nilaiHuruf) {
      case "A":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
      case "A-":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/80 dark:text-emerald-300"
      case "B+":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "B":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/80 dark:text-blue-300"
      case "B-":
        return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200"
      case "C+":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "C":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/80 dark:text-yellow-300"
      case "C-":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      case "D+":
        return "bg-red-100 text-red-700 dark:bg-red-900/80 dark:text-red-300"
      case "D":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "D-":
        return "bg-red-200 text-red-900 dark:bg-red-900 dark:text-red-100"
      case "E":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const handleExportTranscript = () => {
    try {
      const profile = getProfile(session.id)
      
      // Allow export even without complete profile data
      // Use fallback values for missing data
      generateTranscriptPDF({
        studentName: session.name,
        studentNIM: profile?.nim || "Belum diisi",
        studentProdi: profile?.prodi || "Belum diisi",
        studentAngkatan: profile?.angkatan?.toString() || "Belum diisi",
        grades: grades,
        subjects: subjects,
        cumulativeGPA: cumulativeGPA
      })

      showSuccess("Transkrip berhasil dicetak dalam format PDF")
    } catch (error) {
      console.error("Error generating PDF:", error)
      showError("Gagal mencetak transkrip. Silakan coba lagi.")
    }
  }

  return (
    <div className="space-y-4 md:space-y-6 px-2 md:px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">KHS (Kartu Hasil Studi)</h1>
          <p className="text-muted-foreground text-sm md:text-base">Lihat hasil studi dan prestasi akademik Anda</p>
        </div>
        <Button onClick={handleExportTranscript} disabled={grades.length === 0} className="text-xs md:text-sm w-full sm:w-auto">
          <Printer className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
          Cetak Transkrip
        </Button>
      </div>

      {/* Student Info & GPA Overview */}
      <div className="hidden md:flex gap-3 md:gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
        <Card className="min-w-[240px] md:min-w-[280px] snap-start">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 md:px-6 pt-4 md:pt-6">
            <CardTitle className="text-xs md:text-sm font-medium">IPK Kumulatif</CardTitle>
            <GraduationCap className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
            <div className="text-xl md:text-2xl font-bold text-primary">{cumulativeGPA.toFixed(2)}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground">Dari {grades.length} mata kuliah</p>
          </CardContent>
        </Card>

        {selectedTerm !== "Semua Semester" && (
          <Card className="min-w-[240px] md:min-w-[280px] snap-start">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 md:px-6 pt-4 md:pt-6">
              <CardTitle className="text-xs md:text-sm font-medium">IPS Semester</CardTitle>
              <TrendingUp className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
              <div className="text-xl md:text-2xl font-bold text-secondary">{semesterGPA.toFixed(2)}</div>
              <p className="text-[10px] md:text-xs text-muted-foreground">Semester {selectedTerm}</p>
            </CardContent>
          </Card>
        )}

        <Card className="min-w-[240px] md:min-w-[280px] snap-start">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 md:px-6 pt-4 md:pt-6">
            <CardTitle className="text-xs md:text-sm font-medium">Total SKS</CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
            <div className="text-xl md:text-2xl font-bold">
              {grades.reduce((total, grade) => {
                const subject = subjects.find((s) => s.id === grade.subjectId)
                return total + (subject?.sks || 0)
              }, 0)}
            </div>
            <p className="text-[10px] md:text-xs text-muted-foreground">SKS yang telah diambil</p>
          </CardContent>
        </Card>
      </div>

      {/* Info Box */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
        <CardHeader className="px-3 md:px-6 pt-3 md:pt-6 pb-2 md:pb-4">
          <CardTitle className="text-blue-800 dark:text-blue-200 text-sm md:text-base flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Informasi KHS
          </CardTitle>
          <CardDescription className="text-blue-700 dark:text-blue-300 text-[10px] md:text-xs">
            Mata kuliah yang Anda ambil di KRS akan otomatis muncul di KHS dengan status "Belum Dinilai". 
            Nilai akan diperbarui setelah dosen melakukan penilaian.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Grades Table */}
      {grades.length === 0 ? (
        <Card>
          <CardHeader className="px-3 md:px-6 pt-3 md:pt-6 pb-2 md:pb-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1">
                <CardTitle className="text-sm md:text-base">Hasil Studi</CardTitle>
                <CardDescription className="text-[10px] md:text-xs mt-1">Nilai mata kuliah yang telah Anda ambil</CardDescription>
              </div>
              <div className="w-full sm:w-auto sm:min-w-[200px]">
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                  <SelectTrigger className="w-full text-xs md:text-sm h-8 md:h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSemesters.map((term) => (
                      <SelectItem key={term} value={term} className="text-xs md:text-sm">
                        {term}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
            <div className="text-center py-6 md:py-8">
              <p className="text-muted-foreground text-xs md:text-sm">Belum ada nilai yang tersedia.</p>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                Nilai akan muncul setelah dosen memasukkan hasil evaluasi.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : selectedTerm === "Semua Semester" ? (
        // Group by semester view
        <div className="space-y-4 md:space-y-6">
          {Object.entries(gradesBySemester)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([term, termGrades]) => (
              <Card key={term}>
                <CardHeader className="px-3 md:px-6 pt-3 md:pt-6 pb-2 md:pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1">
                      <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm md:text-base">
                        <span>Semester {term}</span>
                        <Badge variant="outline" className="text-xs w-fit">IPS: {calculateSemesterGPA(session.id, term, subjects).toFixed(2)}</Badge>
                      </CardTitle>
                      <CardDescription className="text-[10px] md:text-xs mt-1">{termGrades.length} mata kuliah</CardDescription>
                    </div>
                    {term === Object.keys(gradesBySemester).sort((a, b) => b.localeCompare(a))[0] && (
                      <div className="w-full sm:w-auto sm:min-w-[200px]">
                        <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                          <SelectTrigger className="w-full text-xs md:text-sm h-8 md:h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {availableSemesters.map((term) => (
                              <SelectItem key={term} value={term} className="text-xs md:text-sm">
                                {term}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
                  <div className="rounded-md border max-h-[300px] md:max-h-[400px] overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          <TableHead className="text-xs md:text-sm">Kode</TableHead>
                          <TableHead className="text-xs md:text-sm">Nama Mata Kuliah</TableHead>
                          <TableHead className="text-xs md:text-sm">SKS</TableHead>
                          <TableHead className="text-xs md:text-sm">Nilai Angka</TableHead>
                          <TableHead className="text-xs md:text-sm">Nilai Huruf</TableHead>
                          <TableHead className="text-xs md:text-sm">Mutu</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {termGrades.map((grade) => {
                          const subject = subjects.find((s) => s.id === grade.subjectId)
                          // Get grade bobot from gradeOptions
                          let gradeBobot = 0
                          if (grade.nilaiHuruf) {
                            const gradeMap: Record<string, number> = {
                              "A": 4.0, "A-": 3.7, "B+": 3.3, "B": 3.0, "B-": 2.7,
                              "C+": 2.3, "C": 2.0, "C-": 1.7, "D+": 1.3, "D": 1.0, "D-": 0.7, "E": 0.0
                            }
                            gradeBobot = gradeMap[grade.nilaiHuruf] || 0
                          }
                          
                          return (
                            <TableRow key={grade.id}>
                              <TableCell className="text-xs md:text-sm font-mono">{subject?.kode}</TableCell>
                              <TableCell className="text-xs md:text-sm">
                                <div>
                                  <p className="font-medium">{subject?.nama}</p>
                                  {subject?.prodi && <p className="text-[10px] md:text-xs text-muted-foreground">{subject.prodi}</p>}
                                </div>
                              </TableCell>
                              <TableCell className="text-xs md:text-sm text-center">{subject?.sks}</TableCell>
                              <TableCell className="text-xs md:text-sm">
                                {grade.nilaiAngka !== null && grade.nilaiAngka !== undefined ? (
                                  <span className="font-medium">{grade.nilaiAngka.toFixed(1)}</span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {grade.nilaiHuruf ? (
                                  <Badge className={`${getGradeColor(grade.nilaiHuruf)} text-xs`}>{grade.nilaiHuruf}</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">Belum Dinilai</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-xs md:text-sm">
                                {grade.nilaiHuruf ? (
                                  <span className="font-medium">{gradeBobot.toFixed(1)}</span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      ) : (
        // Single semester view
        <Card>
          <CardHeader className="px-3 md:px-6 pt-3 md:pt-6 pb-2 md:pb-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1">
                <CardTitle className="text-sm md:text-base">Hasil Studi - {selectedTerm}</CardTitle>
                <CardDescription className="text-[10px] md:text-xs mt-1">
                  {grades.length} mata kuliah dengan IPS {semesterGPA.toFixed(2)}
                </CardDescription>
              </div>
              <div className="w-full sm:w-auto sm:min-w-[200px]">
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                  <SelectTrigger className="w-full text-xs md:text-sm h-8 md:h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSemesters.map((term) => (
                      <SelectItem key={term} value={term} className="text-xs md:text-sm">
                        {term}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
            <div className="rounded-md border max-h-[300px] md:max-h-[500px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="text-xs md:text-sm">Kode</TableHead>
                    <TableHead className="text-xs md:text-sm">Nama Mata Kuliah</TableHead>
                    <TableHead className="text-xs md:text-sm">SKS</TableHead>
                    <TableHead className="text-xs md:text-sm">Nilai Angka</TableHead>
                    <TableHead className="text-xs md:text-sm">Nilai Huruf</TableHead>
                    <TableHead className="text-xs md:text-sm">Mutu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.map((grade) => {
                    const subject = subjects.find((s) => s.id === grade.subjectId)
                    // Get grade bobot from gradeOptions
                    let gradeBobot = 0
                    if (grade.nilaiHuruf) {
                      const gradeMap: Record<string, number> = {
                        "A": 4.0, "A-": 3.7, "B+": 3.3, "B": 3.0, "B-": 2.7,
                        "C+": 2.3, "C": 2.0, "C-": 1.7, "D+": 1.3, "D": 1.0, "D-": 0.7, "E": 0.0
                      }
                      gradeBobot = gradeMap[grade.nilaiHuruf] || 0
                    }
                    
                    return (
                      <TableRow key={grade.id}>
                        <TableCell className="text-xs md:text-sm font-mono">{subject?.kode}</TableCell>
                        <TableCell className="text-xs md:text-sm">
                          <div>
                            <p className="font-medium">{subject?.nama}</p>
                            {subject?.prodi && <p className="text-[10px] md:text-xs text-muted-foreground">{subject.prodi}</p>}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs md:text-sm text-center">{subject?.sks}</TableCell>
                        <TableCell className="text-xs md:text-sm">
                          {grade.nilaiAngka !== null && grade.nilaiAngka !== undefined ? (
                            <span className="font-medium">{grade.nilaiAngka.toFixed(1)}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {grade.nilaiHuruf ? (
                            <Badge className={`${getGradeColor(grade.nilaiHuruf)} text-xs`}>{grade.nilaiHuruf}</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Belum Dinilai</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs md:text-sm">
                          {grade.nilaiHuruf ? (
                            <span className="font-medium">{gradeBobot.toFixed(1)}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
