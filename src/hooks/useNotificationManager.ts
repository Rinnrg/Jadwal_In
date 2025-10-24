"use client"

import { useEffect, useCallback } from "react"
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
  const { getUserEnrollments } = useKrsStore()
  const { getStudentGrades } = useGradesStore()
  const { getScheduleByUser } = useScheduleStore()
  const { assignments, materials } = useCourseworkStore()

  const userId = session?.id

  // Check for upcoming reminders (30 minutes before)
  const checkReminders = useCallback(() => {
    if (!userId) return

    const now = nowUTC()
    const thirtyMinutesLater = now + 30 * 60 * 1000
    
    const activeReminders = getActiveReminders(userId)
    const upcomingReminders = activeReminders.filter(
      (reminder) => reminder.dueUTC > now && reminder.dueUTC <= thirtyMinutesLater
    )
    
    updateBadge("reminder", userId, upcomingReminders.length)
  }, [userId, getActiveReminders, updateBadge])

  // Check for new KRS offerings (pending enrollments)
  const checkKRS = useCallback(() => {
    if (!userId) return

    try {
      const enrollments = getUserEnrollments(userId)
      // Count pending enrollments as new KRS items
      const pendingEnrollments = enrollments.filter(
        (enrollment) => enrollment.status === "pending"
      )
      
      updateBadge("krs", userId, pendingEnrollments.length)
    } catch (error) {
      // If there's an error, clear the badge
      clearBadge("krs", userId)
    }
  }, [userId, getUserEnrollments, updateBadge, clearBadge])

  // Check for new grades in KHS
  const checkKHS = useCallback(() => {
    if (!userId) return

    try {
      const grades = getStudentGrades(userId)
      // Count grades as "new" if they exist
      // In a real app, you'd track when the user last viewed their grades
      const newGradesCount = grades.filter(grade => grade.finalGrade).length
      
      updateBadge("khs", userId, newGradesCount)
    } catch (error) {
      clearBadge("khs", userId)
    }
  }, [userId, getStudentGrades, updateBadge, clearBadge])

  // Check for new assignments and materials (asynchronous learning)
  const checkAsynchronous = useCallback(() => {
    if (!userId) return

    try {
      // Count new assignments and materials
      const userAssignments = assignments.filter(a => {
        // Check if this assignment is for the user's enrolled courses
        return a.dueUTC > nowUTC() // Upcoming assignments
      })
      
      const userMaterials = materials.filter(m => {
        // New materials could be tracked by a timestamp
        return true // For now, count all materials
      })
      
      const totalNew = userAssignments.length + userMaterials.length
      updateBadge("asynchronous", userId, totalNew)
    } catch (error) {
      clearBadge("asynchronous", userId)
    }
  }, [userId, assignments, materials, updateBadge, clearBadge])

  // Check for schedule updates (synced schedules)
  const checkSchedule = useCallback(() => {
    if (!userId) return

    try {
      const schedule = getScheduleByUser(userId)
      // In a real scenario, you'd track recently synced schedules
      // For now, we'll just show a count if there are schedules
      updateBadge("jadwal", userId, schedule.length > 0 ? 1 : 0)
    } catch (error) {
      clearBadge("jadwal", userId)
    }
  }, [userId, getScheduleByUser, updateBadge, clearBadge])

  // Initial check and set up intervals
  useEffect(() => {
    if (!userId) return

    // Initial checks
    checkReminders()
    checkKRS()
    checkKHS()
    checkAsynchronous()
    checkSchedule()

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
      clearInterval(reminderInterval)
      clearInterval(generalInterval)
    }
  }, [userId, checkReminders, checkKRS, checkKHS, checkAsynchronous, checkSchedule])

  return {
    checkReminders,
    checkKRS,
    checkKHS,
    checkAsynchronous,
    checkSchedule,
  }
}
