"use client"

import { useEffect, useCallback, useRef } from "react"
import { useNotificationStore } from "@/stores/notification.store"
import { useSessionStore } from "@/stores/session.store"

/**
 * Hook to manage notification badges
 * This hook NO LONGER auto-initializes badges on mount
 * Badges are only shown when actual data additions occur (event-based)
 * 
 * The notification system now works as follows:
 * 1. When kaprodi adds a subject/offering -> triggers notification
 * 2. When KRS is synced/refreshed -> triggers notification for affected students
 * 3. When dosen adds assignment/material -> triggers notification for enrolled students
 * 4. When schedule is synced -> triggers notification for the user
 * 5. When reminder is created (upcoming) -> triggers notification
 */
export function useNotificationManager() {
  const { session } = useSessionStore()
  const { clearAllBadges } = useNotificationStore()
  const userId = session?.id
  
  // Track if this is the first load
  const hasInitialized = useRef(false)

  // On mount, DO NOT initialize badges
  // Badges will only appear when actual events occur
  useEffect(() => {
    if (!userId || hasInitialized.current) return
    
    hasInitialized.current = true
    
    console.log('[NotificationManager] Initialized - using event-based notifications')
    console.log('[NotificationManager] Badges will only appear on actual data additions')
    
    // Optional: Clear all old badges on first mount for a fresh start
    // Uncomment the line below if you want to reset notifications on app load
    // clearAllBadges(userId)
    
  }, [userId])

  // No periodic checks needed - notifications are event-driven
  return {}
}
