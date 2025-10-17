"use client"

import { useState } from "react"
import { useSessionStore } from "@/stores/session.store"
import { useSubjectsStore } from "@/stores/subjects.store"
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
  const { subjects } = useSubjectsStore()
  const [showForm, setShowForm] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)

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
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center space-x-6 animate-slide-in-left">
          <Button variant="ghost" onClick={handleCancel} className="button-modern cursor-pointer">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              {editingSubject ? "Edit Mata Kuliah" : "Tambah Mata Kuliah"}
            </h1>
            <p className="text-muted-foreground text-lg mt-2">
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

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-16">
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-5xl font-bold tracking-tight animate-float">
            Mata Kuliah
          </h1>
          <p className="text-muted-foreground text-xl mt-2 animate-slide-in-left" style={{ animationDelay: "0.1s" }}>
            Kelola mata kuliah program studi
          </p>
        </div>
        {canEditSubject(session.role) && (
          <Button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 rounded-xl shadow-lg animate-slide-in-right cursor-pointer"
          >
            <Plus className="h-5 w-5 mr-2" />
            Tambah Mata Kuliah
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
        <Card className="card-interactive border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-bold">Total Mata Kuliah</CardTitle>
            <BookOpen className="h-6 w-6 text-blue-500 group-hover:scale-125 transition-transform duration-300" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-600 mb-2">{subjectStats.total}</div>
            <p className="text-sm text-muted-foreground">Mata kuliah tersedia</p>
            <div className="mt-3 flex items-center text-xs text-blue-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              {subjectStats.active} aktif
            </div>
          </CardContent>
        </Card>

        <Card className="card-interactive border-2 border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-bold">Mata Kuliah Aktif</CardTitle>
            <Activity className="h-6 w-6 text-green-500 group-hover:scale-125 transition-transform duration-300" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600 mb-2">{subjectStats.active}</div>
            <p className="text-sm text-muted-foreground">Semester ini</p>
            <div className="mt-3 flex items-center text-xs text-green-600">
              <Target className="h-3 w-3 mr-1" />
              {Math.round((subjectStats.active / subjectStats.total) * 100)}% dari total
            </div>
          </CardContent>
        </Card>

        <Card className="card-interactive border-2 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-bold">Total SKS</CardTitle>
            <Award className="h-6 w-6 text-purple-500 group-hover:scale-125 transition-transform duration-300" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-purple-600 mb-2">{subjectStats.totalCredits}</div>
            <p className="text-sm text-muted-foreground">Satuan Kredit Semester</p>
            <div className="mt-3 flex items-center text-xs text-purple-600">
              <Sparkles className="h-3 w-3 mr-1" />
              Rata-rata {subjectStats.avgCredits} SKS
            </div>
          </CardContent>
        </Card>

        <Card className="card-interactive border-2 border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-600 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-bold">Rata-rata SKS</CardTitle>
            <Clock className="h-6 w-6 text-orange-500 group-hover:scale-125 transition-transform duration-300" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-orange-600 mb-2">{subjectStats.avgCredits}</div>
            <p className="text-sm text-muted-foreground">SKS per mata kuliah</p>
            <div className="mt-3 flex items-center text-xs text-orange-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              Standard akademik
            </div>
          </CardContent>
        </Card>
      </div>

      <SubjectTable onEdit={canEditSubject(session.role) ? handleEdit : undefined} />
    </div>
  )
}
