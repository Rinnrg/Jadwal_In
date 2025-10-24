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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Search, Plus, Users, ChevronDown, BookOpen } from "lucide-react"
import { showSuccess, showError } from "@/lib/alerts"

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
  const [openKelas, setOpenKelas] = useState<string | null>(null)

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
    <div className="space-y-3 md:space-y-4">
      {/* Header */}
      <div className="px-3 md:px-0">
        <div className="space-y-3">
          <div>
            <h2 className="text-base md:text-xl font-bold">Pilih Mata Kuliah</h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
              Angkatan {userAngkatan} • {availableOfferings.length} penawaran
            </p>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Cari mata kuliah..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9 md:h-10"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {availableOfferings.length === 0 ? (
        <div className="text-center py-8 md:py-12 px-3">
          <p className="text-sm md:text-base text-muted-foreground">
            {searchTerm
              ? "Tidak ada penawaran mata kuliah yang sesuai dengan pencarian"
              : "Tidak ada penawaran mata kuliah yang tersedia untuk angkatan Anda"}
          </p>
          <p className="text-xs md:text-sm text-muted-foreground mt-2">
            Angkatan: {userAngkatan}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 px-3 md:px-0">
          {groupedOfferings.map((group) => (
            <Collapsible
              key={group.kelas}
              open={openKelas === group.kelas}
              onOpenChange={(isOpen) => setOpenKelas(isOpen ? group.kelas : null)}
            >
              <Card className="overflow-hidden hover:border-primary/50 transition-colors">
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <BookOpen className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{userAngkatan} {group.kelas}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {group.offerings.length} mata kuliah
                          </p>
                        </div>
                      </div>
                      <ChevronDown
                        className={`h-5 w-5 text-muted-foreground transition-transform ${
                          openKelas === group.kelas ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {group.offerings.map((offering) => {
                        const subject = getSubjectById(offering.subjectId)
                        if (!subject) return null

                        const enrollmentInfo = getEnrollmentInfo(offering)

                        return (
                          <div 
                            key={offering.id} 
                            className="p-4 hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm leading-tight mb-1">
                                  {subject.nama}
                                </h4>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="secondary" className="text-xs">
                                    {subject.sks} SKS
                                  </Badge>
                                  {subject.prodi && (
                                    <span className="text-xs text-muted-foreground">{subject.prodi}</span>
                                  )}
                                  {enrollmentInfo && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      {enrollmentInfo}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <Button 
                                size="sm" 
                                onClick={() => handleAddOffering(offering)}
                                className="h-8 px-3 flex-shrink-0"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Ambil
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  )
}
