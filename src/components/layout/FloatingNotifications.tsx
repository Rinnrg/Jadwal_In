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

    // CRITICAL: Extended grace period - NO notifications for 10 seconds after mount
    // This ensures all initial badge updates from useNotificationManager are silent
    isInitializing.current = true
    initializationTimer.current = setTimeout(() => {
      isInitializing.current = false
      console.log('[FloatingNotifications] Grace period ended at:', Date.now() - mountTimestamp.current, 'ms after mount')
    }, 10000) // 10 seconds grace period to prevent spam on page load

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
    
    // CRITICAL: During grace period OR within 10s of mount - NO notifications
    const timeSinceMount = Date.now() - mountTimestamp.current
    if (isInitializing.current || timeSinceMount < 10000) {
      console.log('[FloatingNotifications] Grace period active - no notifications', {
        isInitializing: isInitializing.current,
        timeSinceMount,
      })
      return // Exit early - no notifications during initialization
    }

    // Process badge changes (only after grace period)
    badges.forEach(badge => {
      if (badge.userId !== session.id) return

      // Use store's shouldShowNotification to determine if notification needed
      if (shouldShowNotification && typeof shouldShowNotification === 'function') {
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
      }
    })

    // Clear any existing timeout
    if (notificationTimeout.current) {
      clearTimeout(notificationTimeout.current)
    }

    // Debounce: wait 1500ms after last change to show notifications
    if (pendingNotifications.current.size > 0) {
      notificationTimeout.current = setTimeout(() => {
        // Show all pending notifications with slight delay between each type
        let delay = 0
        const notificationsToShow = new Map(pendingNotifications.current)
        
        notificationsToShow.forEach((notification, type) => {
          setTimeout(() => {
            showNotification(type, notification.count)
            
            // CRITICAL: Mark notification as shown in store
            // This updates lastNotifiedCount and hasEverNotified
            if (markNotificationShown && typeof markNotificationShown === 'function') {
              markNotificationShown(type as NotificationBadge["type"], session.id, notification.count)
            }
          }, delay)
          delay += 500 // 500ms delay between each notification type
        })
        
        // Clear pending notifications after showing
        pendingNotifications.current.clear()
      }, 1500) // Increased debounce time to prevent spam
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
