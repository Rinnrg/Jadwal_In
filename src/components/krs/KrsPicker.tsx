"use client"

import { useState, useMemo } from "react"
import { useSubjectsStore } from "@/stores/subjects.store"
import { useOfferingsStore } from "@/stores/offerings.store"
import { useKrsStore } from "@/stores/krs.store"
import { useProfileStore } from "@/stores/profile.store"
import type { CourseOffering } from "@/data/schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Users } from "lucide-react"
import { showSuccess, showError } from "@/lib/alerts"
import { ActivityLogger } from "@/lib/activity-logger"

interface KrsPickerProps {
  userId: string
  term: string
}

export function KrsPicker({ userId, term }: KrsPickerProps) {
  const { getSubjectById } = useSubjectsStore()
  const { getOfferingsForStudent } = useOfferingsStore()
  const { addKrsItem, isOfferingInKrs, getKrsByOffering } = useKrsStore()
  const { getProfile } = useProfileStore()
  const [searchTerm, setSearchTerm] = useState("")

  const profile = getProfile(userId)
  const userAngkatan = profile?.angkatan || new Date().getFullYear()
  const userKelas = profile?.kelas || "A"

  const availableOfferings = useMemo(() => {
    if (!profile?.angkatan || !profile?.kelas) return []

    const offerings = getOfferingsForStudent(profile.angkatan, profile.kelas)

    return offerings.filter((offering) => {
      const subject = getSubjectById(offering.subjectId)

      // Only show if subject exists and is active
      if (!subject || subject.status !== "aktif") return false

      // Check if already in KRS
      if (isOfferingInKrs(userId, offering.id)) return false

      // Check capacity if set
      if (offering.capacity) {
        const enrollmentCount = getKrsByOffering(offering.id).length
        if (enrollmentCount >= offering.capacity) return false
      }

      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        return (
          subject.kode.toLowerCase().includes(search) ||
          subject.nama.toLowerCase().includes(search) ||
          offering.kelas.toLowerCase().includes(search) ||
          offering.angkatan.toString().includes(search)
        )
      }

      return true
    })
  }, [profile, getOfferingsForStudent, getSubjectById, userId, isOfferingInKrs, getKrsByOffering, searchTerm])

  const handleAddOffering = (offering: CourseOffering) => {
    try {
      addKrsItem(userId, offering.subjectId, term, offering.id)
      const subject = getSubjectById(offering.subjectId)
      showSuccess(`${subject?.nama} (Kelas ${offering.kelas}) berhasil ditambahkan ke KRS`)
      
      // Log activity
      if (subject) {
        ActivityLogger.krsAdded(userId, `${subject.kode} - ${subject.nama}`, subject.sks)
      }
    } catch (error) {
      showError("Gagal menambahkan mata kuliah ke KRS")
    }
  }

  const getSemesterBadge = (semester: number) => {
    const colors = [
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    ]
    return colors[(semester - 1) % colors.length]
  }

  const getEnrollmentInfo = (offering: CourseOffering) => {
    if (!offering.capacity) return null

    const enrollmentCount = getKrsByOffering(offering.id).length
    const isNearCapacity = enrollmentCount >= offering.capacity * 0.8

    return (
      <div
        className={`flex items-center gap-1 text-sm ${isNearCapacity ? "text-orange-600" : "text-muted-foreground"}`}
      >
        <Users className="h-3 w-3" />
        <span>
          {enrollmentCount}/{offering.capacity}
        </span>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pilih Mata Kuliah</CardTitle>
        <CardDescription>
          Penawaran mata kuliah untuk angkatan {userAngkatan} kelas {userKelas} ({availableOfferings.length} penawaran)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Cari mata kuliah..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {availableOfferings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm
                  ? "Tidak ada penawaran mata kuliah yang sesuai dengan pencarian"
                  : !profile?.angkatan || !profile?.kelas
                    ? "Lengkapi profil Anda untuk melihat penawaran mata kuliah"
                    : "Tidak ada penawaran mata kuliah yang tersedia untuk angkatan dan kelas Anda"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>SKS</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Kapasitas</TableHead>
                    <TableHead>Warna</TableHead>
                    <TableHead className="w-[100px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableOfferings.map((offering) => {
                    const subject = getSubjectById(offering.subjectId)
                    if (!subject) return null

                    return (
                      <TableRow key={offering.id}>
                        <TableCell className="font-medium">{subject.kode}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{subject.nama}</p>
                            {subject.prodi && <p className="text-sm text-muted-foreground">{subject.prodi}</p>}
                            {offering.term && <p className="text-xs text-muted-foreground">{offering.term}</p>}
                          </div>
                        </TableCell>
                        <TableCell>{subject.sks}</TableCell>
                        <TableCell>
                          <Badge className={getSemesterBadge(offering.semester)}>Semester {offering.semester}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{offering.kelas}</Badge>
                        </TableCell>
                        <TableCell>
                          {getEnrollmentInfo(offering) || <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>
                          <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: subject.color }} />
                        </TableCell>
                        <TableCell>
                          <Button size="sm" onClick={() => handleAddOffering(offering)}>
                            <Plus className="h-4 w-4 mr-1" />
                            Ambil
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
