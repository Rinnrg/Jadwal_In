"use client"
import { useSessionStore } from "@/stores/session.store"
import { useSubjectsStore } from "@/stores/subjects.store"
import { useKrsStore } from "@/stores/krs.store"
import { useProfileStore } from "@/stores/profile.store"
import { canAccessKRS } from "@/lib/rbac"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SksCounter } from "@/components/krs/SksCounter"
import { KrsPicker } from "@/components/krs/KrsPicker"
import { KrsTable } from "@/components/krs/KrsTable"
import { Trash2, Download } from "lucide-react"
import { confirmAction, showSuccess } from "@/lib/alerts"

export default function KrsPage() {
  const { session } = useSessionStore()
  const { subjects } = useSubjectsStore()
  const { getTotalSks, clearKrsByUserAndTerm } = useKrsStore()
  const { getProfile } = useProfileStore()

  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()
  const isOddSemester = currentMonth >= 8 || currentMonth <= 1
  const currentTerm = `${currentYear}/${currentYear + 1}-${isOddSemester ? "Ganjil" : "Genap"}`

  if (!session || !canAccessKRS(session.role)) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Anda tidak memiliki akses ke halaman ini.</p>
      </div>
    )
  }

  const profile = getProfile(session.id)
  const totalSks = getTotalSks(session.id, currentTerm, subjects)

  const handleClearKrs = async () => {
    const confirmed = await confirmAction(
      "Hapus Semua KRS",
      `Apakah Anda yakin ingin menghapus semua mata kuliah dari KRS?`,
      "Ya, Hapus Semua",
    )

    if (confirmed) {
      clearKrsByUserAndTerm(session.id, currentTerm)
      showSuccess("Semua mata kuliah berhasil dihapus dari KRS")
    }
  }

  const handleExportKrs = () => {
    // Simple CSV export
    const krsItems = useKrsStore.getState().getKrsByUser(session.id, currentTerm)
    const krsWithSubjects = krsItems
      .map((item) => {
        const subject = subjects.find((s) => s.id === item.subjectId)
        return subject ? { ...item, subject } : null
      })
      .filter(Boolean)

    const csvContent = [
      ["Kode", "Nama", "SKS", "Semester", "Program Studi"].join(","),
      ...krsWithSubjects.map((item) =>
        [
          item!.subject.kode,
          `"${item!.subject.nama}"`,
          item!.subject.sks,
          item!.subject.semester,
          `"${item!.subject.prodi || ""}"`,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `KRS-${currentTerm.replace(/\//g, "-")}.csv`
    a.click()
    URL.revokeObjectURL(url)

    showSuccess("KRS berhasil diekspor")
  }

  const handleScheduleSuggestion = (subjectId: string) => {
    // This will be implemented when we build the schedule system
    showSuccess("Fitur saran jadwal akan tersedia di sistem jadwal")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">KRS (Kartu Rencana Studi)</h1>
          <p className="text-muted-foreground">Kelola mata kuliah yang akan Anda ambil</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleExportKrs} disabled={totalSks === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={handleClearKrs} disabled={totalSks === 0}>
            <Trash2 className="h-4 w-4 mr-2" />
            Hapus Semua
          </Button>
        </div>
      </div>

      {/* Profile Warning */}
      {(!profile?.angkatan || !profile?.kelas) && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
          <CardHeader>
            <CardTitle className="text-yellow-800 dark:text-yellow-200">Lengkapi Profil</CardTitle>
            <CardDescription className="text-yellow-700 dark:text-yellow-300">
              Anda perlu mengisi angkatan dan kelas di profil untuk melihat penawaran mata kuliah yang sesuai.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href="/profile">Lengkapi Profil</a>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <KrsPicker userId={session.id} term={currentTerm} />
          <KrsTable userId={session.id} term={currentTerm} onScheduleSuggestion={handleScheduleSuggestion} />
        </div>
        <div>
          <SksCounter totalSks={totalSks} />
        </div>
      </div>
    </div>
  )
}
