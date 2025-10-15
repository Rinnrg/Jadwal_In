"use client"

import { useSessionStore } from "@/stores/session.store"
import { useProfileStore } from "@/stores/profile.store"
import { ProfileForm } from "@/components/profile/ProfileForm"
import { PreferencesCard } from "@/components/profile/PreferencesCard"

export default function ProfilePage() {
  const { session } = useSessionStore()
  const { getProfile } = useProfileStore()

  if (!session) return null

  const profile = getProfile(session.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profil</h1>
          <p className="text-muted-foreground mt-1">Kelola informasi pribadi dan preferensi Anda</p>
        </div>
      </div>

      <ProfileForm profile={profile} />

    </div>
  )
}
