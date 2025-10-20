"use client"

import { usePathname, useRouter } from "next/navigation"
import { NavigationHelper } from "@/lib/navigation"
import { APP_ROUTES } from "@/config/routes"

export function useNavigation() {
  const pathname = usePathname()
  const router = useRouter()

  const navigateTo = (path: string) => {
    router.push(path)
  }

  const isCurrentRoute = (path: string) => {
    return NavigationHelper.isCurrentRoute(pathname, path)
  }

  const isActiveRoute = (path: string) => {
    return NavigationHelper.isActiveRoute(pathname, path)
  }

  const getPageTitle = () => {
    return NavigationHelper.getPageTitle(pathname)
  }

  const getPageDescription = () => {
    return NavigationHelper.getPageDescription(pathname)
  }

  const getBreadcrumbs = () => {
    return NavigationHelper.getBreadcrumbs(pathname)
  }

  const getNavigationItems = () => {
    return NavigationHelper.getNavigationItems()
  }

  return {
    pathname,
    navigateTo,
    isCurrentRoute,
    isActiveRoute,
    getPageTitle,
    getPageDescription,
    getBreadcrumbs,
    getNavigationItems,
    routes: APP_ROUTES,
  }
}
