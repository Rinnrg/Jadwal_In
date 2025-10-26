import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { ScheduleEvent } from "@/data/schema"
import { arr, generateId } from "@/lib/utils"
import { isOverlap, nowUTC } from "@/lib/time"

interface ScheduleState {
  events: ScheduleEvent[]
  addEvent: (event: Omit<ScheduleEvent, "id">) => void
  updateEvent: (id: string, updates: Partial<ScheduleEvent>) => void
  deleteEvent: (id: string) => void
  getEventsByUser: (userId: string) => ScheduleEvent[]
  getEventsByDay: (userId: string, dayOfWeek: number) => ScheduleEvent[]
  getConflicts: (
    userId: string,
    dayOfWeek: number,
    startUTC: number,
    endUTC: number,
    excludeId?: string,
  ) => ScheduleEvent[]
  getNextUpcoming: (userId: string) => ScheduleEvent | null
  duplicateEvent: (id: string, newDay: number) => void
  clearUserSchedule: (userId: string) => void
  rescheduleEvent: (id: string, newDay: number, newStartUTC: number, newEndUTC: number) => void
  hasSubjectScheduled: (userId: string, subjectId: string) => boolean
}

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set, get) => ({
      events: [],
      addEvent: (event) => {
        const newEvent: ScheduleEvent = {
          ...event,
          id: generateId(),
        }
        console.log('Adding event to schedule store:', newEvent)
        set((state) => {
          const updated = [...state.events, newEvent]
          console.log('Total events after add:', updated.length)
          
          // Trigger notification for the user
          try {
            ;(async () => {
              const { useNotificationStore } = await import('./notification.store')
              const { triggerNotification } = useNotificationStore.getState()
              const message = event.title 
                ? `Jadwal "${event.title}" telah ditambahkan` 
                : 'Jadwal baru telah ditambahkan'
              triggerNotification('jadwal', event.userId, message, 1)
              console.log('[Schedule Store] Notification triggered for user:', event.userId)
            })()
          } catch (error) {
            console.error('[Schedule Store] Failed to trigger notification:', error)
          }
          
          return { events: updated }
        })
      },
      updateEvent: (id, updates) => {
        set((state) => ({
          events: state.events.map((event) => (event.id === id ? { ...event, ...updates } : event)),
        }))
      },
      deleteEvent: (id) => {
        set((state) => ({
          events: state.events.filter((event) => event.id !== id),
        }))
      },
      getEventsByUser: (userId) => {
        const events = get().events.filter((event) => event.userId === userId)
        console.log(`Getting events for user ${userId}:`, events.length, 'events found')
        if (events.length > 0) {
          console.log('First event:', events[0])
        }
        return events
      },
      getEventsByDay: (userId, dayOfWeek) => {
        return get()
          .events.filter((event) => event.userId === userId && event.dayOfWeek === dayOfWeek)
          .sort((a, b) => a.startUTC - b.startUTC)
      },
      getConflicts: (userId, dayOfWeek, startUTC, endUTC, excludeId) => {
        return get().events.filter(
          (event) =>
            event.userId === userId &&
            event.dayOfWeek === dayOfWeek &&
            event.id !== excludeId &&
            isOverlap(event.startUTC, event.endUTC, startUTC, endUTC),
        )
      },
      getNextUpcoming: (userId) => {
        const now = nowUTC()
        const currentDay = new Date().getDay()
        const currentTime = now % (24 * 60 * 60 * 1000)

        const userEvents = get().getEventsByUser(userId)

        // Find next event today or in upcoming days
        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
          const targetDay = (currentDay + dayOffset) % 7
          const dayEvents = userEvents
            .filter((event) => event.dayOfWeek === targetDay)
            .sort((a, b) => a.startUTC - b.startUTC)

          for (const event of dayEvents) {
            if (dayOffset === 0 && event.startUTC <= currentTime) continue
            return event
          }
        }

        return null
      },
      duplicateEvent: (id, newDay) => {
        const event = get().events.find((e) => e.id === id)
        if (event) {
          const duplicated: ScheduleEvent = {
            ...event,
            id: generateId(),
            dayOfWeek: newDay,
          }
          set((state) => ({
            events: [...state.events, duplicated],
          }))
        }
      },
      clearUserSchedule: (userId) => {
        set((state) => ({
          events: state.events.filter((event) => event.userId !== userId),
        }))
      },
      rescheduleEvent: (id, newDay, newStartUTC, newEndUTC) => {
        set((state) => ({
          events: state.events.map((event) =>
            event.id === id
              ? { ...event, dayOfWeek: newDay, startUTC: newStartUTC, endUTC: newEndUTC }
              : event
          ),
        }))
      },
      hasSubjectScheduled: (userId, subjectId) => {
        return get().events.some(
          (event) => event.userId === userId && event.subjectId === subjectId
        )
      },
    }),
    {
      name: "jadwalin:schedule:v2",
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any, version) => {
        if (version === 0 || version === 1) {
          return { events: arr(persistedState?.events) }
        }
        return persistedState
      },
      onRehydrateStorage: () => {
        console.log('Schedule store: Starting rehydration from localStorage')
        return (state, error) => {
          if (error) {
            console.error('Schedule store: Rehydration failed', error)
          } else {
            console.log('Schedule store: Rehydration complete. Events count:', state?.events?.length || 0)
            if (state?.events && state.events.length > 0) {
              console.log('Schedule store: First event:', state.events[0])
            }
          }
        }
      },
    },
  ),
)

