"use client"

import { useEffect, useCallback, useRef } from "react"
import { useNotificationStore } from "@/stores/notification.store"
import { useSessionStore } from "@/stores/session.store"
import { useRemindersStore } from "@/stores/reminders.store"
import { useKrsStore } from "@/stores/krs.store"
import { useGradesStore } from "@/stores/grades.store"
import { useScheduleStore } from "@/stores/schedule.store"
import { useCourseworkStore } from "@/stores/coursework.store"
import { nowUTC } from "@/lib/time"

/**
 * Hook to automatically manage notification badges based on app state
 * This should be used at the app layout level
 */
export function useNotificationManager() {
  const { session } = useSessionStore()
  const { updateBadge, clearBadge } = useNotificationStore()
  const { getActiveReminders } = useRemindersStore()
  const { getKrsByUser } = useKrsStore()
  const { getGradesByUser } = useGradesStore()
  const { getEventsByUser } = useScheduleStore()
  const { assignments, materials } = useCourseworkStore()

  const userId = session?.id
  
  // Track if this is the first load
  const isInitialLoad = useRef(true)
  
  // Track previous counts to detect changes
  const previousCounts = useRef<Record<string, number>>({
    reminder: 0,
    krs: 0,
    khs: 0,
    asynchronous: 0,
    jadwal: 0,
  })

  // Check for upcoming reminders (30 minutes before)
  const checkReminders = useCallback(() => {
    if (!userId) return

    const now = nowUTC()
    const thirtyMinutesLater = now + 30 * 60 * 1000
    
    const activeReminders = getActiveReminders(userId)
    const upcomingReminders = activeReminders.filter(
      (reminder) => reminder.dueUTC > now && reminder.dueUTC <= thirtyMinutesLater
    )
    
    const count = upcomingReminders.length
    const prevCount = previousCounts.current.reminder
    
    // On initial load, just set the count silently - DO NOT update badge yet
    if (isInitialLoad.current) {
      previousCounts.current.reminder = count
      // Don't call updateBadge during initial load to prevent triggering notifications
      return
    }
    
    // Only update if count increased (new reminders)
    // Don't trigger notification if count decreased (reminders passed)
    if (count !== prevCount) {
      updateBadge("reminder", userId, count)
      previousCounts.current.reminder = count
    }
  }, [userId, getActiveReminders, updateBadge])

  // Check for new KRS offerings (pending enrollments)
  const checkKRS = useCallback(() => {
    if (!userId) return

    try {
      const krsItems = getKrsByUser(userId)
      const count = krsItems.length
      const prevCount = previousCounts.current.krs
      
      // On initial load, just set the count silently - DO NOT update badge yet
      if (isInitialLoad.current) {
        previousCounts.current.krs = count
        // Don't call updateBadge during initial load to prevent triggering notifications
        return
      }
      
      // Only update if count actually changed
      if (count !== prevCount) {
        updateBadge("krs", userId, count)
        previousCounts.current.krs = count
      }
    } catch (error) {
      // If there's an error, clear the badge
      if (!isInitialLoad.current) {
        clearBadge("krs", userId)
      }
      previousCounts.current.krs = 0
    }
  }, [userId, getKrsByUser, updateBadge, clearBadge])

  // Check for new grades in KHS
  const checkKHS = useCallback(() => {
    if (!userId) return

    try {
      const grades = getGradesByUser(userId)
      // Count grades as "new" if they exist
      // In a real app, you'd track when the user last viewed their grades
      const count = grades.filter((grade: any) => grade.nilaiHuruf).length
      const prevCount = previousCounts.current.khs
      
      // On initial load, just set the count silently - DO NOT update badge yet
      if (isInitialLoad.current) {
        previousCounts.current.khs = count
        // Don't call updateBadge during initial load to prevent triggering notifications
        return
      }
      
      // Only update if count increased (new grades added)
      if (count !== prevCount) {
        updateBadge("khs", userId, count)
        previousCounts.current.khs = count
      }
    } catch (error) {
      if (!isInitialLoad.current) {
        clearBadge("khs", userId)
      }
      previousCounts.current.khs = 0
    }
  }, [userId, getGradesByUser, updateBadge, clearBadge])

  // Check for new assignments and materials (asynchronous learning)
  const checkAsynchronous = useCallback(() => {
    if (!userId) return

    try {
      // Count new assignments and materials
      const userAssignments = assignments.filter(a => {
        // Check if this assignment is for the user's enrolled courses
        return a.dueUTC && a.dueUTC > nowUTC() // Upcoming assignments
      })
      
      const userMaterials = materials.filter(m => {
        // New materials could be tracked by a timestamp
        return true // For now, count all materials
      })
      
      const count = userAssignments.length + userMaterials.length
      const prevCount = previousCounts.current.asynchronous
      
      // On initial load, just set the count silently - DO NOT update badge yet
      if (isInitialLoad.current) {
        previousCounts.current.asynchronous = count
        // Don't call updateBadge during initial load to prevent triggering notifications
        return
      }
      
      // Only update if count changed
      if (count !== prevCount) {
        updateBadge("asynchronous", userId, count)
        previousCounts.current.asynchronous = count
      }
    } catch (error) {
      if (!isInitialLoad.current) {
        clearBadge("asynchronous", userId)
      }
      previousCounts.current.asynchronous = 0
    }
  }, [userId, assignments, materials, updateBadge, clearBadge])

  // Check for schedule updates (synced schedules)
  const checkSchedule = useCallback(() => {
    if (!userId) return

    try {
      const schedule = getEventsByUser(userId)
      const count = schedule.length
      const prevCount = previousCounts.current.jadwal
      
      // On initial load, just set the count silently - DO NOT update badge yet
      if (isInitialLoad.current) {
        previousCounts.current.jadwal = count
        // Don't call updateBadge during initial load to prevent triggering notifications
        return
      }
      
      // Only update if schedule count changed
      if (count !== prevCount) {
        updateBadge("jadwal", userId, count > 0 ? 1 : 0)
        previousCounts.current.jadwal = count
      }
    } catch (error) {
      if (!isInitialLoad.current) {
        clearBadge("jadwal", userId)
      }
      previousCounts.current.jadwal = 0
    }
  }, [userId, getEventsByUser, updateBadge, clearBadge])

  // Initial check and set up intervals
  useEffect(() => {
    if (!userId) return

    // Initial checks (silently update counts - NO badge updates)
    checkReminders()
    checkKRS()
    checkKHS()
    checkAsynchronous()
    checkSchedule()

    // Mark initial load as complete after all checks
    const timer = setTimeout(() => {
      isInitialLoad.current = false
      
      // NOW update badges with current counts (after grace period)
      // This ensures badges show in UI but don't trigger notifications
      const krsItems = getKrsByUser(userId)
      updateBadge("krs", userId, krsItems.length)
      
      const now = nowUTC()
      const thirtyMinutesLater = now + 30 * 60 * 1000
      const activeReminders = getActiveReminders(userId)
      const upcomingReminders = activeReminders.filter(
        (reminder) => reminder.dueUTC > now && reminder.dueUTC <= thirtyMinutesLater
      )
      updateBadge("reminder", userId, upcomingReminders.length)
      
      const grades = getGradesByUser(userId)
      const gradeCount = grades.filter((grade: any) => grade.nilaiHuruf).length
      updateBadge("khs", userId, gradeCount)
      
      const schedule = getEventsByUser(userId)
      updateBadge("jadwal", userId, schedule.length > 0 ? 1 : 0)
      
      const userAssignments = assignments.filter(a => a.dueUTC && a.dueUTC > nowUTC())
      const asyncCount = userAssignments.length + materials.length
      updateBadge("asynchronous", userId, asyncCount)
      
      console.log('[NotificationManager] Initial load complete - badges updated silently')
    }, 2000) // Wait 2 seconds before allowing notifications

    // Check reminders every minute
    const reminderInterval = setInterval(checkReminders, 60 * 1000)

    // Check other notifications every 5 minutes
    const generalInterval = setInterval(() => {
      checkKRS()
      checkKHS()
      checkAsynchronous()
      checkSchedule()
    }, 5 * 60 * 1000)

    return () => {
      clearTimeout(timer)
      clearInterval(reminderInterval)
      clearInterval(generalInterval)
    }
  }, [userId, checkReminders, checkKRS, checkKHS, checkAsynchronous, checkSchedule, getKrsByUser, getActiveReminders, getGradesByUser, getEventsByUser, assignments, materials, updateBadge])

  return {
    checkReminders,
    checkKRS,
    checkKHS,
    checkAsynchronous,
    checkSchedule,
  }
}
