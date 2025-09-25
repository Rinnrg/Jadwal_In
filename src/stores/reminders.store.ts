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
