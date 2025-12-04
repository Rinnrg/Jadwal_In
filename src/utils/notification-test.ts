/**
 * Notification Testing Utilities
 * 
 * Utility functions untuk testing sistem notifikasi badge
 */

import { useNotificationStore } from "@/stores/notification.store"

/**
 * Simulate KRS notification (kaprodi menambahkan mata kuliah)
 */
export function simulateKRSNotification(userId: string, count: number = 3) {
  const { updateBadge } = useNotificationStore.getState()
  updateBadge("krs", userId, count)
  console.log(`✅ Simulated ${count} new KRS offerings for user: ${userId}`)
}

/**
 * Simulate Jadwal notification (mata kuliah disinkronisasi)
 */
export function simulateScheduleNotification(userId: string, count: number = 2) {
  const { updateBadge } = useNotificationStore.getState()
  updateBadge("jadwal", userId, count)
  console.log(`✅ Simulated ${count} new schedule syncs for user: ${userId}`)
}

/**
 * Simulate Reminder notification (30 menit sebelum jadwal)
 */
export function simulateReminderNotification(userId: string, count: number = 1) {
  const { updateBadge } = useNotificationStore.getState()
  updateBadge("reminder", userId, count)
  console.log(`✅ Simulated ${count} upcoming reminders for user: ${userId}`)
}

/**
 * Simulate ALL notifications at once
 */
export function simulateAllNotifications(userId: string) {
  simulateKRSNotification(userId, 2)
  simulateScheduleNotification(userId, 1)
  simulateReminderNotification(userId, 1)
  console.log(`✅ Simulated ALL notifications for user: ${userId}`)
}

/**
 * Clear all notifications
 */
export function clearAllNotifications(userId: string) {
  const { clearAllBadges } = useNotificationStore.getState()
  clearAllBadges(userId)
  console.log(`✅ Cleared all notifications for user: ${userId}`)
}

/**
 * Show current notification state
 */
export function showNotificationState(userId: string) {
  const { badges, getBadgeCount } = useNotificationStore.getState()
  
  console.log("📊 Current Notification State:")
  console.log("─".repeat(50))
  console.log(`KRS:          ${getBadgeCount("krs", userId)}`)
  console.log(`Jadwal:       ${getBadgeCount("jadwal", userId)}`)
  console.log(`Reminder:     ${getBadgeCount("reminder", userId)}`)
  console.log("─".repeat(50))
  console.log("All badges:", badges.filter(b => b.userId === userId))
}

// Browser console utilities
if (typeof window !== "undefined") {
  // @ts-ignore
  window.notificationTest = {
    simulateKRS: (userId: string, count?: number) => simulateKRSNotification(userId, count),
    simulateSchedule: (userId: string, count?: number) => simulateScheduleNotification(userId, count),
    simulateReminder: (userId: string, count?: number) => simulateReminderNotification(userId, count),
    simulateAll: (userId: string) => simulateAllNotifications(userId),
    clearAll: (userId: string) => clearAllNotifications(userId),
    showState: (userId: string) => showNotificationState(userId),
  }

  console.log(`
🎯 Notification Test Utilities Loaded!

Usage (in browser console):
  notificationTest.simulateKRS("user-id", 3)       // Add KRS badge
  notificationTest.simulateSchedule("user-id", 2)  // Add Jadwal badge
  notificationTest.simulateReminder("user-id", 1)  // Add Reminder badge
  notificationTest.simulateAll("user-id")          // Add all badges
  notificationTest.clearAll("user-id")             // Clear all badges
  notificationTest.showState("user-id")            // Show current state

Example:
  notificationTest.simulateAll("cm39z4s1700039wnscaqu56bk")
  notificationTest.showState("cm39z4s1700039wnscaqu56bk")
  `)
}
