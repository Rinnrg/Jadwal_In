"use client"

import { useNotificationManager } from "@/hooks/useNotificationManager"

/**
 * Component that manages notifications in the background
 * Place this at the app layout level to enable automatic notification tracking
 */
export function NotificationManager() {
  useNotificationManager()
  return null
}
