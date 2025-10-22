"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSessionStore } from "@/stores/session.store"
import { useProfileStore } from "@/stores/profile.store"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { LogOut, User, ChevronDown } from "lucide-react"
import { confirmAction } from "@/lib/alerts"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function UserMenu() {
  const router = useRouter()
  const { session, logout } = useSessionStore()
  const { getProfile } = useProfileStore()

  if (!session) return null

  const profile = getProfile(session.id)
  // Use session.image as primary source (synced from profile), fallback to profile
  const avatarUrl = session.image || profile?.avatarUrl

  const handleLogout = async () => {
    const confirmed = await confirmAction("Keluar dari Sistem", "Apakah Anda yakin ingin keluar?", "Ya, Keluar")

    if (confirmed) {
      logout()
      // Force a hard redirect to login page
      window.location.href = "/login"
    }
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
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className="relative flex items-center space-x-2 h-9 px-2 rounded-lg hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
        <Avatar className="h-7 w-7" key={avatarUrl}>
          <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={session.name} />
          <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            {session.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <ChevronDown className="h-3 w-3 transition-transform duration-200" />
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        className="w-64 z-[110]" 
        side="bottom"
        align="start"
        sideOffset={8}
        alignOffset={0}
      >
        {/* Profile Header */}
        <DropdownMenuLabel className="p-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10" key={avatarUrl}>
              <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={session.name} />
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
              <p className="text-sm font-semibold truncate">{session.name}</p>
              <p className="text-xs text-muted-foreground truncate">{session.email}</p>
              <Badge variant={getRoleBadgeVariant(session.role)} className="w-fit text-xs">
                {getRoleLabel(session.role)}
              </Badge>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Menu Items */}
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Profil Saya</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          onClick={handleLogout}
          className="cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Keluar</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
