"use client"

import { useSessionStore } from "@/stores/session.store"
import { useProfileStore } from "@/stores/profile.store"
import { ProfileForm } from "@/components/profile/ProfileForm"
import { PreferencesCard } from "@/components/profile/PreferencesCard"
import { Badge } from "@/components/ui/badge"

export default function ProfilePage() {
  const { session } = useSessionStore()
  const { getProfile } = useProfileStore()

  if (!session) return null

  const profile = getProfile(session.id)

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "kaprodi":
        return "Kepala Program Studi"
      case "dosen":
        return "Dosen"
      case "mahasiswa":
        return "Mahasiswa"
      default:
        return role
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profil</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-muted-foreground">Kelola informasi pribadi dan preferensi Anda</p>
            <Badge variant={getRoleBadgeVariant(session.role)}>{getRoleLabel(session.role)}</Badge>
          </div>
        </div>
      </div>

      <ProfileForm profile={profile} />

    </div>
  )
}
