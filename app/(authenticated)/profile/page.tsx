"use client"

import { useState } from "react"
import { useSessionStore } from "@/stores/session.store"
import { useProfileStore } from "@/stores/profile.store"
import { ProfileForm } from "@/components/profile/ProfileForm"
import { PreferencesCard } from "@/components/profile/PreferencesCard"
import { ChangePasswordCard } from "@/components/profile/ChangePasswordCard"
import { SetPasswordCard } from "@/components/profile/SetPasswordCard"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"

export default function ProfilePage() {
  const { session } = useSessionStore()
  const { getProfile } = useProfileStore()
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showSetPassword, setShowSetPassword] = useState(false)

  if (!session) return null

  const profile = getProfile(session.id)

  return (
    <div className="space-y-4 md:space-y-6 px-2 md:px-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">Profil</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">Kelola informasi pribadi dan preferensi Anda</p>
        </div>
      </div>

      <ProfileForm 
        profile={profile} 
        onChangePassword={() => setShowChangePassword(true)}
        onSetPassword={() => setShowSetPassword(true)}
      />

      {/* Dialog Change Password */}
      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <DialogContent className="sm:max-w-md">
          <ChangePasswordCard onSuccess={() => setShowChangePassword(false)} />
        </DialogContent>
      </Dialog>

      {/* Dialog Set Password */}
      <Dialog open={showSetPassword} onOpenChange={setShowSetPassword}>
        <DialogContent className="sm:max-w-md">
          <SetPasswordCard onSuccess={() => setShowSetPassword(false)} />
        </DialogContent>
      </Dialog>

    </div>
  )
}
