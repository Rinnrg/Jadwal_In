import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { Reminder } from "@/data/schema"
import { arr, generateId } from "@/lib/utils"
import { nowUTC } from "@/lib/time"

interface RemindersState {
  reminders: Reminder[]
  isLoading: boolean
  fetchReminders: (userId: string) => Promise<void>
  addReminder: (reminder: Omit<Reminder, "id">) => Promise<void>
  updateReminder: (id: string, updates: Partial<Reminder>) => Promise<void>
  deleteReminder: (id: string, userId: string) => Promise<void>
  toggleReminder: (id: string, userId: string) => Promise<void>
  getRemindersByUser: (userId: string) => Reminder[]
  getActiveReminders: (userId: string) => Reminder[]
  getUpcomingReminders: (userId: string, hours?: number) => Reminder[]
  getOverdueReminders: (userId: string) => Reminder[]
  clearUserReminders: (userId: string) => Promise<void>
}

export const useRemindersStore = create<RemindersState>()(
  persist(
    (set, get) => ({
      reminders: [],
      isLoading: false,
      
      fetchReminders: async (userId: string) => {
        set({ isLoading: true })
        try {
          const response = await fetch(`/api/reminders?userId=${userId}`)
          if (response.ok) {
            const reminders = await response.json()
            set({ reminders })
          }
        } catch (error) {
          console.error('Fetch reminders error:', error)
        } finally {
          set({ isLoading: false })
        }
      },
      
      addReminder: async (reminder) => {
        try {
          const response = await fetch('/api/reminders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reminder),
          })
          
          if (response.ok) {
            const data = await response.json()
            set((state) => ({
              reminders: [...state.reminders, data.reminder],
            }))
          } else {
            throw new Error('Failed to add reminder')
          }
        } catch (error) {
          console.error('Add reminder error:', error)
          throw error
        }
      },
      
      updateReminder: async (id, updates) => {
        const reminder = get().reminders.find(r => r.id === id)
        if (!reminder) return
        
        try {
          const response = await fetch('/api/reminders', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              id, 
              userId: reminder.userId,
              ...updates 
            }),
          })
          
          if (response.ok) {
            const data = await response.json()
            set((state) => ({
              reminders: state.reminders.map((r) => 
                r.id === id ? data.reminder : r
              ),
            }))
          } else {
            throw new Error('Failed to update reminder')
          }
        } catch (error) {
          console.error('Update reminder error:', error)
          throw error
        }
      },
      
      deleteReminder: async (id: string, userId: string) => {
        try {
          const response = await fetch(`/api/reminders?id=${id}&userId=${userId}`, {
            method: 'DELETE',
          })
          
          if (response.ok) {
            set((state) => ({
              reminders: state.reminders.filter((r) => r.id !== id),
            }))
          } else {
            throw new Error('Failed to delete reminder')
          }
        } catch (error) {
          console.error('Delete reminder error:', error)
          throw error
        }
      },
      
      toggleReminder: async (id: string, userId: string) => {
        const reminder = get().reminders.find(r => r.id === id)
        if (!reminder) return
        
        try {
          const response = await fetch('/api/reminders', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              id, 
              userId,
              isActive: !reminder.isActive 
            }),
          })
          
          if (response.ok) {
            const data = await response.json()
            set((state) => ({
              reminders: state.reminders.map((r) =>
                r.id === id ? data.reminder : r
              ),
            }))
          }
        } catch (error) {
          console.error('Toggle reminder error:', error)
        }
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
      clearUserReminders: async (userId: string) => {
        try {
          // Get all reminders for user
          const userReminders = get().reminders.filter(r => r.userId === userId)
          
          // Delete each reminder from database
          await Promise.all(
            userReminders.map(reminder =>
              fetch(`/api/reminders?id=${reminder.id}&userId=${userId}`, {
                method: 'DELETE',
              })
            )
          )
          
          // Update local state
          set((state) => ({
            reminders: state.reminders.filter((r) => r.userId !== userId),
          }))
        } catch (error) {
          console.error('Clear reminders error:', error)
          throw error
        }
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
