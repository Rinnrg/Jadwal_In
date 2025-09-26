"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useSessionStore } from "@/stores/session.store"
import { getMenuItems } from "@/lib/rbac"
import { useNavigation } from "@/hooks/useNavigation"
import { cn } from "@/lib/utils"
import {
  Home,
  Calendar,
  Bell,
  User,
  BookOpen,
  FileText,
  GraduationCap,
  Edit,
  ChevronLeft,
  Menu,
  Users,
  X,
} from "lucide-react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const iconMap = {
  home: Home,
  calendar: Calendar,
  bell: Bell,
  user: User,
  book: BookOpen,
  "file-text": FileText,
  award: GraduationCap,
  edit: Edit,
  users: Users,
  monitor: BookOpen,
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { session } = useSessionStore()
  const { isActiveRoute } = useNavigation()
  const pathname = usePathname()

  if (!session) return null

  const menuItems = getMenuItems(session.role)

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setDrawerOpen(!drawerOpen)}
        className="
          fixed z-[60] top-4 left-4 p-3 rounded-xl
          sm:hidden
          bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-lg
          hover:bg-white dark:hover:bg-gray-900 hover:shadow-xl hover:scale-105
          active:scale-95
          transition-all duration-300 ease-out
        "
        title="Menu"
        aria-label="Toggle menu"
      >
        <motion.div
          animate={{ rotate: drawerOpen ? 90 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {drawerOpen ? <X className="h-5 w-5 text-gray-700 dark:text-gray-300" /> : <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />}
        </motion.div>
      </button>

      {/* Mobile Dropdown Menu */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="
              fixed top-16 left-4 right-4 z-[110] sm:hidden
              bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl 
              border border-gray-200/50 dark:border-gray-700/50 
              rounded-xl shadow-xl overflow-hidden
            "
          >
            <motion.div
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              exit={{ y: -20 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="px-4 py-6 space-y-2"
            >
              {/* Logo Section */}
              <div className="flex items-center space-x-3 px-3 py-2 mb-4 border-b border-gray-100/50 dark:border-gray-800/50">
                <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <Image 
                    src="/logo jadwal in.svg" 
                    alt="Jadwal.in Logo" 
                    width={24} 
                    height={24}
                    className="w-6 h-6 object-contain"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">Jadwal_in</h3>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">by.Gacor</p>
                </div>
              </div>

              {/* Menu Items */}
              {menuItems.map((item, index) => {
                const Icon = iconMap[item.icon as keyof typeof iconMap] || Home
                const isActive = isActiveRoute(item.path)

                return (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                  >
                    <Link
                      href={item.path}
                      className={cn(
                        "flex items-center px-3 py-3 text-base font-medium rounded-lg transition-colors duration-200 group",
                        isActive
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                          : "text-foreground hover:bg-muted"
                      )}
                      onClick={() => setDrawerOpen(false)}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5 mr-3 transition-colors",
                          isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                        )}
                      />
                      {item.title}
                      {isActive && (
                        <div className="ml-auto">
                          <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full" />
                        </div>
                      )}
                    </Link>
                  </motion.div>
                )
              })}


            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "group fixed left-0 top-16 z-[60] h-[calc(100vh-4rem)] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 shadow-xl transition-all duration-500 ease-out hidden sm:block",
          collapsed ? "w-16" : "w-64"
        )}
        onMouseEnter={() => setCollapsed(false)}
        onMouseLeave={() => setCollapsed(true)}
      >
        <div className="px-4 py-6 border-b border-gray-100/50 dark:border-gray-800/50">
          <div
            className={cn("flex items-center transition-all duration-500 ease-out", collapsed ? "justify-center" : "space-x-3")}
          >
            <div className="w-9 h-9 flex items-center justify-center flex-shrink-0 transition-all duration-300 hover:scale-105 overflow-hidden">
              <Image 
                src="/logo jadwal in.svg" 
                alt="Jadwal.in Logo" 
                width={28} 
                height={28}
                className="w-7 h-7 object-contain"
              />
            </div>
            <div
              className={cn(
                "transition-all duration-500 ease-out overflow-hidden",
                collapsed ? "w-0 opacity-0" : "w-auto opacity-100",
              )}
            >
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Jadwal_in</h3>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">by.Gacor</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col">
          <div className="space-y-1 flex-1">
            {menuItems.map((item, index) => {
              const Icon = iconMap[item.icon as keyof typeof iconMap] || Home
              const isActive = isActiveRoute(item.path)

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    "flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-300 ease-out group/item relative overflow-hidden",
                    isActive
                      ? "bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-800/20 text-blue-700 dark:text-blue-300 shadow-sm border border-blue-200/50 dark:border-blue-700/30"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50/80 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white hover:shadow-sm hover:scale-[1.02]",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 flex-shrink-0 transition-all duration-300",
                      isActive ? "text-blue-600 dark:text-blue-400 scale-110" : "text-gray-500 dark:text-gray-400 group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 group-hover/item:scale-105",
                    )}
                  />

                  <span
                    className={cn(
                      "ml-3 transition-all duration-500 ease-out truncate",
                      collapsed ? "w-0 opacity-0" : "w-auto opacity-100",
                    )}
                  >
                    {item.title}
                  </span>

                  {isActive && !collapsed && (
                    <div className="ml-auto">
                      <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse" />
                    </div>
                  )}
                  
                  {isActive && (
                    <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-blue-500 to-blue-600 rounded-r-full" />
                  )}
                </Link>
              )
            })}
          </div>


        </nav>
      </aside>
    </>
  )
}
