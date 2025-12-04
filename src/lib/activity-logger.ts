import { useActivityStore } from "@/stores/activity.store"

export type ActivityCategory = "schedule" | "krs" | "reminder" | "subject" | "profile" | "password" | "other"
export type ActivityAction = "created" | "updated" | "deleted" | "submitted" | "uploaded" | "completed" | "changed"

interface LogActivityOptions {
  userId: string
  title: string
  description?: string
  icon?: string
  color?: string
  category: ActivityCategory
  action: ActivityAction
  metadata?: any
}

// Default icons and colors for each category
const categoryDefaults: Record<ActivityCategory, { icon: string; color: string }> = {
  schedule: { icon: "Calendar", color: "text-blue-500" },
  krs: { icon: "Users", color: "text-purple-500" },
  reminder: { icon: "Bell", color: "text-orange-500" },
  subject: { icon: "BookOpen", color: "text-green-500" },
  profile: { icon: "User", color: "text-pink-500" },
  password: { icon: "Lock", color: "text-red-500" },
  other: { icon: "Star", color: "text-yellow-500" },
}

export function logActivity(options: LogActivityOptions) {
  const { userId, title, description, category, action, metadata } = options
  const defaults = categoryDefaults[category]
  
  const icon = options.icon || defaults.icon
  const color = options.color || defaults.color
  
  // Log to local store
  useActivityStore.getState().addActivity({
    userId,
    title,
    description,
    icon,
    color,
    category,
  })

  // Also log to database via API
  fetch("/api/activities", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      title,
      description,
      category,
      action,
      icon,
      color,
      metadata,
    }),
  }).catch((error) => {
    console.error("Failed to log activity to database:", error)
  })
}

// Helper functions for common activities
export const ActivityLogger = {
  // Schedule activities
  scheduleAdded: (userId: string, courseName: string) => {
    logActivity({
      userId,
      title: `Jadwal ${courseName} ditambahkan`,
      category: "schedule",
      action: "created",
      icon: "Plus",
      color: "text-green-500",
    })
  },
  
  scheduleUpdated: (userId: string, courseName: string) => {
    logActivity({
      userId,
      title: `Jadwal ${courseName} diperbarui`,
      category: "schedule",
      action: "updated",
      icon: "Edit",
      color: "text-blue-500",
    })
  },
  
  scheduleDeleted: (userId: string, courseName: string) => {
    logActivity({
      userId,
      title: `Jadwal ${courseName} dihapus`,
      category: "schedule",
      action: "deleted",
      icon: "Trash2",
      color: "text-red-500",
    })
  },
  
  // KRS activities
  krsAdded: (userId: string, courseName: string, sks: number) => {
    logActivity({
      userId,
      title: `${courseName} ditambahkan ke KRS`,
      description: `${sks} SKS`,
      category: "krs",
      action: "created",
      icon: "Plus",
      color: "text-green-500",
      metadata: { courseName, sks },
    })
  },
  
  krsRemoved: (userId: string, courseName: string) => {
    logActivity({
      userId,
      title: `${courseName} dihapus dari KRS`,
      category: "krs",
      action: "deleted",
      icon: "Trash2",
      color: "text-red-500",
      metadata: { courseName },
    })
  },
  
  krsCleared: (userId: string) => {
    logActivity({
      userId,
      title: "Semua KRS dibersihkan",
      category: "krs",
      action: "deleted",
      icon: "Trash2",
      color: "text-red-500",
    })
  },
  
  // Reminder activities
  reminderCreated: (userId: string, title: string) => {
    logActivity({
      userId,
      title: `Pengingat "${title}" dibuat`,
      category: "reminder",
      action: "created",
      icon: "Plus",
      color: "text-green-500",
      metadata: { reminderTitle: title },
    })
  },
  
  reminderUpdated: (userId: string, title: string) => {
    logActivity({
      userId,
      title: `Pengingat "${title}" diperbarui`,
      category: "reminder",
      action: "updated",
      icon: "Edit",
      color: "text-blue-500",
      metadata: { reminderTitle: title },
    })
  },
  
  reminderDeleted: (userId: string, title: string) => {
    logActivity({
      userId,
      title: `Pengingat "${title}" dihapus`,
      category: "reminder",
      action: "deleted",
      icon: "Trash2",
      color: "text-red-500",
      metadata: { reminderTitle: title },
    })
  },
  
  reminderCompleted: (userId: string, title: string) => {
    logActivity({
      userId,
      title: `Pengingat "${title}" selesai`,
      category: "reminder",
      action: "completed",
      icon: "CheckCircle",
      color: "text-green-500",
      metadata: { reminderTitle: title },
    })
  },
  
  // Subject activities
  subjectCreated: (userId: string, subjectName: string) => {
    logActivity({
      userId,
      title: `Mata kuliah ${subjectName} dibuat`,
      category: "subject",
      action: "created",
      icon: "Plus",
      color: "text-green-500",
      metadata: { subjectName },
    })
  },
  
  subjectUpdated: (userId: string, subjectName: string) => {
    logActivity({
      userId,
      title: `Mata kuliah ${subjectName} diperbarui`,
      category: "subject",
      action: "updated",
      icon: "Edit",
      color: "text-blue-500",
      metadata: { subjectName },
    })
  },
  
  subjectDeleted: (userId: string, subjectName: string) => {
    logActivity({
      userId,
      title: `Mata kuliah ${subjectName} dihapus`,
      category: "subject",
      action: "deleted",
      icon: "Trash2",
      color: "text-red-500",
      metadata: { subjectName },
    })
  },
  
  // Profile activities
  profileUpdated: (userId: string, field?: string) => {
    logActivity({
      userId,
      title: field ? `${field} diperbarui` : "Profil diperbarui",
      category: "profile",
      action: "updated",
      icon: "User",
      color: "text-pink-500",
      metadata: { field },
    })
  },

  profilePictureUpdated: (userId: string) => {
    logActivity({
      userId,
      title: "Foto profil diperbarui",
      category: "profile",
      action: "updated",
      icon: "User",
      color: "text-pink-500",
    })
  },

  // Password activities
  passwordChanged: (userId: string) => {
    logActivity({
      userId,
      title: "Kata sandi berhasil diubah",
      category: "password",
      action: "changed",
      icon: "Lock",
      color: "text-red-500",
    })
  },
}
