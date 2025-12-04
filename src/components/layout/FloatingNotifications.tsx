"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useNotificationStore, type NotificationBadge } from "@/stores/notification.store"
import { useSessionStore } from "@/stores/session.store"
import { toast } from "sonner"
import { 
  BookOpen, 
  Calendar, 
  GraduationCap, 
  FileText, 
  Bell 
} from "lucide-react"

/**
 * Floating notification toasts that appear when new content is added
 * Shows notifications for: KRS, Asynchronous, Jadwal, KHS, Reminders
 * 
 * CRITICAL: Uses store's shouldShowNotification + grace period to prevent spam
 */
export function FloatingNotifications() {
  const router = useRouter()
  const { session } = useSessionStore()
  const { badges, shouldShowNotification, markNotificationShown } = useNotificationStore()
  const isInitializing = useRef(true) // Grace period flag
  const initializationTimer = useRef<NodeJS.Timeout>()
  const mountTimestamp = useRef<number>(0) // Track when component mounted
  const pendingNotifications = useRef<Map<string, { count: number; timestamp: number }>>(new Map())
  const notificationTimeout = useRef<NodeJS.Timeout>()

  // Initialize grace period - NO notifications for 5 seconds after mount
  useEffect(() => {
    if (!session?.id) return

    // Record mount time
    mountTimestamp.current = Date.now()
    console.log('[FloatingNotifications] Component mounted at:', mountTimestamp.current)

    // CRITICAL: Grace period - NO notifications for 2 seconds after mount
    // This ensures all initial badge updates from useNotificationManager are silent
    isInitializing.current = true
    initializationTimer.current = setTimeout(() => {
      isInitializing.current = false
      console.log('[FloatingNotifications] Grace period ended - notifications now active')
    }, 2000) // 2 seconds grace period

    // Cleanup timer on unmount
    return () => {
      if (initializationTimer.current) {
        clearTimeout(initializationTimer.current)
      }
      if (notificationTimeout.current) {
        clearTimeout(notificationTimeout.current)
      }
    }
  }, [session?.id])

  // Watch for badge changes and show notifications
  useEffect(() => {
    if (!session?.id) return
    
    // CRITICAL: During grace period - NO notifications
    const timeSinceMount = Date.now() - mountTimestamp.current
    if (isInitializing.current || timeSinceMount < 2000) {
      return // Exit early - no notifications during initialization
    }

    // Process badge changes (only after grace period)
    badges.forEach(badge => {
      if (badge.userId !== session.id) return

      // Use store's shouldShowNotification to determine if notification needed
      if (shouldShowNotification(badge.type, session.id)) {
        // Accumulate the count in pending notifications
        const existing = pendingNotifications.current.get(badge.type)
        if (existing) {
          // Update to latest count
          existing.count = badge.count
          existing.timestamp = Date.now()
        } else {
          // Create new pending notification for this type
          pendingNotifications.current.set(badge.type, {
            count: badge.count,
            timestamp: Date.now()
          })
        }
      }
    })

    // Clear any existing timeout
    if (notificationTimeout.current) {
      clearTimeout(notificationTimeout.current)
    }

    // Debounce: wait 300ms after last change to show notifications
    if (pendingNotifications.current.size > 0) {
      notificationTimeout.current = setTimeout(() => {
        // Show all pending notifications with slight delay between each type
        let delay = 0
        const notificationsToShow = new Map(pendingNotifications.current)
        
        notificationsToShow.forEach((notification, type) => {
          setTimeout(() => {
            showNotification(type, notification.count)
            
            // CRITICAL: Mark notification as shown in store
            markNotificationShown(type as NotificationBadge["type"], session.id, notification.count)
          }, delay)
          delay += 150 // 150ms delay between each notification type
        })
        
        // Clear pending notifications after showing
        pendingNotifications.current.clear()
      }, 300) // Fast debounce for realtime feel
    }
  }, [badges, session?.id, shouldShowNotification, markNotificationShown])

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
      jadwal: {
        title: "Jadwal Diperbarui",
        description: "Jadwal kuliah telah disinkronisasi",
        icon: Calendar,
        action: {
          label: "Lihat Jadwal",
          onClick: () => router.push("/jadwal"),
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
