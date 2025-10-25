import { useEffect, useRef, useState } from "react"
import { useSessionStore } from "@/stores/session.store"
import { useSubjectsStore } from "@/stores/subjects.store"
import { useKrsStore } from "@/stores/krs.store"
import { useNotificationStore } from "@/stores/notification.store"

interface RealtimeSyncOptions {
  enabled?: boolean
  pollingInterval?: number // in milliseconds, default 5000 (5 seconds)
  onSubjectAdded?: (subject: any) => void
  onKrsUpdated?: () => void
}

export function useRealtimeSync(options: RealtimeSyncOptions = {}) {
  const {
    enabled = true,
    pollingInterval = 5000,
    onSubjectAdded,
    onKrsUpdated,
  } = options

  const { session } = useSessionStore()
  const { subjects, fetchSubjects } = useSubjectsStore()
  const { krsItems } = useKrsStore()
  const { updateBadge } = useNotificationStore()

  const [isPolling, setIsPolling] = useState(false)
  const previousSubjectsCount = useRef(subjects.length)
  const previousKrsCount = useRef(krsItems.length)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isInitialMount = useRef(true)

  useEffect(() => {
    if (!enabled || !session) {
      return
    }

    const pollData = async () => {
      if (isPolling) return // Prevent overlapping polls
      
      setIsPolling(true)
      try {
        // Fetch latest subjects data
        const response = await fetch('/api/subjects')
        if (response.ok) {
          const latestSubjects = await response.json()
          
          // On initial mount, just update the count silently
          if (isInitialMount.current) {
            previousSubjectsCount.current = latestSubjects.length
            useSubjectsStore.setState({ subjects: latestSubjects })
            isInitialMount.current = false
            return
          }
          
          // Check if new subjects were added
          if (latestSubjects.length > previousSubjectsCount.current) {
            const newSubjectsCount = latestSubjects.length - previousSubjectsCount.current
            const newSubjects = latestSubjects.slice(-newSubjectsCount)
            
            // Update the store silently first
            useSubjectsStore.setState({ subjects: latestSubjects })
            
            // Notify about new subjects
            newSubjects.forEach((subject: any) => {
              // Only update badge if it's relevant to the user
              const isRelevant = 
                session.role === "mahasiswa" || // All students can see new subjects
                (session.role === "dosen" && subject.pengampuIds?.includes(session.id)) || // Dosen if they teach it
                session.role === "kaprodi" // Kaprodi can see all
              
              if (isRelevant) {
                // Update badge count instead of showing toast
                // The FloatingNotifications component will handle showing the notification
                if (session.role === "mahasiswa") {
                  updateBadge("krs", session.id, previousSubjectsCount.current + 1)
                }
                
                // Call optional callback
                onSubjectAdded?.(subject)
              }
            })
            
            previousSubjectsCount.current = latestSubjects.length
          } else if (latestSubjects.length !== subjects.length) {
            // If count changed (deletion), update silently
            useSubjectsStore.setState({ subjects: latestSubjects })
            previousSubjectsCount.current = latestSubjects.length
          } else {
            // Check for updates to existing subjects
            const hasUpdates = latestSubjects.some((newSubject: any) => {
              const oldSubject = subjects.find((s: any) => s.id === newSubject.id)
              if (!oldSubject) return false
              
              // Simple deep comparison
              return JSON.stringify(oldSubject) !== JSON.stringify(newSubject)
            })
            
            if (hasUpdates) {
              useSubjectsStore.setState({ subjects: latestSubjects })
            }
          }
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
