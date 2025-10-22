"use client"

import { useState } from "react"
import { useSessionStore } from "@/stores/session.store"
import { useProfileStore } from "@/stores/profile.store"
import { ProfileForm } from "@/components/profile/ProfileForm"
import { PreferencesCard } from "@/components/profile/PreferencesCard"
import { ChangePasswordCard } from "@/components/profile/ChangePasswordCard"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"

export default function ProfilePage() {
  const { session } = useSessionStore()
  const { getProfile } = useProfileStore()
  const [showChangePassword, setShowChangePassword] = useState(false)

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

      <ProfileForm 
        profile={profile} 
        onChangePassword={() => setShowChangePassword(true)}
      />

      {/* Dialog Change Password */}
      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <DialogContent className="sm:max-w-md">
          <ChangePasswordCard onSuccess={() => setShowChangePassword(false)} />
        </DialogContent>
      </Dialog>

    </div>
  )
}
