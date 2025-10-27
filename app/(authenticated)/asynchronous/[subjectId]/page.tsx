"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSessionStore } from "@/stores/session.store"
import { useSubjectsStore } from "@/stores/subjects.store"
import { useRealtimeSync } from "@/hooks/use-realtime-sync"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BookOpen, FileText } from "lucide-react"
import { AssignmentTab } from "@/components/asynchronous/AssignmentTab"
import { MaterialTab } from "@/components/asynchronous/MaterialTab"

export default function SubjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { session } = useSessionStore()
  const { getSubjectById } = useSubjectsStore()
  const subjectId = params.subjectId as string

  // Enable real-time sync for subject detail page
  useRealtimeSync({
    enabled: true,
    pollingInterval: 2000,
  })

  const subject = getSubjectById(subjectId)
  const canManage = session?.role === "dosen" || session?.role === "kaprodi"

  useEffect(() => {
    if (!subject) {
      console.log('[SubjectDetail] Subject not found:', subjectId)
    }
  }, [subject, subjectId])

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px] px-3 md:px-4">
        <Card className="w-full max-w-md p-6">
          <h2 className="text-center text-lg font-semibold text-destructive">Akses Ditolak</h2>
          <p className="text-center text-sm text-muted-foreground mt-2">
            Anda harus login untuk mengakses halaman ini.
          </p>
        </Card>
      </div>
    )
  }

  if (!subject) {
    return (
      <div className="flex items-center justify-center min-h-[400px] px-3 md:px-4">
        <Card className="w-full max-w-md p-6">
          <h2 className="text-center text-lg font-semibold">Mata Kuliah Tidak Ditemukan</h2>
          <p className="text-center text-sm text-muted-foreground mt-2">
            Mata kuliah yang Anda cari tidak ditemukan.
          </p>
          <Button 
            onClick={() => router.push('/asynchronous')} 
            className="mt-4 w-full"
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Daftar Mata Kuliah
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Back Button & Header */}
      <div className="px-3 md:px-4 space-y-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/asynchronous')}
          className="gap-2 -ml-2 hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Daftar Mata Kuliah
        </Button>
        
        <div className="flex items-start gap-3 p-4 bg-card border rounded-lg">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base md:text-xl lg:text-2xl font-bold leading-tight mb-1">
              {subject.nama}
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              {subject.kode} • Semester {subject.semester} • {subject.sks} SKS
              {subject.kelas && ` • Kelas ${subject.kelas}`}
              {subject.angkatan && ` • Angkatan ${subject.angkatan}`}
            </p>
            {subject.prodi && (
              <p className="text-xs text-muted-foreground mt-1">
                {subject.prodi}
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
            <AssignmentTab subjectId={subject.id} canManage={canManage} userRole={session?.role || ""} />
          </TabsContent>

          <TabsContent value="materials" className="mt-0">
            <MaterialTab subjectId={subject.id} canManage={canManage} userRole={session?.role || ""} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
