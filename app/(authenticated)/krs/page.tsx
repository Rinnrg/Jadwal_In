"use client"
import { useEffect } from "react"
import { useSessionStore } from "@/stores/session.store"
import { useSubjectsStore } from "@/stores/subjects.store"
import { useOfferingsStore } from "@/stores/offerings.store"
import { useKrsStore } from "@/stores/krs.store"
import { useProfileStore } from "@/stores/profile.store"
import { useNotificationStore } from "@/stores/notification.store"
import { canAccessKRS } from "@/lib/rbac"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { SksCounter } from "@/components/krs/SksCounter"
import { KrsPicker } from "@/components/krs/KrsPicker"
import { KrsTable } from "@/components/krs/KrsTable"
import { Loader2 } from "lucide-react"
import { showSuccess } from "@/lib/alerts"

export default function KrsPage() {
  const { session } = useSessionStore()
  const { subjects, fetchSubjects, isLoading: subjectsLoading } = useSubjectsStore()
  const { fetchOfferings, isLoading: offeringsLoading } = useOfferingsStore()
  const { getTotalSks, clearKrsByUserAndTerm } = useKrsStore()
  const { getProfile } = useProfileStore()
  const { clearBadge } = useNotificationStore()

  // Fetch data on mount
  useEffect(() => {
    fetchSubjects()
    fetchOfferings()
  }, [])

  // Clear KRS notification badge when user opens this page
  useEffect(() => {
    if (session?.id) {
      clearBadge("krs", session.id)
    }
  }, [session?.id, clearBadge])

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

  // Show loading state
  if (subjectsLoading || offeringsLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="glass-effect border-2 border-primary/20 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Memuat Data KRS</h2>
          <p className="text-muted-foreground">Mohon tunggu sebentar...</p>
        </Card>
      </div>
    )
  }

  const handleScheduleSuggestion = (subjectId: string) => {
    // This will be implemented when we build the schedule system
    showSuccess("Fitur saran jadwal akan tersedia di sistem jadwal")
  }

  return (
    <div className="space-y-4 md:space-y-6 px-0 md:px-4">
      {/* Header Section - Kompak di Mobile */}
      <div className="px-3 md:px-0">
        <div>
          <h1 className="text-lg md:text-2xl lg:text-3xl font-bold tracking-tight">KRS (Kartu Rencana Studi)</h1>
          <p className="text-muted-foreground text-xs md:text-base">Kelola mata kuliah yang akan Anda ambil</p>
        </div>
      </div>

      {/* SKS Counter - Sticky di Top pada Mobile */}
      <div className="md:hidden sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-y px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <div className="text-2xl font-bold">{totalSks}</div>
              <div className="text-xs text-muted-foreground">Total SKS</div>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="flex-1">
              <Progress value={Math.min((totalSks / 24) * 100, 100)} className="h-2" />
              <div className="text-xs text-muted-foreground mt-1">{totalSks}/24 SKS</div>
            </div>
          </div>
          <Badge variant={totalSks > 24 ? "destructive" : totalSks < 12 ? "secondary" : "default"} className="ml-2">
            {totalSks > 24 ? "Over" : totalSks < 12 ? "Min" : "OK"}
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <KrsPicker userId={session.id} term={currentTerm} />
          <KrsTable userId={session.id} term={currentTerm} onScheduleSuggestion={handleScheduleSuggestion} />
        </div>
        
        {/* SKS Counter - Desktop Only */}
        <div className="hidden md:block">
          <SksCounter totalSks={totalSks} />
        </div>
      </div>
    </div>
  )
}
