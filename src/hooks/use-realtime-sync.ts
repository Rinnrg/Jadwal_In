import { useEffect, useRef, useState } from "react"
import { useSessionStore } from "@/stores/session.store"
import { useSubjectsStore } from "@/stores/subjects.store"
import { useOfferingsStore } from "@/stores/offerings.store"
import { useKrsStore } from "@/stores/krs.store"
import { useNotificationStore } from "@/stores/notification.store"
import { useGradesStore } from "@/stores/grades.store"
import { useCourseworkStore } from "@/stores/coursework.store"
import { useRemindersStore } from "@/stores/reminders.store"
import { useScheduleStore } from "@/stores/schedule.store"
import { nowUTC } from "@/lib/time"

interface RealtimeSyncOptions {
  enabled?: boolean
  pollingInterval?: number // in milliseconds, default 5000 (5 seconds)
  onSubjectAdded?: (subject: any) => void
  onKrsUpdated?: () => void
}

export function useRealtimeSync(options: RealtimeSyncOptions = {}) {
  const {
    enabled = true,
    pollingInterval = 2000, // 2 detik untuk realtime (lebih cepat dari sebelumnya)
    onSubjectAdded,
    onKrsUpdated,
  } = options

  const { session } = useSessionStore()
  const { subjects, fetchSubjects } = useSubjectsStore()
  const { fetchOfferings } = useOfferingsStore()
  const { krsItems } = useKrsStore()
  const { grades } = useGradesStore()
  const { assignments, materials } = useCourseworkStore()
  const { reminders } = useRemindersStore()
  const { events } = useScheduleStore()
  const { updateBadge } = useNotificationStore()

  const [isPolling, setIsPolling] = useState(false)
  const previousSubjectsCount = useRef(subjects.length)
  const previousKrsCount = useRef(krsItems.length)
  const previousGradesCount = useRef(grades.length)
  const previousAssignmentsCount = useRef(assignments.length)
  const previousMaterialsCount = useRef(materials.length)
  const previousRemindersCount = useRef(reminders.length)
  const previousScheduleCount = useRef(events.length)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isInitialMount = useRef(true)
  const hasShownInitialNotification = useRef(false)
  const lastPollTime = useRef<number>(0)

  useEffect(() => {
    if (!enabled || !session) {
      return
    }

    const pollData = async () => {
      if (isPolling) return // Prevent overlapping polls
      
      const now = Date.now()
      // Prevent polling too frequently (minimum 2 second between polls for realtime)
      if (now - lastPollTime.current < 2000) {
        return
      }
      lastPollTime.current = now
      
      setIsPolling(true)
      try {
        // Fetch latest subjects data with cache busting
        const response = await fetch(`/api/subjects?_t=${Date.now()}`)
        if (response.ok) {
          const latestSubjects = await response.json()
          
          // Also fetch offerings to ensure KRS page has latest data with cache busting
          const offeringsResponse = await fetch(`/api/offerings?_t=${Date.now()}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
            }
          })
          if (offeringsResponse.ok) {
            const latestOfferings = await offeringsResponse.json()
            console.log('[RealtimeSync] Fetched offerings:', latestOfferings.length)
            console.log('[RealtimeSync] Offerings status breakdown:', {
              buka: latestOfferings.filter((o: any) => o.status === 'buka').length,
              tutup: latestOfferings.filter((o: any) => o.status === 'tutup').length,
            })
            useOfferingsStore.setState({ offerings: latestOfferings })
          }
          
          // Also fetch KRS items for mahasiswa to ensure data is synced with database
          if (session.role === "mahasiswa") {
            const currentYear = new Date().getFullYear()
            const currentMonth = new Date().getMonth()
            const isOddSemester = currentMonth >= 8 || currentMonth <= 1
            const currentTerm = `${currentYear}/${currentYear + 1}-${isOddSemester ? "Ganjil" : "Genap"}`
            
            const krsResponse = await fetch(`/api/krs?userId=${session.id}&term=${currentTerm}&_t=${Date.now()}`, {
              cache: 'no-store',
              headers: {
                'Cache-Control': 'no-cache',
              }
            })
            if (krsResponse.ok) {
              const latestKrsItems = await krsResponse.json()
              console.log('[RealtimeSync] Synced KRS items:', latestKrsItems.length, 'items')
              useKrsStore.setState({ krsItems: latestKrsItems })
            }
          }
          
          // Fetch assignments and materials for all users
          try {
            const assignmentsResponse = await fetch(`/api/assignments?_t=${Date.now()}`, {
              cache: 'no-store',
              headers: {
                'Cache-Control': 'no-cache',
              }
            })
            if (assignmentsResponse.ok) {
              const latestAssignments = await assignmentsResponse.json()
              const assignments = latestAssignments.map((a: any) => ({
                ...a,
                dueUTC: a.dueUTC ? Number(a.dueUTC) : undefined,
                createdAt: new Date(a.createdAt).getTime(),
              }))
              useCourseworkStore.setState({ assignments })
              console.log('[RealtimeSync] Synced assignments:', assignments.length, 'items')
            }
          } catch (error) {
            console.error('[RealtimeSync] Error syncing assignments:', error)
          }

          try {
            const materialsResponse = await fetch(`/api/materials?_t=${Date.now()}`, {
              cache: 'no-store',
              headers: {
                'Cache-Control': 'no-cache',
              }
            })
            if (materialsResponse.ok) {
              const latestMaterials = await materialsResponse.json()
              const materials = latestMaterials.map((m: any) => ({
                ...m,
                createdAt: new Date(m.createdAt).getTime(),
              }))
              useCourseworkStore.setState({ materials })
              console.log('[RealtimeSync] Synced materials:', materials.length, 'items')
            }
          } catch (error) {
            console.error('[RealtimeSync] Error syncing materials:', error)
          }
          
          // On initial mount, just update the count silently
          if (isInitialMount.current) {
            previousSubjectsCount.current = latestSubjects.length
            useSubjectsStore.setState({ subjects: latestSubjects })
            
            // Initialize all counts for the user
            if (session.role === "mahasiswa") {
              const { getKrsByUser } = useKrsStore.getState()
              const { getGradesByUser } = useGradesStore.getState()
              const { getActiveReminders } = useRemindersStore.getState()
              const { getEventsByUser } = useScheduleStore.getState()
              
              const currentYear = new Date().getFullYear()
              const currentMonth = new Date().getMonth()
              const isOddSemester = currentMonth >= 8 || currentMonth <= 1
              const currentTerm = `${currentYear}/${currentYear + 1}-${isOddSemester ? "Ganjil" : "Genap"}`
              
              const currentKrs = getKrsByUser(session.id, currentTerm)
              previousKrsCount.current = currentKrs.length
              
              const currentGrades = getGradesByUser(session.id, currentTerm)
              previousGradesCount.current = currentGrades.filter((g: any) => g.nilaiHuruf).length
              
              const now = nowUTC()
              const thirtyMinutesLater = now + 30 * 60 * 1000
              const activeReminders = getActiveReminders(session.id)
              const upcomingReminders = activeReminders.filter(
                (r: any) => r.dueUTC > now && r.dueUTC <= thirtyMinutesLater
              )
              previousRemindersCount.current = upcomingReminders.length
              
              const userEvents = getEventsByUser(session.id)
              previousScheduleCount.current = userEvents.length
              
              previousAssignmentsCount.current = assignments.filter(a => 
                a.dueUTC && a.dueUTC > now
              ).length
              previousMaterialsCount.current = materials.length
            }
            
            isInitialMount.current = false
            // Wait a bit before allowing notifications (reduced to 3 seconds for faster realtime)
            setTimeout(() => {
              hasShownInitialNotification.current = true
            }, 3000) // 3 second grace period
            return
          }
          
          // Check if new subjects were added
          if (latestSubjects.length > previousSubjectsCount.current) {
            const newSubjectsCount = latestSubjects.length - previousSubjectsCount.current
            const newSubjects = latestSubjects.slice(-newSubjectsCount)
            
            // Update the store silently first
            useSubjectsStore.setState({ subjects: latestSubjects })
            
            // Also update previousSubjectsCount to prevent duplicate notifications
            previousSubjectsCount.current = latestSubjects.length
            
            // For mahasiswa, check if new subjects were added to their KRS
            if (session.role === "mahasiswa") {
              const { getKrsByUser } = useKrsStore.getState()
              const currentYear = new Date().getFullYear()
              const currentMonth = new Date().getMonth()
              const isOddSemester = currentMonth >= 8 || currentMonth <= 1
              const currentTerm = `${currentYear}/${currentYear + 1}-${isOddSemester ? "Ganjil" : "Genap"}`
              
              const previousKrsLength = previousKrsCount.current
              const currentKrs = getKrsByUser(session.id, currentTerm)
              const currentKrsLength = currentKrs.length
              
              // If KRS count increased, update badge (FloatingNotifications will show toast)
              if (currentKrsLength > previousKrsLength && !isInitialMount.current && hasShownInitialNotification.current) {
                // Update badge - FloatingNotifications will handle the toast
                updateBadge("krs", session.id, currentKrsLength)
              }
              
              previousKrsCount.current = currentKrsLength
            }
            
            // Check for new grades (KHS)
            if (session.role === "mahasiswa") {
              const { getGradesByUser } = useGradesStore.getState()
              const currentYear = new Date().getFullYear()
              const currentMonth = new Date().getMonth()
              const isOddSemester = currentMonth >= 8 || currentMonth <= 1
              const currentTerm = `${currentYear}/${currentYear + 1}-${isOddSemester ? "Ganjil" : "Genap"}`
              
              const currentGrades = getGradesByUser(session.id, currentTerm)
              const currentGradesWithValue = currentGrades.filter((g: any) => g.nilaiHuruf).length
              const previousGradesLength = previousGradesCount.current
              
              if (currentGradesWithValue > previousGradesLength && hasShownInitialNotification.current) {
                // Update badge - FloatingNotifications will handle the toast
                updateBadge("khs", session.id, currentGradesWithValue)
              }
              
              previousGradesCount.current = currentGradesWithValue
            }
            
            // Check for new assignments/materials (Asynchronous)
            if (session.role === "mahasiswa") {
              const now = nowUTC()
              const newAssignments = assignments.filter(a => a.dueUTC && a.dueUTC > now)
              const currentAssignmentsCount = newAssignments.length
              const currentMaterialsCount = materials.length
              const totalAsyncCount = currentAssignmentsCount + currentMaterialsCount
              const previousAsyncCount = previousAssignmentsCount.current + previousMaterialsCount.current
              
              if (totalAsyncCount > previousAsyncCount && hasShownInitialNotification.current) {
                // Update badge - FloatingNotifications will handle the toast
                updateBadge("asynchronous", session.id, totalAsyncCount)
              }
              
              previousAssignmentsCount.current = currentAssignmentsCount
              previousMaterialsCount.current = currentMaterialsCount
            }
            
            // Check for upcoming reminders (Pengingat)
            if (session.role === "mahasiswa") {
              const { getActiveReminders } = useRemindersStore.getState()
              const now = nowUTC()
              const thirtyMinutesLater = now + 30 * 60 * 1000
              const activeReminders = getActiveReminders(session.id)
              const upcomingReminders = activeReminders.filter(
                (r: any) => r.dueUTC > now && r.dueUTC <= thirtyMinutesLater
              )
              const currentRemindersCount = upcomingReminders.length
              const previousRemindersLength = previousRemindersCount.current
              
              if (currentRemindersCount > previousRemindersLength && hasShownInitialNotification.current) {
                // Update badge - FloatingNotifications will handle the toast
                updateBadge("reminder", session.id, currentRemindersCount)
              }
              
              previousRemindersCount.current = currentRemindersCount
            }
            
            // Check for schedule changes (Jadwal)
            if (session.role === "mahasiswa") {
              const { getEventsByUser } = useScheduleStore.getState()
              const userEvents = getEventsByUser(session.id)
              const currentScheduleCount = userEvents.length
              const previousScheduleLength = previousScheduleCount.current
              
              if (currentScheduleCount !== previousScheduleLength && hasShownInitialNotification.current) {
                // Update badge - FloatingNotifications will handle the toast
                updateBadge("jadwal", session.id, currentScheduleCount > 0 ? 1 : 0)
              }
              
              previousScheduleCount.current = currentScheduleCount
            }
            
            // Notify about new subjects
            newSubjects.forEach((subject: any) => {
              // Call optional callback
              onSubjectAdded?.(subject)
            })
          }
          
          // CRITICAL: Always update subjects store to catch status changes (aktif → arsip)
          // This ensures KRS page updates when subjects are archived/unarchived
          useSubjectsStore.setState({ subjects: latestSubjects })
          
          // Always update previousSubjectsCount at the end
          previousSubjectsCount.current = latestSubjects.length
        }
        
        // You can add more polling for other data types here
        // For example, KRS, schedules, assignments, etc.
        
      } catch (error) {
        console.error("[RealtimeSync] Polling error:", error)
      } finally {
        setIsPolling(false)
      }
    }

    // Initial poll
    pollData()

    // Set up interval
    intervalRef.current = setInterval(pollData, pollingInterval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled, session, pollingInterval])

  // Update refs when data changes from other sources
  useEffect(() => {
    if (subjects.length !== previousSubjectsCount.current && !isPolling) {
      previousSubjectsCount.current = subjects.length
    }
  }, [subjects.length, isPolling])

  useEffect(() => {
    if (krsItems.length !== previousKrsCount.current && !isPolling) {
      previousKrsCount.current = krsItems.length
    }
  }, [krsItems.length, isPolling])

  return {
    isPolling,
    refreshNow: async () => {
      await fetchSubjects()
    }
  }
}
