import { useActivityStore } from "@/stores/activity.store"

export type ActivityCategory = "schedule" | "krs" | "reminder" | "subject" | "attendance" | "assignment" | "material" | "profile" | "other"

interface LogActivityOptions {
  userId: string
  title: string
  description?: string
  icon?: string
  color?: string
  category: ActivityCategory
}

// Default icons and colors for each category
const categoryDefaults: Record<ActivityCategory, { icon: string; color: string }> = {
  schedule: { icon: "Calendar", color: "text-blue-500" },
  krs: { icon: "Users", color: "text-purple-500" },
  reminder: { icon: "Bell", color: "text-orange-500" },
  subject: { icon: "BookOpen", color: "text-green-500" },
  attendance: { icon: "CheckCircle", color: "text-teal-500" },
  assignment: { icon: "FileText", color: "text-indigo-500" },
  material: { icon: "Download", color: "text-cyan-500" },
  profile: { icon: "User", color: "text-pink-500" },
  other: { icon: "Star", color: "text-yellow-500" },
}

export function logActivity(options: LogActivityOptions) {
  const { userId, title, description, category } = options
  const defaults = categoryDefaults[category]
  
  const icon = options.icon || defaults.icon
  const color = options.color || defaults.color
  
  useActivityStore.getState().addActivity({
    userId,
    title,
    description,
    icon,
    color,
    category,
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
      icon: "Plus",
      color: "text-green-500",
    })
  },
  
  scheduleUpdated: (userId: string, courseName: string) => {
    logActivity({
      userId,
      title: `Jadwal ${courseName} diperbarui`,
      category: "schedule",
      icon: "Edit",
      color: "text-blue-500",
    })
  },
  
  scheduleDeleted: (userId: string, courseName: string) => {
    logActivity({
      userId,
      title: `Jadwal ${courseName} dihapus`,
      category: "schedule",
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
      icon: "Plus",
      color: "text-green-500",
    })
  },
  
  krsRemoved: (userId: string, courseName: string) => {
    logActivity({
      userId,
      title: `${courseName} dihapus dari KRS`,
      category: "krs",
      icon: "Trash2",
      color: "text-red-500",
    })
  },
  
  krsCleared: (userId: string) => {
    logActivity({
      userId,
      title: "Semua KRS dibersihkan",
      category: "krs",
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
      icon: "Plus",
      color: "text-green-500",
    })
  },
  
  reminderUpdated: (userId: string, title: string) => {
    logActivity({
      userId,
      title: `Pengingat "${title}" diperbarui`,
      category: "reminder",
      icon: "Edit",
      color: "text-blue-500",
    })
  },
  
  reminderDeleted: (userId: string, title: string) => {
    logActivity({
      userId,
      title: `Pengingat "${title}" dihapus`,
      category: "reminder",
      icon: "Trash2",
      color: "text-red-500",
    })
  },
  
  reminderCompleted: (userId: string, title: string) => {
    logActivity({
      userId,
      title: `Pengingat "${title}" selesai`,
      category: "reminder",
      icon: "CheckCircle",
      color: "text-green-500",
    })
  },
  
  // Subject activities
  subjectCreated: (userId: string, subjectName: string) => {
    logActivity({
      userId,
      title: `Mata kuliah ${subjectName} dibuat`,
      category: "subject",
      icon: "Plus",
      color: "text-green-500",
    })
  },
  
  subjectUpdated: (userId: string, subjectName: string) => {
    logActivity({
      userId,
      title: `Mata kuliah ${subjectName} diperbarui`,
      category: "subject",
      icon: "Edit",
      color: "text-blue-500",
    })
  },
  
  subjectDeleted: (userId: string, subjectName: string) => {
    logActivity({
      userId,
      title: `Mata kuliah ${subjectName} dihapus`,
      category: "subject",
      icon: "Trash2",
      color: "text-red-500",
    })
  },
  
  // Assignment activities
  assignmentCreated: (userId: string, assignmentTitle: string) => {
    logActivity({
      userId,
      title: `Tugas "${assignmentTitle}" dibuat`,
      category: "assignment",
      icon: "Plus",
      color: "text-green-500",
    })
  },
  
  assignmentSubmitted: (userId: string, assignmentTitle: string) => {
    logActivity({
      userId,
      title: `Tugas "${assignmentTitle}" dikumpulkan`,
      category: "assignment",
      icon: "Upload",
      color: "text-blue-500",
    })
  },
  
  assignmentUpdated: (userId: string, assignmentTitle: string) => {
    logActivity({
      userId,
      title: `Tugas "${assignmentTitle}" diperbarui`,
      category: "assignment",
      icon: "Edit",
      color: "text-blue-500",
    })
  },
  
  assignmentDeleted: (userId: string, assignmentTitle: string) => {
    logActivity({
      userId,
      title: `Tugas "${assignmentTitle}" dihapus`,
      category: "assignment",
      icon: "Trash2",
      color: "text-red-500",
    })
  },
  
  // Material activities
  materialAdded: (userId: string, materialTitle: string) => {
    logActivity({
      userId,
      title: `Materi "${materialTitle}" ditambahkan`,
      category: "material",
      icon: "Plus",
      color: "text-green-500",
    })
  },
  
  materialDeleted: (userId: string, materialTitle: string) => {
    logActivity({
      userId,
      title: `Materi "${materialTitle}" dihapus`,
      category: "material",
      icon: "Trash2",
      color: "text-red-500",
    })
  },
  
  // Attendance activities
  attendanceRecorded: (userId: string, courseName: string, status: string) => {
    logActivity({
      userId,
      title: `Kehadiran ${courseName} dicatat`,
      description: status,
      category: "attendance",
      icon: "CheckCircle",
      color: status === "Hadir" ? "text-green-500" : "text-red-500",
    })
  },
  
  // Profile activities
  profileUpdated: (userId: string) => {
    logActivity({
      userId,
      title: "Profile diperbarui",
      category: "profile",
      icon: "User",
      color: "text-pink-500",
    })
  },
}
