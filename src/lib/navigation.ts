import { APP_ROUTES, ROUTE_CONFIGS, type RouteConfig } from "@/config/routes"

export class NavigationHelper {
  static isCurrentRoute(currentPath: string, targetPath: string): boolean {
    return currentPath === targetPath
  }

  static isActiveRoute(currentPath: string, targetPath: string): boolean {
    if (targetPath === APP_ROUTES.HOME) {
      return currentPath === targetPath
    }
    return currentPath.startsWith(targetPath)
  }

  static getPageTitle(path: string): string {
    const config = ROUTE_CONFIGS[path]
    return config?.title || "jadwal_in"
  }

  static getPageDescription(path: string): string {
    const config = ROUTE_CONFIGS[path]
    return config?.description || ""
  }

  static getBreadcrumbs(path: string): RouteConfig[] {
    const breadcrumbs: RouteConfig[] = []

    // Always start with dashboard for protected routes
    if (path !== APP_ROUTES.HOME && path !== APP_ROUTES.LOGIN) {
      breadcrumbs.push(ROUTE_CONFIGS[APP_ROUTES.DASHBOARD])
    }

    // Add current page if it's not dashboard
    if (path !== APP_ROUTES.DASHBOARD && ROUTE_CONFIGS[path]) {
      breadcrumbs.push(ROUTE_CONFIGS[path])
    }

    return breadcrumbs
  }

  static getNavigationItems(): RouteConfig[] {
    return Object.values(ROUTE_CONFIGS).filter((config) => config.requiresAuth && config.icon)
  }
}
