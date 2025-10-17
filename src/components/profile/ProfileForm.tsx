"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useSessionStore } from "@/stores/session.store"
import { useProfileStore } from "@/stores/profile.store"
import type { Profile } from "@/data/schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AvatarUploader } from "@/components/profile/AvatarUploader"
import { showSuccess, showError } from "@/lib/alerts"

const profileFormSchema = z.object({
  kelas: z.string().min(1, "Kelas harus diisi").optional(), // Added kelas field validation
  prodi: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileFormSchema>

interface ProfileFormProps {
  profile?: Profile
  onSuccess?: () => void
}

export function ProfileForm({ profile, onSuccess }: ProfileFormProps) {
  const { session } = useSessionStore()
  const { updateProfile, createProfile } = useProfileStore()

  // Extract angkatan from email
  const getAngkatanFromEmail = (email: string): number => {
    // Extract NIM from email (assuming format: nama.NIM@domain)
    const emailParts = email.split('@')[0]
    const parts = emailParts.split('.')
    
    if (parts.length >= 2) {
      const nim = parts[1]
      // Extract first 2 digits from NIM
      if (nim && nim.length >= 2) {
        const yearPrefix = nim.substring(0, 2)
        const year = parseInt(yearPrefix)
        
        // Convert to full year (22 -> 2022, 20 -> 2020)
        if (!isNaN(year)) {
          return 2000 + year
        }
      }
    }
    
    // Default to current year if cannot extract
    return new Date().getFullYear()
  }

  const angkatan = session ? getAngkatanFromEmail(session.email) : new Date().getFullYear()

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      kelas: profile?.kelas || "", // Added kelas default value
      prodi: profile?.prodi || "",
    },
  })

  const onSubmit = (data: ProfileFormData) => {
    if (!session) return

    try {
      const profileData: Omit<Profile, "userId"> = {
        nim: undefined, // NIM removed from form
        angkatan: angkatan, // Use calculated angkatan from email
        kelas: data.kelas || "A", // Default kelas to "A" if empty for mahasiswa
        prodi: data.prodi || undefined,
        avatarUrl: profile?.avatarUrl,
      }

      if (profile) {
        updateProfile(session.id, profileData)
      } else {
        createProfile({ ...profileData, userId: session.id })
      }

      showSuccess("Profil berhasil disimpan")
      onSuccess?.()
    } catch (error) {
      showError("Terjadi kesalahan saat menyimpan profil")
    }
  }

  const handleAvatarChange = (avatarUrl: string) => {
    if (!session) return

    try {
      const profileData = { avatarUrl }

      if (profile) {
        // Update existing profile
        updateProfile(session.id, profileData)
      } else {
        // Create new profile with minimal required data
        const newProfile = {
          userId: session.id,
          angkatan: angkatan, // Use calculated angkatan from email
          kelas: session.role === "mahasiswa" ? "A" : "DOSEN", // Default based on role
          avatarUrl
        }
        createProfile(newProfile)
      }
      
      // Note: Success message is shown in AvatarUploader component
    } catch (error) {
      showError("Gagal menyimpan avatar. Silakan coba lagi.")
    }
  }

  if (!session) return null

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Avatar</CardTitle>
          <CardDescription>Foto profil Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <AvatarUploader
            currentAvatar={profile?.avatarUrl}
            userName={session.name}
            onAvatarChange={handleAvatarChange}
          />
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Informasi Profil</CardTitle>
          <CardDescription>Kelola informasi pribadi Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input id="name" value={session.name} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Nama tidak dapat diubah</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={session.email} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Email tidak dapat diubah</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="angkatan">Angkatan</Label>
                <Input
                  id="angkatan"
                  type="number"
                  value={angkatan}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Angkatan tidak dapat diubah</p>
              </div>

              {session.role === "mahasiswa" && (
                <div className="space-y-2">
                  <Label htmlFor="kelas">
                    Kelas <span className="text-destructive">*</span>
                  </Label>
                  <Input id="kelas" placeholder="Contoh: A, B, TI-1" {...form.register("kelas")} />
                  {form.formState.errors.kelas && (
                    <p className="text-sm text-destructive">{form.formState.errors.kelas.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Wajib diisi untuk akses KRS</p>
                </div>
              )}

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="prodi">Program Studi</Label>
                <Input id="prodi" placeholder="Contoh: Teknik Informatika" {...form.register("prodi")} />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit">Simpan Profil</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
