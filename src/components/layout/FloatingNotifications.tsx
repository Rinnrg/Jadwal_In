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

  useEffect(() => {
    if (!session?.id) return

    // Skip first render to avoid showing notifications on page load
    if (!hasInitialized.current) {
      // Initialize previous badges
      badges.forEach(badge => {
        if (badge.userId === session.id) {
          const key = `${badge.type}-${badge.userId}`
          previousBadges.current.set(key, badge.count)
        }
      })
      hasInitialized.current = true
      return
    }

    // Check each badge for changes
    badges.forEach(badge => {
      if (badge.userId !== session.id) return

      const key = `${badge.type}-${badge.userId}`
      const previousCount = previousBadges.current.get(key) || 0
      const currentCount = badge.count

      // Only show notification if count increased
      if (currentCount > previousCount && currentCount > 0) {
        const diff = currentCount - previousCount
        showNotification(badge.type, diff)
      }

      // Update previous count
      previousBadges.current.set(key, currentCount)
    })
  }, [badges, session?.id])

  const showNotification = (type: string, count: number) => {
    const notifications: Record<string, { 
      title: string
      description: string
      icon: any
      action?: { label: string; onClick: () => void }
    }> = {
      krs: {
        title: "Mata Kuliah Baru Tersedia",
        description: `${count} mata kuliah baru telah ditambahkan ke KRS`,
        icon: BookOpen,
        action: {
          label: "Lihat KRS",
          onClick: () => router.push("/krs"),
        },
      },
      asynchronous: {
        title: "Konten Pembelajaran Baru",
        description: count === 1 
          ? "Materi atau tugas baru telah ditambahkan"
          : `${count} materi/tugas baru telah ditambahkan`,
        icon: FileText,
        action: {
          label: "Buka Asynchronous",
          onClick: () => router.push("/asynchronous"),
        },
      },
      jadwal: {
        title: "Jadwal Disinkronisasi",
        description: "Jadwal kuliah telah diperbarui",
        icon: Calendar,
        action: {
          label: "Lihat Jadwal",
          onClick: () => router.push("/jadwal"),
        },
      },
      khs: {
        title: "Nilai Sudah Diupdate",
        description: `${count} nilai baru tersedia di KHS`,
        icon: GraduationCap,
        action: {
          label: "Cek Nilai",
          onClick: () => router.push("/khs"),
        },
      },
      reminder: {
        title: "Pengingat Akan Datang",
        description: count === 1
          ? "Ada 1 jadwal dalam 30 menit ke depan"
          : `Ada ${count} jadwal dalam 30 menit ke depan`,
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
      classNames: {
        toast: "group-[.toaster]:bg-white dark:group-[.toaster]:bg-gray-800 group-[.toaster]:border-primary/20 group-[.toaster]:shadow-lg",
        title: "group-[.toast]:text-gray-900 dark:group-[.toast]:text-gray-100 group-[.toast]:font-semibold",
        description: "group-[.toast]:text-gray-600 dark:group-[.toast]:text-gray-400",
        icon: "group-[.toast]:text-primary",
        actionButton: "group-[.toast]:bg-primary group-[.toast]:text-white group-[.toast]:hover:bg-primary/90",
      },
    })
  }

  return null
}
