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

export default function AsynchronousPage() {
  const { session } = useSessionStore()
  const { subjects, getSubjectsByPengampu, getActiveSubjects, getSubjectById, fetchSubjects, isLoading } = useSubjectsStore()
  const { krsItems, getKrsByUser } = useKrsStore()
  const { markAsRead } = useNotificationStore()
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  
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

  // Group subjects by class for dosen/kaprodi
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

  const canManage = session?.role === "dosen" || session?.role === "kaprodi"

  const handleSubjectClick = (subject: Subject) => {
    setSelectedSubject(subject)
  }

  const handleBackToList = () => {
    setSelectedSubject(null)
    setSelectedClass(null)
  }

  const handleClassClick = (className: string) => {
    setSelectedClass(className)
  }

  const handleBackToClasses = () => {
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

          {/* For Dosen/Kaprodi: Show class grouping first */}
          {canManage && !selectedClass ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 px-3 md:px-4">
              {Object.entries(subjectsByClass).map(([className, classSubjects]) => (
                <Card
                  key={className}
                  className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all duration-200 overflow-hidden group"
                  onClick={() => handleClassClick(className)}
                >
                  <CardHeader className="p-4 pb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                        <GraduationCap className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm md:text-base leading-tight mb-1">
                          Kelas {className}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {classSubjects.length} mata kuliah
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-1">
                      {classSubjects.slice(0, 3).map((subject) => (
                        <p key={subject.id} className="text-xs text-muted-foreground truncate">
                          • {subject.nama}
                        </p>
                      ))}
                      {classSubjects.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{classSubjects.length - 3} mata kuliah lainnya
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : canManage && selectedClass ? (
            /* Show subjects in selected class */
            <>
              <div className="px-3 md:px-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToClasses}
                  className="gap-2 -ml-2 hover:bg-muted"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Kembali ke Daftar Kelas
                </Button>
                <h2 className="text-base md:text-xl font-bold mt-3">
                  Mata Kuliah Kelas {selectedClass}
                </h2>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {subjectsByClass[selectedClass]?.length || 0} mata kuliah tersedia
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 px-3 md:px-4">
                {subjectsByClass[selectedClass]?.map((subject) => (
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
              onClick={canManage && selectedClass ? handleBackToClasses : handleBackToList}
              className="gap-2 -ml-2 hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
              {canManage && selectedClass ? 'Kembali ke Daftar Mata Kuliah' : 'Kembali ke Daftar' + (canManage ? ' Kelas' : ' Mata Kuliah')}
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
