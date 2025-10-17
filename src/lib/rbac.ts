import type { UserSession } from "@/data/schema"
import { APP_ROUTES, type RouteConfig } from "@/config/routes"

// Extended RouteConfig to support dropdown menus
export interface ExtendedRouteConfig extends RouteConfig {
  children?: ExtendedRouteConfig[]
  isDropdown?: boolean
}

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

export function canAccessAttendance(role: UserSession["role"]): boolean {
  return role === "dosen" || role === "kaprodi"
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
export function getMenuItems(role: UserSession["role"]): ExtendedRouteConfig[] {
  const commonItems = [
    { path: APP_ROUTES.DASHBOARD, title: "Dashboard", icon: "home", requiresAuth: true },
    { path: APP_ROUTES.SCHEDULE, title: "Jadwal", icon: "calendar", requiresAuth: true },
    { path: APP_ROUTES.REMINDERS, title: "Pengingat", icon: "bell", requiresAuth: true },
  ]

  const roleSpecificItems = {
    mahasiswa: [
      {
        path: "#",
        title: "Perkuliahan",
        icon: "book",
        requiresAuth: true,
        isDropdown: true,
        children: [
          { path: APP_ROUTES.ASYNCHRONOUS, title: "Asynchronous", icon: "monitor", requiresAuth: true },
          { path: APP_ROUTES.KRS, title: "KRS", icon: "file-text", requiresAuth: true },
          { path: APP_ROUTES.KHS, title: "KHS", icon: "award", requiresAuth: true },
        ]
      },
    ],
    dosen: [
      {
        path: "#",
        title: "Perkuliahan",
        icon: "book",
        requiresAuth: true,
        isDropdown: true,
        children: [
          { path: APP_ROUTES.ASYNCHRONOUS, title: "Asynchronous", icon: "monitor", requiresAuth: true },
          { path: APP_ROUTES.ATTENDANCE, title: "Kehadiran", icon: "users", requiresAuth: true },
          { path: APP_ROUTES.GRADE_ENTRY, title: "Entry Nilai", icon: "edit", requiresAuth: true },
        ]
      },
    ],
    kaprodi: [
      { path: APP_ROUTES.SUBJECTS, title: "Mata Kuliah", icon: "library", requiresAuth: true },
      {
        path: "#",
        title: "Perkuliahan",
        icon: "book",
        requiresAuth: true,
        isDropdown: true,
        children: [
          { path: APP_ROUTES.ASYNCHRONOUS, title: "Asynchronous", icon: "monitor", requiresAuth: true },
          { path: APP_ROUTES.ATTENDANCE, title: "Kehadiran", icon: "users", requiresAuth: true },
          { path: APP_ROUTES.GRADE_ENTRY, title: "Entry Nilai", icon: "edit", requiresAuth: true },
        ]
      },
    ],
  }

  return [...commonItems, ...roleSpecificItems[role]]
}
