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

/**
 * Floating notification toasts that appear when new content is added
 * Shows notifications for: KRS, Asynchronous, Jadwal, KHS, Reminders
 */
export function FloatingNotifications() {
  const router = useRouter()
  const { session } = useSessionStore()
  const { badges } = useNotificationStore()
  const previousBadges = useRef<Map<string, number>>(new Map())
  const hasInitialized = useRef(false)
  const pendingNotifications = useRef<Map<string, { count: number; timestamp: number }>>(new Map())
  const notificationTimeout = useRef<NodeJS.Timeout>()

  // Load initialization state from localStorage
  useEffect(() => {
    if (!session?.id) return

    const initData = localStorage.getItem(INIT_KEY)
    const lastCountsData = localStorage.getItem(LAST_COUNTS_KEY)
    
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

    // Initialize previous badges from current state
    // CRITICAL: Set counts based on what's already in the store
    // This prevents showing notifications for existing data on refresh
    badges.forEach(badge => {
      if (badge.userId === session.id) {
        const key = `${badge.type}-${badge.userId}`
        // Always use current badge count on mount, never show notification
        previousBadges.current.set(key, badge.count)
      }
    })

    // Save initial state to localStorage
    saveLastCounts(session.id)

    // Mark as initialized immediately to prevent ANY notifications on mount
    hasInitialized.current = true
    const current = localStorage.getItem(INIT_KEY)
    const data = current ? JSON.parse(current) : {}
    data[session.id] = true
    localStorage.setItem(INIT_KEY, JSON.stringify(data))
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

  useEffect(() => {
    if (!session?.id || !hasInitialized.current) return

    // Clear pending timeout
    if (notificationTimeout.current) {
      clearTimeout(notificationTimeout.current)
    }

    // Collect changes
    const changes: Array<{ type: string; diff: number }> = []
    
    badges.forEach(badge => {
      if (badge.userId !== session.id) return

      const key = `${badge.type}-${badge.userId}`
      const previousCount = previousBadges.current.get(key) || 0
      const currentCount = badge.count

      // Only show notification if count increased
      if (currentCount > previousCount && currentCount > 0) {
        const diff = currentCount - previousCount
        changes.push({ type: badge.type, diff })
        
        // Update previous count
        previousBadges.current.set(key, currentCount)
      } else if (currentCount !== previousCount) {
        // Update count even if it decreased
        previousBadges.current.set(key, currentCount)
      }
    })

    // Save counts to localStorage
    saveLastCounts(session.id)

    // Group notifications by type and show them in batches
    if (changes.length > 0) {
      // Debounce: wait 500ms to collect all changes
      notificationTimeout.current = setTimeout(() => {
        // Group by type
        const grouped = new Map<string, number>()
        changes.forEach(({ type, diff }) => {
          const current = grouped.get(type) || 0
          grouped.set(type, current + diff)
        })

        // Show grouped notifications with slight delay between each
        let delay = 0
        grouped.forEach((totalDiff, type) => {
          setTimeout(() => {
            showNotification(type, totalDiff)
          }, delay)
          delay += 300 // 300ms delay between each notification type
        })
      }, 500)
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
        background: 'var(--background)',
        color: 'var(--foreground)',
        border: '1px solid hsl(var(--primary) / 0.2)',
      },
      classNames: {
        toast: "group-[.toaster]:shadow-xl group-[.toaster]:backdrop-blur-sm",
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
