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
import { Search, Plus, Users, ChevronDown, BookOpen, AlertCircle } from "lucide-react"
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
  const [addingOffering, setAddingOffering] = useState<string | null>(null) // Track which offering is being added

  const profile = getProfile(userId)
  
  // Auto-extract angkatan dari email/NIM jika profil tidak ada
  const studentInfo = getStudentInfoFromData(session?.email || '', profile?.nim || '')
  const userAngkatan = profile?.angkatan || studentInfo.angkatan
  const userKelas = profile?.kelas?.trim() || studentInfo.kelas

  // Get user's current KRS items - reactive to changes
  const userKrsItems = useMemo(() => getKrsByUser(userId, term), [getKrsByUser, userId, term, krsItems])
  const enrolledOfferingIds = useMemo(() => new Set(userKrsItems.map(item => item.offeringId).filter(Boolean)), [userKrsItems])
  const enrolledSubjectIds = useMemo(() => new Set(userKrsItems.map(item => item.subjectId)), [userKrsItems])

  const availableOfferings = useMemo(() => {
    // Get ALL offerings for angkatan (tidak filter by kelas, mahasiswa bebas pilih kelas mana saja)
    const offerings = getOfferingsForStudent(userAngkatan)

    return offerings
      .map((offering) => {
        const subject = getSubjectById(offering.subjectId)

        // Only show if subject exists and is active
        if (!subject || subject.status !== "aktif") return null

        // Check if this exact offering is already taken (same class)
        const isAlreadyEnrolled = enrolledOfferingIds.has(offering.id)
        
        // Check if subject is already taken in ANOTHER class
        const isSubjectTakenInOtherClass = enrolledSubjectIds.has(offering.subjectId) && !isAlreadyEnrolled

        // Check capacity if set
        let isFull = false
        if (offering.capacity) {
          const enrollmentCount = getKrsByOffering(offering.id).length
          isFull = enrollmentCount >= offering.capacity
        }

        // Search filter
        if (searchTerm) {
          const search = searchTerm.toLowerCase()
          const matchesSearch = (
            subject.kode.toLowerCase().includes(search) ||
            subject.nama.toLowerCase().includes(search) ||
            offering.kelas.toLowerCase().includes(search) ||
            offering.angkatan.toString().includes(search)
          )
          if (!matchesSearch) return null
        }

        return {
          ...offering,
          isAlreadyEnrolled,        // Sudah diambil di kelas ini (hijau)
          isSubjectTakenInOtherClass, // Sudah diambil di kelas lain (oranye, disabled)
          isFull
        }
      })
      .filter((offering): offering is NonNullable<typeof offering> => offering !== null)
  }, [userAngkatan, getOfferingsForStudent, getSubjectById, getKrsByOffering, searchTerm, enrolledOfferingIds, enrolledSubjectIds])

  // Group offerings by kelas
  const groupedOfferings = useMemo(() => {
    const groups = availableOfferings.reduce((acc, offering) => {
      if (!offering) return acc
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

  const handleAddOffering = async (offering: any) => {
    // Prevent multiple rapid clicks
    if (addingOffering === offering.id) return
    
    // Check if already enrolled in this class
    if (offering.isAlreadyEnrolled) {
      const subject = getSubjectById(offering.subjectId)
      showError(`${subject?.nama} sudah diambil di kelas ini`)
      return
    }
    
    // Check if subject is already taken in another class
    if (offering.isSubjectTakenInOtherClass) {
      const subject = getSubjectById(offering.subjectId)
      showError(`${subject?.nama} sudah diambil di kelas lain`)
      return
    }

    // Check if class is full
    if (offering.isFull) {
      showError("Kelas sudah penuh")
      return
    }
    
    setAddingOffering(offering.id)
    
    try {
      const subject = getSubjectById(offering.subjectId)
      
      // Triple check: pastikan subject belum ada di KRS (untuk race condition)
      const isDuplicate = enrolledSubjectIds.has(offering.subjectId)
      
      if (isDuplicate) {
        showError(`${subject?.nama} sudah ada di KRS Anda`)
        return
      }
      
      addKrsItem(userId, offering.subjectId, term, offering.id, subject?.nama, subject?.sks)
      showSuccess(`${subject?.nama} (Kelas ${offering.kelas}) berhasil ditambahkan ke KRS`)
    } catch (error) {
      showError("Gagal menambahkan mata kuliah ke KRS")
    } finally {
      setAddingOffering(null)
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
          {!searchTerm && (
            <>
              <p className="text-xs md:text-sm text-muted-foreground mt-2">
                Angkatan Anda: <span className="font-semibold">{userAngkatan}</span>
              </p>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Mobile View - Card per kelas */}
          <div className="md:hidden grid grid-cols-1 gap-3 px-3">
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
                          const isDisabled = offering.isSubjectTakenInOtherClass || offering.isFull || addingOffering === offering.id

                          return (
                            <div 
                              key={offering.id} 
                              className={`p-4 ${
                                offering.isAlreadyEnrolled
                                  ? 'bg-green-50 dark:bg-green-950/20 border-l-4 border-green-500' 
                                  : offering.isSubjectTakenInOtherClass
                                  ? 'bg-orange-50 dark:bg-orange-950/20 border-l-4 border-orange-500' 
                                  : 'transition-colors hover:bg-muted/30'
                              }`}
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
                                  {offering.isAlreadyEnrolled && (
                                    <p className="text-xs text-green-600 dark:text-green-400 mt-2 font-medium">
                                      ✓ Mata kuliah sudah diambil
                                    </p>
                                  )}
                                  {offering.isSubjectTakenInOtherClass && (
                                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 font-medium">
                                      ⚠️ Mata kuliah sudah diambil di kelas lain
                                    </p>
                                  )}
                                  {offering.isFull && !offering.isAlreadyEnrolled && !offering.isSubjectTakenInOtherClass && (
                                    <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-medium">
                                      ⚠️ Kelas penuh
                                    </p>
                                  )}
                                </div>
                                <Button 
                                  size="sm" 
                                  onClick={() => handleAddOffering(offering)}
                                  disabled={isDisabled || offering.isAlreadyEnrolled}
                                  className="h-8 px-3 flex-shrink-0"
                                  variant={offering.isAlreadyEnrolled ? "outline" : offering.isSubjectTakenInOtherClass || offering.isFull ? "outline" : "default"}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  {addingOffering === offering.id ? "..." : offering.isAlreadyEnrolled ? "Diambil" : "Ambil"}
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

          {/* Desktop View - Collapsible dengan card yang lebih panjang */}
          <div className="hidden md:block px-0">
            <div className="space-y-4">
              {groupedOfferings.map((group) => (
                <Collapsible
                  key={group.kelas}
                  open={openKelas === group.kelas}
                  onOpenChange={() => setOpenKelas(openKelas === group.kelas ? null : group.kelas)}
                >
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <BookOpen className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold">Kelas {group.kelas}</h3>
                              <p className="text-sm text-muted-foreground">
                                {group.offerings.length} mata kuliah tersedia
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
                      <CardContent className="p-4">
                        {/* Subject List - Single column dengan card yang lebih panjang */}
                        <div className="space-y-3">
                          {group.offerings.map((offering) => {
                            const subject = getSubjectById(offering.subjectId)
                            if (!subject) return null

                            const enrollmentInfo = getEnrollmentInfo(offering)
                            const isDisabled = offering.isSubjectTakenInOtherClass || offering.isFull || addingOffering === offering.id

                            return (
                              <Card 
                                key={offering.id} 
                                className={`${
                                  offering.isAlreadyEnrolled
                                    ? 'border-green-500 bg-green-50 dark:bg-green-950/20' 
                                    : offering.isSubjectTakenInOtherClass 
                                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20' 
                                    : 'transition-colors hover:border-primary/50'
                                }`}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-medium text-base leading-tight mb-2">
                                        {subject.nama}
                                      </h4>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <Badge variant="secondary" className="text-xs">
                                          {subject.kode}
                                        </Badge>
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
                                      {offering.isAlreadyEnrolled && (
                                        <p className="text-sm text-green-600 dark:text-green-400 mt-2 font-medium flex items-center gap-1">
                                          ✓ Mata kuliah sudah diambil
                                        </p>
                                      )}
                                      {offering.isSubjectTakenInOtherClass && (
                                        <p className="text-sm text-orange-600 dark:text-orange-400 mt-2 font-medium flex items-center gap-1">
                                          ⚠️ Mata kuliah sudah diambil di kelas lain
                                        </p>
                                      )}
                                      {offering.isFull && !offering.isAlreadyEnrolled && !offering.isSubjectTakenInOtherClass && (
                                        <p className="text-sm text-red-600 dark:text-red-400 mt-2 font-medium flex items-center gap-1">
                                          ⚠️ Kelas sudah penuh
                                        </p>
                                      )}
                                    </div>
                                    <Button 
                                      size="sm" 
                                      onClick={() => handleAddOffering(offering)}
                                      disabled={isDisabled || offering.isAlreadyEnrolled}
                                      className="h-9 px-4 flex-shrink-0"
                                      variant={offering.isAlreadyEnrolled ? "secondary" : offering.isSubjectTakenInOtherClass || offering.isFull ? "outline" : "default"}
                                    >
                                      <Plus className="h-4 w-4 mr-1" />
                                      {addingOffering === offering.id ? "..." : offering.isAlreadyEnrolled ? "Diambil" : "Ambil"}
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          })}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
