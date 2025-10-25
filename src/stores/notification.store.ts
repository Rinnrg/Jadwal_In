import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export interface NotificationBadge {
  id: string
  type: "krs" | "jadwal" | "asynchronous" | "khs" | "reminder"
  userId: string
  count: number
  lastUpdated: number
  isRead: boolean
  lastNotifiedCount?: number // Track last notified count
  hasEverNotified?: boolean // Track if we've ever shown a notification
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
  
  // Check if should show notification (for real-time updates)
  shouldShowNotification: (type: NotificationBadge["type"], userId: string) => boolean
  
  // Mark notification as shown (track last notified count)
  markNotificationShown: (type: NotificationBadge["type"], userId: string, count: number) => void
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
          
          console.log(`[NotificationStore] updateBadge called - Type: ${type}, User: ${userId}, Count: ${count}`)
          
          if (existingIndex >= 0) {
            const newBadges = [...state.badges]
            const existingBadge = newBadges[existingIndex]
            
            console.log(`[NotificationStore] Existing badge - Current count: ${existingBadge.count}, New count: ${count}`)
            
            // Mark as unread only if count increased from previous count
            const isRead = count === 0 ? true : (count > existingBadge.count ? false : existingBadge.isRead)
            
            newBadges[existingIndex] = {
              ...newBadges[existingIndex],
              count,
              lastUpdated: Date.now(),
              isRead,
            }
            
            console.log(`[NotificationStore] Updated badge - isRead: ${isRead}, lastNotifiedCount: ${newBadges[existingIndex].lastNotifiedCount}`)
            
            return { badges: newBadges }
          } else {
            console.log(`[NotificationStore] Creating new badge - Count: ${count}`)
            
            return {
              badges: [
                ...state.badges,
                {
                  id: `${type}-${userId}-${Date.now()}`,
                  type,
                  userId,
                  count,
                  lastUpdated: Date.now(),
                  isRead: count === 0, // Only read if count is 0
                  lastNotifiedCount: 0,
                  hasEverNotified: false,
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
        // Return count regardless of isRead status - badge should always show if count > 0
        return badge ? badge.count : 0
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
      
      // Check if should show notification for real-time updates
      shouldShowNotification: (type, userId) => {
        const badge = get().badges.find(
          (b) => b.type === type && b.userId === userId
        )
        
        if (!badge) return false
        
        // If never notified before and count > 0, don't show (initial load)
        if (!badge.hasEverNotified && badge.count > 0) {
          return false
        }
        
        // If count increased from last notified count, show notification
        const lastNotified = badge.lastNotifiedCount ?? 0
        return badge.count > lastNotified
      },
      
      // Mark notification as shown (update lastNotifiedCount)
      markNotificationShown: (type, userId, count) => {
        set((state) => ({
          badges: state.badges.map((badge) =>
            badge.type === type && badge.userId === userId
              ? {
                  ...badge,
                  lastNotifiedCount: count,
                  hasEverNotified: true,
                }
              : badge
          ),
        }))
      },
    }),
    {
      name: "jadwalin:notifications:v1",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
