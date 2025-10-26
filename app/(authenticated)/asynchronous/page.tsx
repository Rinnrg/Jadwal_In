"use client"

import { useState, useMemo, useEffect } from "react"
import { useSessionStore } from "@/stores/session.store"
import { useSubjectsStore } from "@/stores/subjects.store"
import { useKrsStore } from "@/stores/krs.store"
import { useNotificationStore } from "@/stores/notification.store"
import { useRealtimeSync } from "@/hooks/use-realtime-sync"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, BookOpen, FileText, ChevronRight, GraduationCap, ArrowLeft } from "lucide-react"
import { AssignmentTab } from "@/components/asynchronous/AssignmentTab"
import { MaterialTab } from "@/components/asynchronous/MaterialTab"
import { arr } from "@/lib/utils"
import type { Subject } from "@/data/schema"
import Folder from "@/components/ui/folder"

export default function AsynchronousPage() {
  const { session } = useSessionStore()
  const { subjects, getSubjectsByPengampu, getActiveSubjects, getSubjectById, fetchSubjects, isLoading } = useSubjectsStore()
  const { krsItems, getKrsByUser } = useKrsStore()
  const { markAsRead } = useNotificationStore()
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  const [selectedAngkatan, setSelectedAngkatan] = useState<string | null>(null)
  
  // Force re-render trigger for reactive updates
  const [, setForceUpdate] = useState(0)

  // Enable real-time sync for Asynchronous page
  useRealtimeSync({
    enabled: true,
    pollingInterval: 2000, // 2 seconds for real-time updates
  })
  
  // Force update when store data changes
  useEffect(() => {
    setForceUpdate(prev => prev + 1)
  }, [subjects.length, krsItems.length])

  // Fetch subjects on mount
  useEffect(() => {
    if (subjects.length === 0) {
      fetchSubjects()
    }
  }, [fetchSubjects, subjects.length])

  // Mark asynchronous notification as read when user opens this page
  useEffect(() => {
    if (session?.id) {
      markAsRead("asynchronous", session.id)
    }
  }, [session?.id, markAsRead])

  const availableSubjects = useMemo(() => {
    if (!session) return []

    let subjects: Subject[] = []

    if (session.role === "dosen") {
      subjects = getSubjectsByPengampu(session.id).filter((subject) => subject.status === "aktif") as Subject[]
    } else if (session.role === "mahasiswa") {
      // Mahasiswa can see subjects they are enrolled in (KRS)
      const krsItems = getKrsByUser(session.id)
      const activeSubjects = getActiveSubjects()
      subjects = activeSubjects.filter((subject) => arr(krsItems).some((krs) => krs.subjectId === subject.id)) as Subject[]
    } else if (session.role === "kaprodi") {
      subjects = getActiveSubjects() as Subject[]
    }

    return subjects
  }, [session, subjects, krsItems, getSubjectsByPengampu, getActiveSubjects, getKrsByUser])

  const canManage = session?.role === "dosen" || session?.role === "kaprodi"

  // Group subjects by angkatan for dosen/kaprodi
  const subjectsByAngkatan = useMemo(() => {
    if (!canManage) return {}
    
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
  }, [availableSubjects, canManage])

  // Group subjects by class for dosen/kaprodi (old version - kept for backward compatibility)
  const subjectsByClass = useMemo(() => {
    if (!canManage) return {}
    
    const grouped: Record<string, Subject[]> = {}
    availableSubjects.forEach((subject) => {
      const className = `${subject.angkatan} ${subject.kelas || 'A'}`
      if (!grouped[className]) {
        grouped[className] = []
      }
      grouped[className].push(subject)
    })
    
    // Sort by class name
    return Object.keys(grouped)
      .sort()
      .reduce((acc, key) => {
        acc[key] = grouped[key]
        return acc
      }, {} as Record<string, Subject[]>)
  }, [availableSubjects, canManage])

  const handleSubjectClick = (subject: Subject) => {
    setSelectedSubject(subject)
  }

  const handleBackToList = () => {
    setSelectedSubject(null)
    setSelectedClass(null)
    setSelectedAngkatan(null)
  }

  const handleAngkatanClick = (angkatan: string) => {
    setSelectedAngkatan(angkatan)
  }

  const handleClassClick = (angkatan: string, className: string) => {
    setSelectedAngkatan(angkatan)
    setSelectedClass(className)
  }

  const handleBackToClasses = () => {
    setSelectedSubject(null)
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

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-destructive">Akses Ditolak</CardTitle>
            <CardDescription className="text-center">Anda harus login untuk mengakses halaman ini.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Show loading state while fetching
  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="px-3 md:px-4">
          <h1 className="text-lg md:text-2xl lg:text-3xl font-bold tracking-tight">Konten Asynchronous</h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-1">Kelola tugas, materi, dan kehadiran untuk mata kuliah</p>
        </div>

        <div className="px-3 md:px-4">
          <Card>
            <CardContent className="p-8 md:p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 animate-pulse">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm md:text-base text-muted-foreground">Memuat data mata kuliah...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (availableSubjects.length === 0) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="px-3 md:px-4">
          <h1 className="text-lg md:text-2xl lg:text-3xl font-bold tracking-tight">Konten Asynchronous</h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-1">Kelola tugas, materi, dan kehadiran untuk mata kuliah</p>
        </div>

        <div className="px-3 md:px-4">
          <Card>
            <CardContent className="p-8 md:p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-base md:text-lg font-semibold mb-2">Tidak Ada Mata Kuliah</h3>
              <p className="text-sm md:text-base text-muted-foreground">
                {session.role === "dosen"
                  ? "Anda belum ditugaskan sebagai pengampu mata kuliah."
                  : session.role === "mahasiswa"
                    ? "Anda belum mengambil mata kuliah. Silakan lakukan KRS terlebih dahulu."
                    : "Belum ada mata kuliah aktif yang tersedia."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {!selectedSubject ? (
        <>
          {/* Header */}
          <div className="px-3 md:px-4">
            <h1 className="text-lg md:text-2xl lg:text-3xl font-bold tracking-tight">Konten Asynchronous</h1>
            <p className="text-muted-foreground text-xs md:text-sm mt-1">
              {canManage
                ? "Kelola tugas dan materi untuk mata kuliah yang Anda ampu"
                : "Lihat tugas dan materi untuk mata kuliah yang Anda ambil"}
            </p>
          </div>

          {/* For Dosen/Kaprodi: Show angkatan grouping with Folder component */}
          {canManage && !selectedClass ? (
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
          ) : canManage && selectedAngkatan && selectedClass ? (
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
                  {subjectsByAngkatan[selectedAngkatan]?.[selectedClass]?.length || 0} mata kuliah tersedia
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 px-3 md:px-4">
                {subjectsByAngkatan[selectedAngkatan]?.[selectedClass]?.map((subject) => (
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
          ) : (
            /* For Mahasiswa: Show subjects directly */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 px-3 md:px-4">
              {availableSubjects.map((subject) => (
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
                      {subject.kelas && (
                        <Badge variant="outline" className="text-xs">
                          Kelas {subject.kelas}
                        </Badge>
                      )}
                      {subject.angkatan && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                          <GraduationCap className="h-3 w-3" />
                          <span>{subject.angkatan}</span>
                        </div>
                      )}
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
          )}
        </>
      ) : (
        <>
          {/* Back Button & Header */}
          <div className="px-3 md:px-4 space-y-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToClasses}
              className="gap-2 -ml-2 hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
              {canManage && selectedClass ? 'Kembali ke Daftar Mata Kuliah' : 'Kembali ke Daftar Mata Kuliah'}
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

          {/* Tabs Content */}
          <div className="px-3 md:px-4">
            <Tabs defaultValue="assignments" className="w-full">
              <div className="sticky top-0 z-10 bg-background pb-3">
                <TabsList className="w-full grid grid-cols-2 h-10 md:h-11">
                  <TabsTrigger value="assignments" className="flex items-center gap-2 text-xs md:text-sm">
                    <FileText className="h-4 w-4" />
                    Tugas
                  </TabsTrigger>
                  <TabsTrigger value="materials" className="flex items-center gap-2 text-xs md:text-sm">
                    <BookOpen className="h-4 w-4" />
                    Materi
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="assignments" className="mt-0">
                <AssignmentTab subjectId={selectedSubject.id} canManage={canManage} userRole={session?.role || ""} />
              </TabsContent>

              <TabsContent value="materials" className="mt-0">
                <MaterialTab subjectId={selectedSubject.id} canManage={canManage} userRole={session?.role || ""} />
              </TabsContent>
            </Tabs>
          </div>
        </>
      )}
    </div>
  )
}
