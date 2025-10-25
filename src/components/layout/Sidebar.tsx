"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useSessionStore } from "@/stores/session.store"
import { getMenuItems, type ExtendedRouteConfig } from "@/lib/rbac"
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
  ChevronDown,
  Monitor,
  Library,
  UserCog,
  Settings,
  Megaphone,
} from "lucide-react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNotificationStore } from "@/stores/notification.store"
import { NotificationBadge } from "@/components/ui/NotificationBadge"

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
  monitor: Monitor,
  library: Library,
  "user-cog": UserCog,
  settings: Settings,
  megaphone: Megaphone,
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [openDropdowns, setOpenDropdowns] = useState<string[]>([])
  const { session } = useSessionStore()
  const { isActiveRoute } = useNavigation()
  const pathname = usePathname()
  const { getBadgeCount, hasUnread, markAsRead } = useNotificationStore()

  if (!session) return null

  const menuItems = getMenuItems(session.role)

  // Helper function to get badge count for menu item
  const getMenuBadgeCount = (path: string): number => {
    if (!session) return 0
    
    if (path.includes("/krs")) return getBadgeCount("krs", session.id)
    if (path.includes("/jadwal")) return getBadgeCount("jadwal", session.id)
    if (path.includes("/asynchronous")) return getBadgeCount("asynchronous", session.id)
    if (path.includes("/khs")) return getBadgeCount("khs", session.id)
    if (path.includes("/reminders")) return getBadgeCount("reminder", session.id)
    
    return 0
  }

  // Helper function to mark badge as read when menu is clicked
  const handleMenuClick = (path: string) => {
    if (!session) return
    
    if (path.includes("/krs")) markAsRead("krs", session.id)
    if (path.includes("/jadwal")) markAsRead("jadwal", session.id)
    if (path.includes("/asynchronous")) markAsRead("asynchronous", session.id)
    if (path.includes("/khs")) markAsRead("khs", session.id)
    if (path.includes("/reminders")) markAsRead("reminder", session.id)
  }

  const toggleDropdown = (path: string) => {
    setOpenDropdowns(prev => 
      prev.includes(path) 
        ? prev.filter(p => p !== path)
        : [...prev, path]
    )
  }

  const isDropdownActive = (item: ExtendedRouteConfig) => {
    if (!item.children) return false
    return item.children.some(child => isActiveRoute(child.path))
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setDrawerOpen(!drawerOpen)}
        className="
          fixed z-[110] top-1/2 -translate-y-1/2 left-4 p-3 rounded-xl
          sm:hidden
          bg-transparent
          hover:scale-105
          active:scale-95
          transition-all duration-300 ease-out
        "
        style={{ top: '2rem' }}
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
              fixed top-16 left-4 right-4 z-[120] sm:hidden
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
                    alt="jadwal_in Logo" 
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
                const isDropdownOpen = openDropdowns.includes(item.path)
                const hasDropdownActive = isDropdownActive(item)
                const badgeCount = getMenuBadgeCount(item.path)

                return (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                  >
                    {item.isDropdown ? (
                      <div>
                        <button
                          onClick={() => toggleDropdown(item.path)}
                          className={cn(
                            "flex items-center w-full px-3 py-3 text-base font-medium rounded-lg transition-colors duration-200 group",
                            hasDropdownActive
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                              : "text-foreground hover:bg-muted"
                          )}
                        >
                          <div className="relative">
                            <Icon
                              className={cn(
                                "h-5 w-5 mr-3 transition-colors",
                                hasDropdownActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                              )}
                            />
                            {badgeCount > 0 && <NotificationBadge count={badgeCount} />}
                          </div>
                          {item.title}
                          <ChevronDown
                            className={cn(
                              "ml-auto h-4 w-4 transition-transform duration-200",
                              isDropdownOpen ? "rotate-180" : "rotate-0"
                            )}
                          />
                        </button>
                        <AnimatePresence>
                          {isDropdownOpen && item.children && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="ml-6 mt-1 space-y-1"
                            >
                              {item.children.map((child) => {
                                const ChildIcon = iconMap[child.icon as keyof typeof iconMap] || Home
                                const isChildActive = isActiveRoute(child.path)
                                const childBadgeCount = getMenuBadgeCount(child.path)

                                return (
                                  <Link
                                    key={child.path}
                                    href={child.path}
                                    className={cn(
                                      "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 group",
                                      isChildActive
                                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                                        : "text-foreground hover:bg-muted"
                                    )}
                                    onClick={() => {
                                      handleMenuClick(child.path)
                                      setDrawerOpen(false)
                                    }}
                                  >
                                    <div className="relative">
                                      <ChildIcon
                                        className={cn(
                                          "h-4 w-4 mr-3 transition-colors",
                                          isChildActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                                        )}
                                      />
                                      {childBadgeCount > 0 && <NotificationBadge count={childBadgeCount} />}
                                    </div>
                                    {child.title}
                                    {isChildActive && (
                                      <div className="ml-auto">
                                        <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full" />
                                      </div>
                                    )}
                                  </Link>
                                )
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <Link
                        href={item.path}
                        className={cn(
                          "flex items-center px-3 py-3 text-base font-medium rounded-lg transition-colors duration-200 group",
                          isActive
                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                            : "text-foreground hover:bg-muted"
                        )}
                        onClick={() => {
                          handleMenuClick(item.path)
                          setDrawerOpen(false)
                        }}
                      >
                        <div className="relative">
                          <Icon
                            className={cn(
                              "h-5 w-5 mr-3 transition-colors",
                              isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                            )}
                          />
                          {badgeCount > 0 && <NotificationBadge count={badgeCount} />}
                        </div>
                        {item.title}
                        {isActive && (
                          <div className="ml-auto">
                            <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full" />
                          </div>
                        )}
                      </Link>
                    )}
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
          "group fixed left-0 top-16 z-[90] h-[calc(100vh-4rem)] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 shadow-xl transition-all duration-500 ease-out hidden sm:block",
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
                alt="jadwal_in Logo" 
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
              const isDropdownOpen = openDropdowns.includes(item.path)
              const hasDropdownActive = isDropdownActive(item)
              const badgeCount = getMenuBadgeCount(item.path)

              return (
                <div key={item.path}>
                  {item.isDropdown ? (
                    <div>
                      <button
                        onClick={() => toggleDropdown(item.path)}
                        className={cn(
                          "flex items-center w-full px-3 py-3 text-sm font-medium rounded-xl transition-all duration-300 ease-out group/item relative overflow-hidden",
                          hasDropdownActive
                            ? "bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-800/20 text-blue-700 dark:text-blue-300 shadow-sm border border-blue-200/50 dark:border-blue-700/30"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50/80 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white hover:shadow-sm hover:scale-[1.02]",
                        )}
                      >
                        <div className="relative">
                          <Icon
                            className={cn(
                              "h-5 w-5 flex-shrink-0 transition-all duration-300",
                              hasDropdownActive ? "text-blue-600 dark:text-blue-400 scale-110" : "text-gray-500 dark:text-gray-400 group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 group-hover/item:scale-105",
                            )}
                          />
                          {badgeCount > 0 && <NotificationBadge count={badgeCount} />}
                        </div>

                        <span
                          className={cn(
                            "ml-3 transition-all duration-500 ease-out truncate",
                            collapsed ? "w-0 opacity-0" : "w-auto opacity-100",
                          )}
                        >
                          {item.title}
                        </span>

                        {!collapsed && (
                          <ChevronDown
                            className={cn(
                              "ml-auto h-4 w-4 transition-all duration-300",
                              isDropdownOpen ? "rotate-180" : "rotate-0",
                              hasDropdownActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
                            )}
                          />
                        )}

                        {hasDropdownActive && !collapsed && (
                          <div className="ml-auto mr-6">
                            <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse" />
                          </div>
                        )}
                        
                        {hasDropdownActive && (
                          <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-blue-500 to-blue-600 rounded-r-full" />
                        )}
                      </button>

                      <AnimatePresence>
                        {isDropdownOpen && !collapsed && item.children && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="ml-4 mt-1 space-y-1"
                          >
                            {item.children.map((child) => {
                              const ChildIcon = iconMap[child.icon as keyof typeof iconMap] || Home
                              const isChildActive = isActiveRoute(child.path)
                              const childBadgeCount = getMenuBadgeCount(child.path)

                              return (
                                <Link
                                  key={child.path}
                                  href={child.path}
                                  className={cn(
                                    "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 ease-out group/child relative overflow-hidden",
                                    isChildActive
                                      ? "bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-800/20 text-blue-700 dark:text-blue-300 shadow-sm border border-blue-200/50 dark:border-blue-700/30"
                                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50/60 dark:hover:bg-gray-800/30 hover:text-gray-900 dark:hover:text-white hover:shadow-sm hover:scale-[1.02]",
                                  )}
                                  onClick={() => handleMenuClick(child.path)}
                                >
                                  <div className="relative">
                                    <ChildIcon
                                      className={cn(
                                        "h-4 w-4 flex-shrink-0 transition-all duration-300",
                                        isChildActive ? "text-blue-600 dark:text-blue-400 scale-110" : "text-gray-500 dark:text-gray-400 group-hover/child:text-blue-600 dark:group-hover/child:text-blue-400 group-hover/child:scale-105",
                                      )}
                                    />
                                    {childBadgeCount > 0 && <NotificationBadge count={childBadgeCount} />}
                                  </div>

                                  <span className="ml-3 transition-all duration-300 truncate">
                                    {child.title}
                                  </span>

                                  {isChildActive && (
                                    <div className="ml-auto">
                                      <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse" />
                                    </div>
                                  )}
                                  
                                  {isChildActive && (
                                    <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-blue-500 to-blue-600 rounded-r-full" />
                                  )}
                                </Link>
                              )
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <Link
                      href={item.path}
                      className={cn(
                        "flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-300 ease-out group/item relative overflow-hidden",
                        isActive
                          ? "bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-800/20 text-blue-700 dark:text-blue-300 shadow-sm border border-blue-200/50 dark:border-blue-700/30"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50/80 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white hover:shadow-sm hover:scale-[1.02]",
                      )}
                      onClick={() => handleMenuClick(item.path)}
                    >
                      <div className="relative">
                        <Icon
                          className={cn(
                            "h-5 w-5 flex-shrink-0 transition-all duration-300",
                            isActive ? "text-blue-600 dark:text-blue-400 scale-110" : "text-gray-500 dark:text-gray-400 group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 group-hover/item:scale-105",
                          )}
                        />
                        {badgeCount > 0 && <NotificationBadge count={badgeCount} />}
                      </div>

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
                  )}
                </div>
              )
            })}
          </div>


        </nav>
      </aside>
    </>
  )
}
