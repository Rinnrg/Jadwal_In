"use client"

import { useState, useEffect } from "react"
import { useSessionStore } from "@/stores/session.store"
import { useSubjectsStore } from "@/stores/subjects.store"
import { useOfferingsStore } from "@/stores/offerings.store"
import { canAccessSubjects, canEditSubject } from "@/lib/rbac"
import type { Subject } from "@/data/schema"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SubjectForm } from "@/components/subjects/SubjectForm"
import { SubjectTable } from "@/components/subjects/SubjectTable"
import {
  Plus,
  ArrowLeft,
  BookOpen,
  Users,
  Activity,
  Target,
  Award,
  Clock,
  TrendingUp,
  Sparkles,
} from "lucide-react"

export default function SubjectsPage() {
  const { session } = useSessionStore()
  const { subjects, fetchSubjects, isLoading } = useSubjectsStore()
  const { fetchOfferings } = useOfferingsStore()
  const [showForm, setShowForm] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [selectedSubjectForOfferings, setSelectedSubjectForOfferings] = useState<Subject | null>(null)

  // Fetch subjects and offerings from API on mount
  useEffect(() => {
    fetchSubjects()
    fetchOfferings()
  }, [])

  if (!session || !canAccessSubjects(session.role)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center animate-fade-in">
        <Card className="glass-effect border-2 border-primary/20 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Akses Ditolak</h2>
          <p className="text-muted-foreground">Anda tidak memiliki akses ke halaman ini.</p>
        </Card>
      </div>
    )
  }

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject)
    setShowForm(true)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingSubject(null)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingSubject(null)
  }

  if (showForm) {
    return (
      <div className="space-y-4 md:space-y-6 px-2 md:px-4">
        <div className="flex items-center space-x-3 md:space-x-4">
          <Button variant="ghost" onClick={handleCancel} className="text-xs md:text-sm">
            <ArrowLeft className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">
              {editingSubject ? "Edit Mata Kuliah" : "Tambah Mata Kuliah"}
            </h1>
            <p className="text-gray-900 dark:text-gray-100 font-bold text-sm md:text-base">
              {editingSubject ? "Perbarui informasi mata kuliah" : "Tambahkan mata kuliah baru ke katalog"}
            </p>
          </div>
        </div>

        <div className="animate-slide-up">
          <SubjectForm subject={editingSubject || undefined} onSuccess={handleFormSuccess} onCancel={handleCancel} />
        </div>
      </div>
    )
  }

  const subjectStats = {
    total: subjects.length,
    active: subjects.filter((s) => s.status === "aktif").length,
    totalCredits: subjects.reduce((acc, s) => acc + s.sks, 0),
    avgCredits:
      subjects.length > 0
        ? Math.round((subjects.reduce((acc, s) => acc + s.sks, 0) / subjects.length) * 10) / 10
        : 0,
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center animate-fade-in">
        <Card className="glass-effect border-2 border-primary/20 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-spin">
            <Clock className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Memuat Data</h2>
          <p className="text-muted-foreground">Mohon tunggu sebentar...</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-3 md:space-y-6 px-2 md:px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">
            Mata Kuliah
          </h1>
          <p className="text-gray-900 dark:text-gray-100 font-bold text-sm md:text-base">
            Kelola mata kuliah program studi
          </p>
        </div>
        {canEditSubject(session.role) && (
          <Button
            onClick={() => setShowForm(true)}
            className="text-xs md:text-sm w-full sm:w-auto"
          >
            <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
            Tambah Mata Kuliah
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:flex gap-2 md:gap-4 overflow-x-auto pb-2 md:snap-x md:snap-mandatory">
        <Card className="card-interactive border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 group md:min-w-[280px] md:snap-start">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 md:pb-3 px-2.5 md:px-6 pt-2.5 md:pt-6">
            <CardTitle className="text-[10px] md:text-sm font-bold">Total MK</CardTitle>
            <BookOpen className="h-4 w-4 md:h-6 md:w-6 text-blue-500 group-hover:scale-125 transition-transform duration-300" />
          </CardHeader>
          <CardContent className="px-2.5 md:px-6 pb-2.5 md:pb-6">
            <div className="text-2xl md:text-4xl font-bold text-blue-600 mb-0.5 md:mb-2">{subjectStats.total}</div>
            <p className="text-[10px] md:text-sm text-muted-foreground">Tersedia</p>
            <div className="mt-1 md:mt-3 flex items-center text-[9px] md:text-xs text-blue-600">
              <TrendingUp className="h-2 w-2 md:h-3 md:w-3 mr-0.5 md:mr-1" />
              {subjectStats.active} aktif
            </div>
          </CardContent>
        </Card>

        <Card className="card-interactive border-2 border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 group md:min-w-[280px] md:snap-start">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 md:pb-3 px-2.5 md:px-6 pt-2.5 md:pt-6">
            <CardTitle className="text-[10px] md:text-sm font-bold">MK Aktif</CardTitle>
            <Activity className="h-4 w-4 md:h-6 md:w-6 text-green-500 group-hover:scale-125 transition-transform duration-300" />
          </CardHeader>
          <CardContent className="px-2.5 md:px-6 pb-2.5 md:pb-6">
            <div className="text-2xl md:text-4xl font-bold text-green-600 mb-0.5 md:mb-2">{subjectStats.active}</div>
            <p className="text-[10px] md:text-sm text-muted-foreground">Semester ini</p>
            <div className="mt-1 md:mt-3 flex items-center text-[9px] md:text-xs text-green-600">
              <Target className="h-2 w-2 md:h-3 md:w-3 mr-0.5 md:mr-1" />
              {Math.round((subjectStats.active / subjectStats.total) * 100)}%
            </div>
          </CardContent>
        </Card>

        <Card className="card-interactive border-2 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 group md:min-w-[280px] md:snap-start">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 md:pb-3 px-2.5 md:px-6 pt-2.5 md:pt-6">
            <CardTitle className="text-[10px] md:text-sm font-bold">Total SKS</CardTitle>
            <Award className="h-4 w-4 md:h-6 md:w-6 text-purple-500 group-hover:scale-125 transition-transform duration-300" />
          </CardHeader>
          <CardContent className="px-2.5 md:px-6 pb-2.5 md:pb-6">
            <div className="text-2xl md:text-4xl font-bold text-purple-600 mb-0.5 md:mb-2">{subjectStats.totalCredits}</div>
            <p className="text-[10px] md:text-sm text-muted-foreground">SKS</p>
            <div className="mt-1 md:mt-3 flex items-center text-[9px] md:text-xs text-purple-600">
              <Sparkles className="h-2 w-2 md:h-3 md:w-3 mr-0.5 md:mr-1" />
              ≈ {subjectStats.avgCredits} SKS
            </div>
          </CardContent>
        </Card>

        <Card className="card-interactive border-2 border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-600 group md:min-w-[280px] md:snap-start">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 md:pb-3 px-2.5 md:px-6 pt-2.5 md:pt-6">
            <CardTitle className="text-[10px] md:text-sm font-bold">Rata SKS</CardTitle>
            <Clock className="h-4 w-4 md:h-6 md:w-6 text-orange-500 group-hover:scale-125 transition-transform duration-300" />
          </CardHeader>
          <CardContent className="px-2.5 md:px-6 pb-2.5 md:pb-6">
            <div className="text-2xl md:text-4xl font-bold text-orange-600 mb-0.5 md:mb-2">{subjectStats.avgCredits}</div>
            <p className="text-[10px] md:text-sm text-muted-foreground">Per MK</p>
            <div className="mt-1 md:mt-3 flex items-center text-[9px] md:text-xs text-orange-600">
              <TrendingUp className="h-2 w-2 md:h-3 md:w-3 mr-0.5 md:mr-1" />
              Standard
            </div>
          </CardContent>
        </Card>
      </div>

      <SubjectsGroupedByAngkatan 
        subjects={subjects}
        onEdit={canEditSubject(session.role) ? handleEdit : undefined} 
      />
    </div>
  )
}

// Component to display subjects grouped by angkatan
function SubjectsGroupedByAngkatan({ subjects, onEdit }: { subjects: Subject[], onEdit?: (subject: Subject) => void }) {
  const [expandedAngkatan, setExpandedAngkatan] = useState<number | null>(null)
  
  // Group subjects by angkatan
  const groupedByAngkatan = subjects.reduce((acc, subject) => {
    const angkatan = subject.angkatan
    if (!acc[angkatan]) {
      acc[angkatan] = []
    }
    acc[angkatan].push(subject)
    return acc
  }, {} as Record<number, Subject[]>)
  
  // Sort angkatan descending (newest first)
  const sortedAngkatans = Object.keys(groupedByAngkatan)
    .map(Number)
    .sort((a, b) => b - a)
  
  const toggleAngkatan = (angkatan: number) => {
    setExpandedAngkatan(expandedAngkatan === angkatan ? null : angkatan)
  }
  
  if (subjects.length === 0) {
    return (
      <Card className="glass-effect border-2 border-primary/20 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <BookOpen className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Belum Ada Mata Kuliah</h2>
        <p className="text-muted-foreground">Tambahkan mata kuliah pertama untuk memulai.</p>
      </Card>
    )
  }
  
  return (
    <div className="space-y-3 md:space-y-4">
      {sortedAngkatans.map((angkatan) => {
        const angkatanSubjects = groupedByAngkatan[angkatan]
        const isExpanded = expandedAngkatan === angkatan
        
        return (
          <Card key={angkatan} className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader 
              className="cursor-pointer hover:bg-muted/50 transition-colors py-3 md:py-6 px-3 md:px-6"
              onClick={() => toggleAngkatan(angkatan)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm md:text-base">
                    {angkatan.toString().slice(-2)}
                  </div>
                  <div>
                    <CardTitle className="text-base md:text-xl">Angkatan {angkatan}</CardTitle>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      {angkatanSubjects.length} MK • {angkatanSubjects.reduce((acc, s) => acc + s.sks, 0)} SKS
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-xs md:text-sm">
                  {isExpanded ? "Tutup" : "Lihat"}
                  <ArrowLeft className={`h-3 w-3 md:h-4 md:w-4 ml-1 md:ml-2 transition-transform ${isExpanded ? '-rotate-90' : 'rotate-180'}`} />
                </Button>
              </div>
            </CardHeader>
            
            {isExpanded && (
              <CardContent className="animate-slide-up pt-0 px-2 md:px-6 pb-3 md:pb-6">
                <SubjectTable 
                  subjects={angkatanSubjects}
                  onEdit={onEdit} 
                />
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}
