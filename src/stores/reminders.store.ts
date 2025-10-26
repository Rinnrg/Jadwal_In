import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { Reminder } from "@/data/schema"
import { arr, generateId } from "@/lib/utils"
import { nowUTC } from "@/lib/time"

interface RemindersState {
  reminders: Reminder[]
  addReminder: (reminder: Omit<Reminder, "id">) => void
  updateReminder: (id: string, updates: Partial<Reminder>) => void
  deleteReminder: (id: string) => void
  toggleReminder: (id: string) => void
  getRemindersByUser: (userId: string) => Reminder[]
  getActiveReminders: (userId: string) => Reminder[]
  getUpcomingReminders: (userId: string, hours?: number) => Reminder[]
  getOverdueReminders: (userId: string) => Reminder[]
  clearUserReminders: (userId: string) => void
}

export const useRemindersStore = create<RemindersState>()(
  persist(
    (set, get) => ({
      reminders: [],
      addReminder: (reminder) => {
        const newReminder: Reminder = {
          ...reminder,
          id: generateId(),
        }
        set((state) => ({
          reminders: [...state.reminders, newReminder],
        }))
        
        // Trigger notification for the user if reminder is active and upcoming
        if (newReminder.isActive) {
          const now = nowUTC()
          const thirtyMinutesLater = now + 30 * 60 * 1000
          
          // Only notify if reminder is within next 30 minutes
          if (newReminder.dueUTC > now && newReminder.dueUTC <= thirtyMinutesLater) {
            try {
              ;(async () => {
                const { useNotificationStore } = await import('./notification.store')
                const { triggerNotification } = useNotificationStore.getState()
                
                const message = newReminder.title 
                  ? `Pengingat: "${newReminder.title}"` 
                  : 'Pengingat baru telah ditambahkan'
                
                triggerNotification('reminder', newReminder.userId, message, 1)
                console.log('[Reminders Store] Notification triggered for user:', newReminder.userId)
              })()
            } catch (error) {
              console.error('[Reminders Store] Failed to trigger notification:', error)
            }
          }
        }
      },
      updateReminder: (id, updates) => {
        set((state) => ({
          reminders: state.reminders.map((reminder) => (reminder.id === id ? { ...reminder, ...updates } : reminder)),
        }))
      },
      deleteReminder: (id) => {
        set((state) => ({
          reminders: state.reminders.filter((reminder) => reminder.id !== id),
        }))
      },
      toggleReminder: (id) => {
        set((state) => ({
          reminders: state.reminders.map((reminder) =>
            reminder.id === id ? { ...reminder, isActive: !reminder.isActive } : reminder,
          ),
        }))
      },
      getRemindersByUser: (userId) => {
        return get()
          .reminders.filter((reminder) => reminder.userId === userId)
          .sort((a, b) => a.dueUTC - b.dueUTC)
      },
      getActiveReminders: (userId) => {
        return get()
          .reminders.filter((reminder) => reminder.userId === userId && reminder.isActive)
          .sort((a, b) => a.dueUTC - b.dueUTC)
      },
      getUpcomingReminders: (userId, hours = 24) => {
        const now = nowUTC()
        const futureTime = now + hours * 60 * 60 * 1000
        return get()
          .reminders.filter(
            (reminder) =>
              reminder.userId === userId && reminder.isActive && reminder.dueUTC > now && reminder.dueUTC <= futureTime,
          )
          .sort((a, b) => a.dueUTC - b.dueUTC)
      },
      getOverdueReminders: (userId) => {
        const now = nowUTC()
        return get()
          .reminders.filter((reminder) => reminder.userId === userId && reminder.isActive && reminder.dueUTC < now)
          .sort((a, b) => b.dueUTC - a.dueUTC)
      },
      clearUserReminders: (userId) => {
        set((state) => ({
          reminders: state.reminders.filter((reminder) => reminder.userId !== userId),
        }))
      },
    }),
    {
      name: "jadwalin:reminders:v1",
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any, version) => {
        if (version === 0) {
          return { reminders: arr(persistedState?.reminders) }
        }
        return persistedState
      },
    },
  ),
)
