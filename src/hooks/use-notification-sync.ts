"use client"

import { useEffect, useRef } from "react"
import { useNotificationStore } from "@/stores/notification.store"
import { useSessionStore } from "@/stores/session.store"

/**
 * Hook to sync data changes with notification badges in real-time
 * DISABLED: Now using event-based notifications triggered directly from stores
 * This hook is kept for backward compatibility but does nothing
 */
export function useNotificationSync() {
  const { session } = useSessionStore()
  
  // This hook is now disabled - notifications are triggered from stores
  // when actual data additions occur (addKrsItem, addAssignment, etc.)
  
  useEffect(() => {
    if (!session?.id) return
    
    console.log('[NotificationSync] Hook disabled - using event-based notifications from stores')
  }, [session?.id])
}
