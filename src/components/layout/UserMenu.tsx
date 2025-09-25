"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { useSessionStore } from "@/stores/session.store"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { LogOut, User, ChevronDown } from "lucide-react"
import { confirmAction } from "@/lib/alerts"

export function UserMenu() {
  const router = useRouter()
  const { session, logout } = useSessionStore()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        buttonRef.current?.focus()
      }
      
      if (isOpen && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
        event.preventDefault()
        const menuItems = dropdownRef.current?.querySelectorAll('[role="menuitem"]')
        if (menuItems && menuItems.length > 0) {
          const currentIndex = Array.from(menuItems).findIndex(item => item === document.activeElement)
          let nextIndex = 0
          
          if (event.key === 'ArrowDown') {
            nextIndex = currentIndex < menuItems.length - 1 ? currentIndex + 1 : 0
          } else {
            nextIndex = currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1
          }
          
          (menuItems[nextIndex] as HTMLElement).focus()
        }
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [isOpen])

  if (!session) return null

  const handleLogout = async () => {
    const confirmed = await confirmAction("Keluar dari Sistem", "Apakah Anda yakin ingin keluar?", "Ya, Keluar")

    if (confirmed) {
      logout()
      // Force a hard redirect to login page
      window.location.href = "/login"
    }
    setIsOpen(false)
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "kaprodi":
        return "default"
      case "dosen":
        return "secondary"
      case "mahasiswa":
        return "outline"
      default:
        return "outline"
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "kaprodi":
        return "Kaprodi"
      case "dosen":
        return "Dosen"
      case "mahasiswa":
        return "Mahasiswa"
      default:
        return role
    }
  }

  return (
    <div className="relative z-[120]" ref={dropdownRef}>
      <Button
        ref={buttonRef}
        variant="ghost"
        className="relative flex items-center space-x-2 h-9 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <Avatar className="h-7 w-7">
          <AvatarImage src={session.image || "/placeholder.svg"} alt={session.name} />
          <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            {session.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div 
          className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-[130] overflow-hidden origin-top-right animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
          role="menu"
          aria-orientation="vertical"
        >
          {/* Profile Header */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={session.image || "/placeholder.svg"} alt={session.name} />
                <AvatarFallback className="text-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  {session.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-1 min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{session.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{session.email}</p>
                <Badge variant={getRoleBadgeVariant(session.role)} className="w-fit text-xs">
                  {getRoleLabel(session.role)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <Link
              href="/profile"
              className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer group"
              onClick={() => setIsOpen(false)}
              role="menuitem"
            >
              <User className="mr-3 h-4 w-4 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors" />
              <span className="font-medium">Profil Saya</span>
            </Link>
            
            <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 transition-colors cursor-pointer text-left group"
              role="menuitem"
            >
              <LogOut className="mr-3 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              <span className="font-medium">Keluar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
