import { useEffect, useRef, useState, createElement } from "react"
import { useSessionStore } from "@/stores/session.store"
import { useSubjectsStore } from "@/stores/subjects.store"
import { useKrsStore } from "@/stores/krs.store"
import { useNotificationStore } from "@/stores/notification.store"
import { useGradesStore } from "@/stores/grades.store"
import { useCourseworkStore } from "@/stores/coursework.store"
import { useRemindersStore } from "@/stores/reminders.store"
import { useScheduleStore } from "@/stores/schedule.store"
import { toast } from "sonner"
import { BookOpen, FileText, GraduationCap, Bell, Calendar } from "lucide-react"
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
    pollingInterval = 5000,
    onSubjectAdded,
    onKrsUpdated,
  } = options

  const { session } = useSessionStore()
  const { subjects, fetchSubjects } = useSubjectsStore()
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
      // Prevent polling too frequently (minimum 3 seconds between polls)
      if (now - lastPollTime.current < 3000) {
        return
      }
      lastPollTime.current = now
      
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
            // Wait a bit before allowing notifications (increased to 8 seconds)
            setTimeout(() => {
              hasShownInitialNotification.current = true
            }, 8000) // 8 second grace period to prevent spam
            return
          }
          
          // Check if new subjects were added
          if (latestSubjects.length > previousSubjectsCount.current) {
            const newSubjectsCount = latestSubjects.length - previousSubjectsCount.current
            const newSubjects = latestSubjects.slice(-newSubjectsCount)
            
            // Update the store silently first
            useSubjectsStore.setState({ subjects: latestSubjects })
            
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
              
              // If KRS count increased, show notification
              if (currentKrsLength > previousKrsLength && !isInitialMount.current && hasShownInitialNotification.current) {
                const newKrsCount = currentKrsLength - previousKrsLength
                
                // Update badge
                updateBadge("krs", session.id, currentKrsLength)
                
                // Show toast notification immediately
                toast("Mata Kuliah Baru Tersedia", {
                  description: newKrsCount === 1 
                    ? "1 mata kuliah baru telah ditambahkan ke KRS"
                    : `${newKrsCount} mata kuliah baru telah ditambahkan ke KRS`,
                  icon: createElement(BookOpen, { className: "h-5 w-5" }),
                  duration: 6000,
                  position: "top-right",
                  action: {
                    label: "Lihat KRS",
                    onClick: () => {
                      if (typeof window !== 'undefined') {
                        window.location.href = '/krs'
                      }
                    },
                  },
                })
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
                const newGradesCount = currentGradesWithValue - previousGradesLength
                
                updateBadge("khs", session.id, currentGradesWithValue)
                
                toast("Nilai Baru Tersedia", {
                  description: newGradesCount === 1 
                    ? "1 nilai baru tersedia di KHS"
                    : `${newGradesCount} nilai baru tersedia di KHS`,
                  icon: createElement(GraduationCap, { className: "h-5 w-5" }),
                  duration: 6000,
                  position: "top-right",
                  action: {
                    label: "Cek Nilai",
                    onClick: () => {
                      if (typeof window !== 'undefined') {
                        window.location.href = '/khs'
                      }
                    },
                  },
                })
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
                const newAsyncCount = totalAsyncCount - previousAsyncCount
                
                updateBadge("asynchronous", session.id, totalAsyncCount)
                
                toast("Konten Pembelajaran Baru", {
                  description: newAsyncCount === 1 
                    ? "1 materi atau tugas baru telah ditambahkan"
                    : `${newAsyncCount} materi/tugas baru telah ditambahkan`,
                  icon: createElement(FileText, { className: "h-5 w-5" }),
                  duration: 6000,
                  position: "top-right",
                  action: {
                    label: "Buka Asynchronous",
                    onClick: () => {
                      if (typeof window !== 'undefined') {
                        window.location.href = '/asynchronous'
                      }
                    },
                  },
                })
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
                const newRemindersCount = currentRemindersCount - previousRemindersLength
                
                updateBadge("reminder", session.id, currentRemindersCount)
                
                toast("Pengingat", {
                  description: newRemindersCount === 1
                    ? "1 jadwal dalam 30 menit ke depan"
                    : `${newRemindersCount} jadwal dalam 30 menit ke depan`,
                  icon: createElement(Bell, { className: "h-5 w-5" }),
                  duration: 6000,
                  position: "top-right",
                  action: {
                    label: "Lihat Pengingat",
                    onClick: () => {
                      if (typeof window !== 'undefined') {
                        window.location.href = '/reminders'
                      }
                    },
                  },
                })
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
                updateBadge("jadwal", session.id, currentScheduleCount > 0 ? 1 : 0)
                
                if (currentScheduleCount > previousScheduleLength) {
                  toast("Jadwal Diperbarui", {
                    description: "Jadwal kuliah telah disinkronisasi",
                    icon: createElement(Calendar, { className: "h-5 w-5" }),
                    duration: 6000,
                    position: "top-right",
                    action: {
                      label: "Lihat Jadwal",
                      onClick: () => {
                        if (typeof window !== 'undefined') {
                          window.location.href = '/jadwal'
                        }
                      },
                    },
                  })
                }
              }
              
              previousScheduleCount.current = currentScheduleCount
            }
            
            // Notify about new subjects
            newSubjects.forEach((subject: any) => {
              // Call optional callback
              onSubjectAdded?.(subject)
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
