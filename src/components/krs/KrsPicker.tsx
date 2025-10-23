"use client"

import { useState, useMemo } from "react"
import { useSubjectsStore } from "@/stores/subjects.store"
import { useOfferingsStore } from "@/stores/offerings.store"
import { useKrsStore } from "@/stores/krs.store"
import { useProfileStore } from "@/stores/profile.store"
import { useSessionStore } from "@/stores/session.store"
import { getStudentInfoFromData } from "@/lib/student-utils"
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
  const { addKrsItem, isOfferingInKrs, getKrsByOffering, getKrsByUser, krsItems } = useKrsStore()
  const { getProfile } = useProfileStore()
  const { session } = useSessionStore()
  const [searchTerm, setSearchTerm] = useState("")

  const profile = getProfile(userId)
  
  // Auto-extract angkatan dari email/NIM jika profil tidak ada
  const studentInfo = getStudentInfoFromData(session?.email || '', profile?.nim || '')
  const userAngkatan = profile?.angkatan || studentInfo.angkatan
  const userKelas = profile?.kelas?.trim() || studentInfo.kelas

  const availableOfferings = useMemo(() => {
    // Get ALL offerings for angkatan (tidak filter by kelas, mahasiswa bebas pilih kelas mana saja)
    const offerings = getOfferingsForStudent(userAngkatan)

    // Get all KRS items for this user to check for duplicate subjects
    const userKrsItems = getKrsByUser(userId, term)
    const enrolledSubjectIds = new Set(userKrsItems.map(item => item.subjectId))

    return offerings.filter((offering) => {
      const subject = getSubjectById(offering.subjectId)

      // Only show if subject exists and is active
      if (!subject || subject.status !== "aktif") return false

      // Check if subject already in KRS (regardless of offering/kelas)
      if (enrolledSubjectIds.has(offering.subjectId)) return false

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
  }, [userAngkatan, getOfferingsForStudent, getSubjectById, userId, term, getKrsByOffering, getKrsByUser, searchTerm, krsItems])

  // Group offerings by kelas
  const groupedOfferings = useMemo(() => {
    const groups = availableOfferings.reduce((acc, offering) => {
      const kelas = offering.kelas.trim()
      if (!acc[kelas]) {
        acc[kelas] = []
      }
      acc[kelas].push(offering)
      return acc
    }, {} as Record<string, typeof availableOfferings>)

    // Sort by kelas name
    return Object.entries(groups)
      .sort(([kelasA], [kelasB]) => kelasA.localeCompare(kelasB))
      .map(([kelas, offerings]) => ({ kelas, offerings }))
  }, [availableOfferings])

  // Debug info - log to console to help troubleshoot
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const allOfferings = useOfferingsStore.getState().offerings
    const subjectsData = useSubjectsStore.getState().subjects
    
    console.group('🎓 KRS Debug Info')
    console.log('User Email:', session?.email)
    console.log('User Profile:', profile)
    console.log('Auto-extracted Info:', studentInfo)
    console.log('Final Angkatan:', userAngkatan, 'Kelas (Info):', userKelas)
    console.log('---')
    console.log('All Subjects in Store:', subjectsData.length)
    console.log('Subjects:', subjectsData.map(s => ({ kode: s.kode, nama: s.nama, angkatan: s.angkatan, status: s.status })))
    console.log('---')
    console.log('All Offerings in Store:', allOfferings.length)
    console.log('Offerings:', allOfferings.map(o => ({ 
      subjectId: o.subjectId, 
      angkatan: o.angkatan, 
      kelas: o.kelas, 
      status: o.status,
      subject: getSubjectById(o.subjectId)?.nama 
    })))
    console.log('---')
    console.log('Offerings for Student Angkatan', userAngkatan + ':', getOfferingsForStudent(userAngkatan).length)
    console.log('Available Offerings (After Filters):', availableOfferings.length)
    console.log('Available:', availableOfferings.map(o => ({
      subject: getSubjectById(o.subjectId)?.nama,
      angkatan: o.angkatan,
      kelas: o.kelas,
      status: o.status
    })))
    console.groupEnd()
  }

  const handleAddOffering = (offering: CourseOffering) => {
    try {
      const subject = getSubjectById(offering.subjectId)
      addKrsItem(userId, offering.subjectId, term, offering.id, subject?.nama, subject?.sks)
      showSuccess(`${subject?.nama} (Kelas ${offering.kelas}) berhasil ditambahkan ke KRS`)
    } catch (error) {
      showError("Gagal menambahkan mata kuliah ke KRS")
    }
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
          Penawaran mata kuliah untuk angkatan {userAngkatan} - Semua kelas ({availableOfferings.length} penawaran)
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
                  : "Tidak ada penawaran mata kuliah yang tersedia untuk angkatan Anda"}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Angkatan: {userAngkatan}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedOfferings.map((group, groupIndex) => (
                <Card key={group.kelas} className="animate-slide-in-left" style={{ animationDelay: `${groupIndex * 0.1}s` }}>
                  <CardContent className="pt-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Badge variant="default" className="text-sm">
                          Kelas {group.kelas}
                        </Badge>
                        <span className="text-sm text-muted-foreground ml-auto">
                          {group.offerings.length} mata kuliah
                        </span>
                      </h3>
                    </div>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nama</TableHead>
                            <TableHead>SKS</TableHead>
                            <TableHead>Kapasitas</TableHead>
                            <TableHead className="w-[100px]">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.offerings.map((offering) => {
                            const subject = getSubjectById(offering.subjectId)
                            if (!subject) return null

                            return (
                              <TableRow key={offering.id}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{subject.nama}</p>
                                    {subject.prodi && <p className="text-sm text-muted-foreground">{subject.prodi}</p>}
                                    {offering.term && <p className="text-xs text-muted-foreground">{offering.term}</p>}
                                  </div>
                                </TableCell>
                                <TableCell>{subject.sks}</TableCell>
                                <TableCell>
                                  {getEnrollmentInfo(offering) || <span className="text-muted-foreground">—</span>}
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
