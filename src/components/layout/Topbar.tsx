// Topbar.tsx
"use client"

import { cn } from "@/lib/utils"
import { useSessionStore } from "@/stores/session.store"
import { useNavigation } from "@/hooks/useNavigation"
import { Button } from "@/components/ui/button"
import { UserMenu } from "@/components/layout/UserMenu"
import { Moon, Sun, Monitor, ChevronRight, Search, Bell, Sparkles } from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { useState, useEffect } from "react"

export function Topbar() {
  const { session } = useSessionStore()
  const { theme, setTheme } = useTheme()
  const { getBreadcrumbs, getPageTitle } = useNavigation()
  const [searchFocused, setSearchFocused] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark")
    } else if (theme === "dark") {
      setTheme("system")
    } else {
      setTheme("light")
    }
  }

  const getThemeIcon = () => {
    if (!mounted) return <Monitor className="h-4 w-4" />

    switch (theme) {
      case "light":
        return <Sun className="h-4 w-4" />
      case "dark":
        return <Moon className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

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
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9 rounded-lg hover:bg-accent/10 dark:hover:bg-accent/20 transition-all duration-300 relative overflow-hidden group"
            title={`Current theme: ${theme}. Click to switch.`}
          >
            <div className="transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110">
              {getThemeIcon()}
            </div>
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-blue-500/10 group-hover:via-purple-500/10 group-hover:to-pink-500/10 transition-all duration-500" />
          </Button>

          {session && <UserMenu />}
        </div>
      </div>
    </header>
  )
}
