import type { UserSession } from "@/data/schema"
import { APP_ROUTES, type RouteConfig } from "@/config/routes"

// Role-based access control helpers
export function canAccessSubjects(role: UserSession["role"]): boolean {
  return role === "kaprodi"
}

export function canAccessKRS(role: UserSession["role"]): boolean {
  return role === "mahasiswa"
}

export function canAccessKHS(role: UserSession["role"]): boolean {
  return role === "mahasiswa"
}

export function canAccessEntryNilai(role: UserSession["role"]): boolean {
  return role === "dosen" || role === "kaprodi"
}

export function canEditSubject(role: UserSession["role"]): boolean {
  return role === "kaprodi"
}

export function canEditGrades(role: UserSession["role"]): boolean {
  return role === "dosen"
}

// Get available menu items based on role
export function getMenuItems(role: UserSession["role"]): RouteConfig[] {
  const commonItems = [
    { href: APP_ROUTES.DASHBOARD, label: "Dashboard", icon: "Home" },
    { href: APP_ROUTES.SCHEDULE, label: "Jadwal", icon: "Calendar" },
    { href: APP_ROUTES.ATTENDANCE, label: "Kehadiran", icon: "Users" },
    { href: APP_ROUTES.REMINDERS, label: "Pengingat", icon: "Bell" },
  ]

  const roleSpecificItems = {
    mahasiswa: [
      { href: APP_ROUTES.ASYNCHRONOUS, label: "Asynchronous", icon: "BookOpen" },
      { href: APP_ROUTES.KRS, label: "KRS", icon: "FileText" },
      { href: APP_ROUTES.KHS, label: "KHS", icon: "GraduationCap" },
    ],
    dosen: [
      { href: APP_ROUTES.ASYNCHRONOUS, label: "Asynchronous", icon: "BookOpen" },
      { href: APP_ROUTES.GRADE_ENTRY, label: "Entry Nilai", icon: "Edit" },
    ],
    kaprodi: [
      { href: APP_ROUTES.SUBJECTS, label: "Mata Kuliah", icon: "BookOpen" },
      { href: APP_ROUTES.GRADE_ENTRY, label: "Entry Nilai", icon: "Edit" },
    ],
  }

  return [...commonItems, ...roleSpecificItems[role]].map((item) => ({
    path: item.href,
    title: item.label,
    icon: item.icon.toLowerCase(),
    requiresAuth: true,
  }))
}
