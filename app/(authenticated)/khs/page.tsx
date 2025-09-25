"use client"

import { useState } from "react"
import { useSessionStore } from "@/stores/session.store"
import { useSubjectsStore } from "@/stores/subjects.store"
import { useGradesStore } from "@/stores/grades.store"
import { useProfileStore } from "@/stores/profile.store"
import { canAccessKHS } from "@/lib/rbac"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, GraduationCap, TrendingUp } from "lucide-react"
import { showSuccess } from "@/lib/alerts"

export default function KhsPage() {
  const { session } = useSessionStore()
  const { subjects } = useSubjectsStore()
  const { getGradesByUser, calculateGPA, calculateSemesterGPA } = useGradesStore()
  const { getProfile } = useProfileStore()

  // Generate term options (current and previous semesters)
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()
  const isOddSemester = currentMonth >= 8 || currentMonth <= 1

  const termOptions = [
    "Semua Semester",
    `${currentYear}/${currentYear + 1}-${isOddSemester ? "Ganjil" : "Genap"}`,
    `${currentYear}/${currentYear + 1}-${isOddSemester ? "Genap" : "Ganjil"}`,
    `${currentYear - 1}/${currentYear}-Genap`,
    `${currentYear - 1}/${currentYear}-Ganjil`,
  ]

  const [selectedTerm, setSelectedTerm] = useState("Semua Semester")

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
      case "B+":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "B":
        return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200"
      case "C+":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "C":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      case "D":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "E":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const handleExportTranscript = () => {
    const csvContent = [
      ["Semester", "Kode", "Nama Mata Kuliah", "SKS", "Nilai Angka", "Nilai Huruf"].join(","),
      ...grades.map((grade) => {
        const subject = subjects.find((s) => s.id === grade.subjectId)
        return [
          grade.term,
          subject?.kode || "",
          `"${subject?.nama || ""}"`,
          subject?.sks || "",
          grade.nilaiAngka || "",
          grade.nilaiHuruf || "",
        ].join(",")
      }),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `Transkrip-${session.name.replace(/\s+/g, "-")}.csv`
    a.click()
    URL.revokeObjectURL(url)

    showSuccess("Transkrip berhasil diekspor")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">KHS (Kartu Hasil Studi)</h1>
          <p className="text-muted-foreground">Lihat hasil studi dan prestasi akademik Anda</p>
        </div>
        <Button onClick={handleExportTranscript} disabled={grades.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export Transkrip
        </Button>
      </div>

      {/* Student Info & GPA Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IPK Kumulatif</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{cumulativeGPA.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Dari {grades.length} mata kuliah</p>
          </CardContent>
        </Card>

        {selectedTerm !== "Semua Semester" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">IPS Semester</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">{semesterGPA.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Semester {selectedTerm}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total SKS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {grades.reduce((total, grade) => {
                const subject = subjects.find((s) => s.id === grade.subjectId)
                return total + (subject?.sks || 0)
              }, 0)}
            </div>
            <p className="text-xs text-muted-foreground">SKS yang telah diambil</p>
          </CardContent>
        </Card>
      </div>

      {/* Profile Warning */}
      {!profile?.angkatan && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
          <CardHeader>
            <CardTitle className="text-yellow-800 dark:text-yellow-200">Lengkapi Profil</CardTitle>
            <CardDescription className="text-yellow-700 dark:text-yellow-300">
              Anda perlu mengisi angkatan di profil untuk melihat data yang lebih akurat.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href="/profile">Lengkapi Profil</a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Term Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Semester</CardTitle>
          <CardDescription>Pilih semester untuk melihat hasil studi spesifik</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedTerm} onValueChange={setSelectedTerm}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {termOptions.map((term) => (
                <SelectItem key={term} value={term}>
                  {term}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Grades Table */}
      {grades.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Hasil Studi</CardTitle>
            <CardDescription>Nilai mata kuliah yang telah Anda ambil</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground">Belum ada nilai yang tersedia.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Nilai akan muncul setelah dosen memasukkan hasil evaluasi.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : selectedTerm === "Semua Semester" ? (
        // Group by semester view
        <div className="space-y-6">
          {Object.entries(gradesBySemester)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([term, termGrades]) => (
              <Card key={term}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Semester {term}</span>
                    <Badge variant="outline">IPS: {calculateSemesterGPA(session.id, term, subjects).toFixed(2)}</Badge>
                  </CardTitle>
                  <CardDescription>{termGrades.length} mata kuliah</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Kode</TableHead>
                          <TableHead>Nama Mata Kuliah</TableHead>
                          <TableHead>SKS</TableHead>
                          <TableHead>Nilai Angka</TableHead>
                          <TableHead>Nilai Huruf</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {termGrades.map((grade) => {
                          const subject = subjects.find((s) => s.id === grade.subjectId)
                          return (
                            <TableRow key={grade.id}>
                              <TableCell className="font-medium">{subject?.kode}</TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{subject?.nama}</p>
                                  {subject?.prodi && <p className="text-sm text-muted-foreground">{subject.prodi}</p>}
                                </div>
                              </TableCell>
                              <TableCell>{subject?.sks}</TableCell>
                              <TableCell>
                                {grade.nilaiAngka ? (
                                  <span className="font-medium">{grade.nilaiAngka}</span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {grade.nilaiHuruf ? (
                                  <Badge className={getGradeColor(grade.nilaiHuruf)}>{grade.nilaiHuruf}</Badge>
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
          <CardHeader>
            <CardTitle>Hasil Studi - {selectedTerm}</CardTitle>
            <CardDescription>
              {grades.length} mata kuliah dengan IPS {semesterGPA.toFixed(2)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Nama Mata Kuliah</TableHead>
                    <TableHead>SKS</TableHead>
                    <TableHead>Nilai Angka</TableHead>
                    <TableHead>Nilai Huruf</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.map((grade) => {
                    const subject = subjects.find((s) => s.id === grade.subjectId)
                    return (
                      <TableRow key={grade.id}>
                        <TableCell className="font-medium">{subject?.kode}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{subject?.nama}</p>
                            {subject?.prodi && <p className="text-sm text-muted-foreground">{subject.prodi}</p>}
                          </div>
                        </TableCell>
                        <TableCell>{subject?.sks}</TableCell>
                        <TableCell>
                          {grade.nilaiAngka ? (
                            <span className="font-medium">{grade.nilaiAngka}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {grade.nilaiHuruf ? (
                            <Badge className={getGradeColor(grade.nilaiHuruf)}>{grade.nilaiHuruf}</Badge>
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
