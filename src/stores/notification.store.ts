import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export interface NotificationBadge {
  id: string
  type: "krs" | "jadwal" | "asynchronous" | "khs" | "reminder"
  userId: string
  count: number
  lastUpdated: number
  isRead: boolean
}

interface NotificationState {
  badges: NotificationBadge[]
  
  // Add or update badge
  updateBadge: (type: NotificationBadge["type"], userId: string, count: number) => void
  
  // Increment badge count
  incrementBadge: (type: NotificationBadge["type"], userId: string) => void
  
  // Clear specific badge
  clearBadge: (type: NotificationBadge["type"], userId: string) => void
  
  // Mark as read
  markAsRead: (type: NotificationBadge["type"], userId: string) => void
  
  // Get badge count for specific type
  getBadgeCount: (type: NotificationBadge["type"], userId: string) => number
  
  // Check if has unread
  hasUnread: (type: NotificationBadge["type"], userId: string) => boolean
  
  // Get all unread badges for user
  getUnreadBadges: (userId: string) => NotificationBadge[]
  
  // Clear all badges for user
  clearAllBadges: (userId: string) => void
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      badges: [],
      
      updateBadge: (type, userId, count) => {
        set((state) => {
          const existingIndex = state.badges.findIndex(
            (b) => b.type === type && b.userId === userId
          )
          
          if (existingIndex >= 0) {
            const newBadges = [...state.badges]
            newBadges[existingIndex] = {
              ...newBadges[existingIndex],
              count,
              lastUpdated: Date.now(),
              isRead: count === 0,
            }
            return { badges: newBadges }
          } else {
            return {
              badges: [
                ...state.badges,
                {
                  id: `${type}-${userId}-${Date.now()}`,
                  type,
                  userId,
                  count,
                  lastUpdated: Date.now(),
                  isRead: count === 0,
                },
              ],
            }
          }
        })
      },
      
      incrementBadge: (type, userId) => {
        const current = get().getBadgeCount(type, userId)
        get().updateBadge(type, userId, current + 1)
      },
      
      clearBadge: (type, userId) => {
        get().updateBadge(type, userId, 0)
      },
      
      markAsRead: (type, userId) => {
        set((state) => ({
          badges: state.badges.map((badge) =>
            badge.type === type && badge.userId === userId
              ? { ...badge, isRead: true }
              : badge
          ),
        }))
      },
      
      getBadgeCount: (type, userId) => {
        const badge = get().badges.find(
          (b) => b.type === type && b.userId === userId
        )
        return badge?.count || 0
      },
      
      hasUnread: (type, userId) => {
        const badge = get().badges.find(
          (b) => b.type === type && b.userId === userId
        )
        return badge ? !badge.isRead && badge.count > 0 : false
      },
      
      getUnreadBadges: (userId) => {
        return get().badges.filter(
          (badge) => badge.userId === userId && !badge.isRead && badge.count > 0
        )
      },
      
      clearAllBadges: (userId) => {
        set((state) => ({
          badges: state.badges.filter((badge) => badge.userId !== userId),
        }))
      },
    }),
    {
      name: "jadwalin:notifications:v1",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
