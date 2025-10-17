// Topbar.tsx
"use client"

import { cn } from "@/lib/utils"
import { useSessionStore } from "@/stores/session.store"
import { useNavigation } from "@/hooks/useNavigation"
import { Button } from "@/components/ui/button"
import { UserMenu } from "@/components/layout/UserMenu"
import { ChevronRight, Search, Bell, Sparkles } from "lucide-react"
import ThemeSwitcher from "@/src/components/landing/theme-switcher"
import Link from "next/link"
import { useState, useEffect } from "react"

export function Topbar() {
  const { session } = useSessionStore()
  const { getBreadcrumbs, getPageTitle } = useNavigation()
  const [searchFocused, setSearchFocused] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const breadcrumbs = getBreadcrumbs()

  return (
    <header
      className="
        fixed top-0 left-0 right-0 z-[100]
        h-16 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm 
        border-b border-gray-200 dark:border-gray-700
        transition-all duration-300
        w-full
        sm:pl-16 pl-0
        shadow-sm
      "
    >
      {/* Kontainer dengan lebar penuh tanpa batasan */}
      <div className="h-full flex items-center justify-between px-4 sm:px-6 lg:px-8 max-w-none">
        <div className="flex items-center space-x-6 min-w-0 flex-1">

          {breadcrumbs.length > 0 && (
            <nav className="hidden md:flex items-center space-x-2 text-sm min-w-0 flex-1">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.path} className="flex items-center space-x-2">
                  {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />}
                  <Link
                    href={crumb.path}
                    className="px-2 py-1 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors truncate"
                  >
                    {crumb.title}
                  </Link>
                </div>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <ThemeSwitcher />

          {session && <UserMenu />}
        </div>
      </div>
    </header>
  )
}
