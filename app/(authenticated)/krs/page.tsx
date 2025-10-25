"use client"
import { useEffect } from "react"
import { useSessionStore } from "@/stores/session.store"
import { useSubjectsStore } from "@/stores/subjects.store"
import { useOfferingsStore } from "@/stores/offerings.store"
import { useKrsStore } from "@/stores/krs.store"
import { useProfileStore } from "@/stores/profile.store"
import { useNotificationStore } from "@/stores/notification.store"
import { useRealtimeSync } from "@/hooks/use-realtime-sync"
import { canAccessKRS } from "@/lib/rbac"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { SksCounter } from "@/components/krs/SksCounter"
import { KrsPicker } from "@/components/krs/KrsPicker"
import { KrsTable } from "@/components/krs/KrsTable"
import { showSuccess } from "@/lib/alerts"

export default function KrsPage() {
  const { session } = useSessionStore()
  const { subjects, fetchSubjects, isLoading: subjectsLoading } = useSubjectsStore()
  const { fetchOfferings, isLoading: offeringsLoading } = useOfferingsStore()
  const { getTotalSks, clearKrsByUserAndTerm, fetchKrsItems, isLoading: krsLoading } = useKrsStore()
  const { getProfile } = useProfileStore()
  const { markAsRead } = useNotificationStore()

  // Enable real-time sync for KRS page
  useRealtimeSync({
    enabled: true,
    pollingInterval: 2000, // 2 seconds for real-time updates
  })

  // Fetch data on mount
  useEffect(() => {
    const loadData = async () => {
      if (!session) return
      
      try {
        console.log('[KRS Page] Loading data...')
        
        // Fetch subjects and offerings first
        await Promise.all([
          fetchSubjects(),
          fetchOfferings(),
        ])
        
        console.log('[KRS Page] Subjects and offerings loaded')
        
        // Fetch KRS items for current user from database
        const currentYear = new Date().getFullYear()
        const currentMonth = new Date().getMonth()
        const isOddSemester = currentMonth >= 8 || currentMonth <= 1
        const currentTerm = `${currentYear}/${currentYear + 1}-${isOddSemester ? "Ganjil" : "Genap"}`
        
        console.log('[KRS Page] Fetching KRS for term:', currentTerm)
        await fetchKrsItems(session.id, currentTerm, true) // Force refresh on mount
        console.log('[KRS Page] KRS items loaded from database')
      } catch (error) {
        console.error('[KRS Page] Error loading data:', error)
      }
    }
    
    loadData()
  }, [session?.id])

  // Mark KRS notification as read when user opens this page
  useEffect(() => {
    if (session?.id) {
      markAsRead("krs", session.id)
    }
  }, [session?.id, markAsRead])

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

  // Show loading state with skeleton
  if (subjectsLoading || offeringsLoading || krsLoading) {
    return (
      <div className="space-y-4 md:space-y-6 px-0 md:px-4">
        {/* Header Skeleton */}
        <div className="px-3 md:px-0">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>

        {/* Mobile SKS Counter Skeleton */}
        <div className="md:hidden sticky top-0 z-20 bg-background/95 backdrop-blur border-y px-3 py-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-12 w-24" />
            <Skeleton className="h-2 w-32" />
            <Skeleton className="h-6 w-12" />
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4 md:space-y-6 px-3 md:px-0">
            {/* KRS Picker Skeleton */}
            <div className="space-y-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-10 w-full" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            </div>
            
            {/* KRS Table Skeleton */}
            <div className="space-y-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
          
          {/* SKS Counter Skeleton - Desktop */}
          <div className="hidden md:block">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
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
