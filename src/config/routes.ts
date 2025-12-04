export interface RouteConfig {
  path: string
  title: string
  description?: string
  icon?: string
  requiresAuth?: boolean
  roles?: string[]
}

export const APP_ROUTES = {
  // Public routes
  HOME: "/",
  LOGIN: "/login",

  // Protected app routes
  DASHBOARD: "/dashboard",
  SCHEDULE: "/jadwal",
  SUBJECTS: "/subjects",
  KRS: "/krs",
  PROFILE: "/profile",
  REMINDERS: "/reminders",
  ROLE_MANAGEMENT: "/role-management",
} as const

export const ROUTE_CONFIGS: Record<string, RouteConfig> = {
  [APP_ROUTES.HOME]: {
    path: APP_ROUTES.HOME,
    title: "Beranda",
    description: "Halaman utama aplikasi",
    requiresAuth: false,
  },
  [APP_ROUTES.LOGIN]: {
    path: APP_ROUTES.LOGIN,
    title: "Masuk",
    description: "Halaman login",
    requiresAuth: false,
  },
  [APP_ROUTES.DASHBOARD]: {
    path: APP_ROUTES.DASHBOARD,
    title: "Dashboard",
    description: "Dashboard utama",
    icon: "dashboard",
    requiresAuth: true,
  },
  [APP_ROUTES.SCHEDULE]: {
    path: APP_ROUTES.SCHEDULE,
    title: "Jadwal",
    description: "Manajemen jadwal kuliah",
    icon: "calendar",
    requiresAuth: true,
  },
  [APP_ROUTES.SUBJECTS]: {
    path: APP_ROUTES.SUBJECTS,
    title: "Mata Kuliah",
    description: "Manajemen mata kuliah",
    icon: "book",
    requiresAuth: true,
  },
  [APP_ROUTES.KRS]: {
    path: APP_ROUTES.KRS,
    title: "KRS",
    description: "Kartu Rencana Studi",
    icon: "file-text",
    requiresAuth: true,
  },
  [APP_ROUTES.PROFILE]: {
    path: APP_ROUTES.PROFILE,
    title: "Profil",
    description: "Profil pengguna",
    icon: "user",
    requiresAuth: true,
  },
  [APP_ROUTES.REMINDERS]: {
    path: APP_ROUTES.REMINDERS,
    title: "Pengingat",
    description: "Manajemen pengingat",
    icon: "bell",
    requiresAuth: true,
  },
  [APP_ROUTES.ROLE_MANAGEMENT]: {
    path: APP_ROUTES.ROLE_MANAGEMENT,
    title: "Role Management",
    description: "Manajemen pengguna dan role",
    icon: "user-cog",
    requiresAuth: true,
    roles: ["super_admin"],
  },
}

// Navigation menu items for sidebar
export const NAVIGATION_ITEMS = [
  ROUTE_CONFIGS[APP_ROUTES.DASHBOARD],
  ROUTE_CONFIGS[APP_ROUTES.SCHEDULE],
  ROUTE_CONFIGS[APP_ROUTES.SUBJECTS],
  ROUTE_CONFIGS[APP_ROUTES.KRS],
  ROUTE_CONFIGS[APP_ROUTES.REMINDERS],
]

// Helper functions
export const getRouteConfig = (path: string): RouteConfig | undefined => {
  return ROUTE_CONFIGS[path]
}

export const getRouteTitle = (path: string): string => {
  return getRouteConfig(path)?.title || "Halaman"
}

export const isProtectedRoute = (path: string): boolean => {
  return getRouteConfig(path)?.requiresAuth || false
}
