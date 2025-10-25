"use client"

import { useEffect, useRef } from "react"
import { useNotificationStore } from "@/stores/notification.store"
import { useSessionStore } from "@/stores/session.store"
import { useSubjectsStore } from "@/stores/subjects.store"
import { useOfferingsStore } from "@/stores/offerings.store"
import { useKrsStore } from "@/stores/krs.store"
import { useScheduleStore } from "@/stores/schedule.store"
import { useRemindersStore } from "@/stores/reminders.store"
import { useGradesStore } from "@/stores/grades.store"
import { useCourseworkStore } from "@/stores/coursework.store"

/**
 * Hook to sync data changes with notification badges in real-time
 * This integrates with useRealtimeSync to show notifications when data updates
 */
export function useNotificationSync() {
  const { session } = useSessionStore()
  const { updateBadge } = useNotificationStore()
  
  const { subjects } = useSubjectsStore()
  const { offerings } = useOfferingsStore()
  const { krsItems } = useKrsStore()
  const { events } = useScheduleStore()
  const { reminders } = useRemindersStore()
  const { grades } = useGradesStore()
  const { assignments, materials } = useCourseworkStore()

  // Track previous counts
  const prevCounts = useRef({
    subjects: 0,
    offerings: 0,
    krs: 0,
    events: 0,
    reminders: 0,
    grades: 0,
    assignments: 0,
    materials: 0,
  })

  const isInitialized = useRef(false)

  // Initialize counts on first render
  useEffect(() => {
    if (!session?.id || isInitialized.current) return

    prevCounts.current = {
      subjects: subjects.length,
      offerings: offerings.length,
      krs: krsItems.length,
      events: events.length,
      reminders: reminders.length,
      grades: grades.length,
      assignments: assignments.length,
      materials: materials.length,
    }

    isInitialized.current = true
  }, [session?.id, subjects.length, offerings.length, krsItems.length, events.length, reminders.length, grades.length, assignments.length, materials.length])

  // Watch for KRS changes
  useEffect(() => {
    if (!session?.id || !isInitialized.current) return

    const userKrsItems = krsItems.filter(item => item.userId === session.id)
    const currentCount = userKrsItems.length
    const prevCount = prevCounts.current.krs

    if (currentCount !== prevCount) {
      updateBadge("krs", session.id, currentCount)
      prevCounts.current.krs = currentCount
    }
  }, [krsItems, session?.id, updateBadge])

  // Watch for schedule changes
  useEffect(() => {
    if (!session?.id || !isInitialized.current) return

    const userEvents = events.filter(event => event.userId === session.id)
    const currentCount = userEvents.length
    const prevCount = prevCounts.current.events

    if (currentCount !== prevCount) {
      // For jadwal, show badge if there are events
      updateBadge("jadwal", session.id, currentCount > 0 ? 1 : 0)
      prevCounts.current.events = currentCount
    }
  }, [events, session?.id, updateBadge])

  // Watch for grades changes
  useEffect(() => {
    if (!session?.id || !isInitialized.current) return

    const userGrades = grades.filter(grade => grade.userId === session.id && grade.nilaiHuruf)
    const currentCount = userGrades.length
    const prevCount = prevCounts.current.grades

    if (currentCount !== prevCount) {
      updateBadge("khs", session.id, currentCount)
      prevCounts.current.grades = currentCount
    }
  }, [grades, session?.id, updateBadge])

  // Watch for asynchronous content changes (assignments + materials)
  useEffect(() => {
    if (!session?.id || !isInitialized.current) return

    // For students: count assignments from their enrolled subjects
    // For lecturers: count all their assignments
    const now = Date.now()
    const upcomingAssignments = assignments.filter(a => 
      a.dueUTC && a.dueUTC > now
    )
    
    const currentCount = upcomingAssignments.length + materials.length
    const prevCount = prevCounts.current.assignments + prevCounts.current.materials

    if (currentCount !== prevCount) {
      updateBadge("asynchronous", session.id, currentCount)
      prevCounts.current.assignments = upcomingAssignments.length
      prevCounts.current.materials = materials.length
    }
  }, [assignments, materials, session?.id, updateBadge])

  // Watch for upcoming reminders (30 minutes window)
  useEffect(() => {
    if (!session?.id || !isInitialized.current) return

    const now = Date.now()
    const thirtyMinutesLater = now + 30 * 60 * 1000
    
    const upcomingReminders = reminders.filter(reminder => 
      reminder.userId === session.id &&
      !reminder.isCompleted &&
      reminder.dueUTC > now &&
      reminder.dueUTC <= thirtyMinutesLater
    )

    const currentCount = upcomingReminders.length
    const prevCount = prevCounts.current.reminders

    if (currentCount !== prevCount) {
      updateBadge("reminder", session.id, currentCount)
      prevCounts.current.reminders = currentCount
    }
  }, [reminders, session?.id, updateBadge])
}
