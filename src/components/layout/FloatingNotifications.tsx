"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useNotificationStore } from "@/stores/notification.store"
import { useSessionStore } from "@/stores/session.store"
import { toast } from "sonner"
import { 
  BookOpen, 
  Calendar, 
  GraduationCap, 
  FileText, 
  Bell 
} from "lucide-react"

// LocalStorage key for tracking initialization
const INIT_KEY = "jadwalin:notifications:initialized"
const LAST_COUNTS_KEY = "jadwalin:notifications:lastCounts"
const LAST_NOTIFIED_KEY = "jadwalin:notifications:lastNotified"

/**
 * Floating notification toasts that appear when new content is added
 * Shows notifications for: KRS, Asynchronous, Jadwal, KHS, Reminders
 */
export function FloatingNotifications() {
  const router = useRouter()
  const { session } = useSessionStore()
  const { badges } = useNotificationStore()
  const previousBadges = useRef<Map<string, number>>(new Map())
  const lastNotifiedCounts = useRef<Map<string, number>>(new Map()) // Track what we've already notified
  const hasInitialized = useRef(false)
  const isInitializing = useRef(true) // New flag for grace period
  const initializationTimer = useRef<NodeJS.Timeout>()
  const pendingNotifications = useRef<Map<string, { count: number; timestamp: number }>>(new Map())
  const notificationTimeout = useRef<NodeJS.Timeout>()

  // Load initialization state from localStorage
  useEffect(() => {
    if (!session?.id) return

    const initData = localStorage.getItem(INIT_KEY)
    const lastCountsData = localStorage.getItem(LAST_COUNTS_KEY)
    const lastNotifiedData = localStorage.getItem(LAST_NOTIFIED_KEY)
    
    if (initData) {
      try {
        const parsed = JSON.parse(initData)
        if (parsed[session.id]) {
          hasInitialized.current = true
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    if (lastCountsData) {
      try {
        const parsed = JSON.parse(lastCountsData)
        if (parsed[session.id]) {
          Object.entries(parsed[session.id]).forEach(([key, count]) => {
            previousBadges.current.set(key, count as number)
          })
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    if (lastNotifiedData) {
      try {
        const parsed = JSON.parse(lastNotifiedData)
        if (parsed[session.id]) {
          Object.entries(parsed[session.id]).forEach(([key, count]) => {
            lastNotifiedCounts.current.set(key, count as number)
          })
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    // Initialize previous badges from current state
    // CRITICAL: Set counts based on what's already in the store
    // This prevents showing notifications for existing data on refresh
    badges.forEach(badge => {
      if (badge.userId === session.id) {
        const key = `${badge.type}-${badge.userId}`
        // Always use current badge count on mount, never show notification
        previousBadges.current.set(key, badge.count)
        lastNotifiedCounts.current.set(key, badge.count)
      }
    })

    // Save initial state to localStorage
    saveLastCounts(session.id)
    saveLastNotified(session.id)

    // Mark as initialized immediately to prevent ANY notifications on mount
    hasInitialized.current = true
    const current = localStorage.getItem(INIT_KEY)
    const data = current ? JSON.parse(current) : {}
    data[session.id] = true
    localStorage.setItem(INIT_KEY, JSON.stringify(data))

    // CRITICAL: Grace period - NO notifications for 3 seconds after mount
    // This ensures all initial badge updates are silent
    isInitializing.current = true
    initializationTimer.current = setTimeout(() => {
      isInitializing.current = false
      console.log('[FloatingNotifications] Grace period ended - notifications now active')
    }, 3000) // 3 second grace period

    // Cleanup timer on unmount
    return () => {
      if (initializationTimer.current) {
        clearTimeout(initializationTimer.current)
      }
    }
  }, [session?.id]) // Only run on session change, not badges

  // Save last counts to localStorage
  const saveLastCounts = (userId: string) => {
    const counts: Record<string, number> = {}
    previousBadges.current.forEach((count, key) => {
      if (key.includes(userId)) {
        counts[key] = count
      }
    })

    const current = localStorage.getItem(LAST_COUNTS_KEY)
    const data = current ? JSON.parse(current) : {}
    data[userId] = counts
    localStorage.setItem(LAST_COUNTS_KEY, JSON.stringify(data))
  }

  // Save last notified counts to localStorage
  const saveLastNotified = (userId: string) => {
    const counts: Record<string, number> = {}
    lastNotifiedCounts.current.forEach((count, key) => {
      if (key.includes(userId)) {
        counts[key] = count
      }
    })

    const current = localStorage.getItem(LAST_NOTIFIED_KEY)
    const data = current ? JSON.parse(current) : {}
    data[userId] = counts
    localStorage.setItem(LAST_NOTIFIED_KEY, JSON.stringify(data))
  }

  useEffect(() => {
    if (!session?.id || !hasInitialized.current) return
    
    // CRITICAL: During grace period, ONLY update counts silently - NO notifications
    if (isInitializing.current) {
      badges.forEach(badge => {
        if (badge.userId !== session.id) return
        const key = `${badge.type}-${badge.userId}`
        previousBadges.current.set(key, badge.count)
        lastNotifiedCounts.current.set(key, badge.count)
      })
      saveLastCounts(session.id)
      saveLastNotified(session.id)
      return // Exit early - no notifications during initialization
    }

    // Process badge changes (only after grace period)
    badges.forEach(badge => {
      if (badge.userId !== session.id) return

      const key = `${badge.type}-${badge.userId}`
      const previousCount = previousBadges.current.get(key) || 0
      const currentCount = badge.count
      const lastNotifiedCount = lastNotifiedCounts.current.get(key) || 0

      // CRITICAL: Only notify about changes since LAST NOTIFICATION
      // Not since last badge check - this prevents duplicate notifications
      if (currentCount > lastNotifiedCount) {
        const diff = currentCount - lastNotifiedCount
        
        // Accumulate the count in pending notifications
        const existing = pendingNotifications.current.get(badge.type)
        if (existing) {
          // Update count to total difference from last notified
          existing.count = currentCount - lastNotifiedCount
          existing.timestamp = Date.now()
        } else {
          // Create new pending notification for this type
          pendingNotifications.current.set(badge.type, {
            count: diff,
            timestamp: Date.now()
          })
        }
      }
      
      // Always update the stored count for next comparison
      previousBadges.current.set(key, currentCount)
    })

    // Save counts to localStorage
    saveLastCounts(session.id)

    // Clear any existing timeout
    if (notificationTimeout.current) {
      clearTimeout(notificationTimeout.current)
    }

    // Debounce: wait 800ms after last change to show notifications
    // Longer debounce to ensure we capture all rapid changes
    if (pendingNotifications.current.size > 0) {
      notificationTimeout.current = setTimeout(() => {
        // Show all pending notifications with slight delay between each type
        let delay = 0
        const notificationsToShow = new Map(pendingNotifications.current)
        
        notificationsToShow.forEach((notification, type) => {
          setTimeout(() => {
            showNotification(type, notification.count)
            
            // Update last notified count AFTER showing notification
            const key = `${type}-${session.id}`
            const currentBadge = badges.find(b => b.type === type && b.userId === session.id)
            if (currentBadge) {
              lastNotifiedCounts.current.set(key, currentBadge.count)
            }
          }, delay)
          delay += 300 // 300ms delay between each notification type
        })
        
        // Save last notified counts after all notifications shown
        setTimeout(() => {
          saveLastNotified(session.id)
        }, delay + 100)
        
        // Clear pending notifications after showing
        pendingNotifications.current.clear()
      }, 800) // Increased from 500ms to 800ms
    }
  }, [badges, session?.id])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (notificationTimeout.current) {
        clearTimeout(notificationTimeout.current)
      }
    }
  }, [])

  const showNotification = (type: string, count: number) => {
    const notifications: Record<string, { 
      title: string
      description: string
      icon: any
      action?: { label: string; onClick: () => void }
    }> = {
      krs: {
        title: "Mata Kuliah Baru Tersedia",
        description: count === 1 
          ? "1 mata kuliah baru telah ditambahkan ke KRS"
          : `${count} mata kuliah baru telah ditambahkan ke KRS`,
        icon: BookOpen,
        action: {
          label: "Lihat KRS",
          onClick: () => router.push("/krs"),
        },
      },
      asynchronous: {
        title: "Konten Pembelajaran Baru",
        description: count === 1 
          ? "1 materi atau tugas baru telah ditambahkan"
          : `${count} materi/tugas baru telah ditambahkan`,
        icon: FileText,
        action: {
          label: "Buka Asynchronous",
          onClick: () => router.push("/asynchronous"),
        },
      },
      jadwal: {
        title: "Jadwal Diperbarui",
        description: "Jadwal kuliah telah disinkronisasi",
        icon: Calendar,
        action: {
          label: "Lihat Jadwal",
          onClick: () => router.push("/jadwal"),
        },
      },
      khs: {
        title: "Nilai Baru Tersedia",
        description: count === 1
          ? "1 nilai baru tersedia di KHS"
          : `${count} nilai baru tersedia di KHS`,
        icon: GraduationCap,
        action: {
          label: "Cek Nilai",
          onClick: () => router.push("/khs"),
        },
      },
      reminder: {
        title: "Pengingat",
        description: count === 1
          ? "1 jadwal dalam 30 menit ke depan"
          : `${count} jadwal dalam 30 menit ke depan`,
        icon: Bell,
        action: {
          label: "Lihat Pengingat",
          onClick: () => router.push("/reminders"),
        },
      },
    }

    const notification = notifications[type]
    if (!notification) return

    const Icon = notification.icon

    toast(notification.title, {
      description: notification.description,
      icon: <Icon className="h-5 w-5" />,
      duration: 6000,
      position: "top-right",
      action: notification.action ? {
        label: notification.action.label,
        onClick: notification.action.onClick,
      } : undefined,
      style: {
        background: 'hsl(var(--background) / 0.95)',
        color: 'var(--foreground)',
        border: '1px solid hsl(var(--border))',
        backdropFilter: 'blur(8px)',
      },
      classNames: {
        toast: "group-[.toaster]:shadow-xl",
        title: "group-[.toast]:text-foreground group-[.toast]:font-semibold",
        description: "group-[.toast]:text-muted-foreground",
        icon: "group-[.toast]:text-primary",
        actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:hover:bg-primary/90 group-[.toast]:transition-all group-[.toast]:duration-200",
        closeButton: "group-[.toast]:text-muted-foreground group-[.toast]:hover:text-foreground group-[.toast]:transition-colors",
      },
    })
  }

  return null
}
