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
  nim: z.string().optional(),
  angkatan: z.number().min(2000, "Angkatan minimal 2000").max(2030, "Angkatan maksimal 2030"),
  kelas: z.string().min(1, "Kelas harus diisi").optional(), // Added kelas field validation
  prodi: z.string().optional(),
  bio: z.string().optional(),
  website: z.string().url("URL tidak valid").optional().or(z.literal("")),
})

type ProfileFormData = z.infer<typeof profileFormSchema>

interface ProfileFormProps {
  profile?: Profile
  onSuccess?: () => void
}

export function ProfileForm({ profile, onSuccess }: ProfileFormProps) {
  const { session } = useSessionStore()
  const { updateProfile, createProfile } = useProfileStore()

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      nim: profile?.nim || "",
      angkatan: profile?.angkatan || new Date().getFullYear(),
      kelas: profile?.kelas || "", // Added kelas default value
      prodi: profile?.prodi || "",
      bio: profile?.bio || "",
      website: profile?.website || "",
    },
  })

  const onSubmit = (data: ProfileFormData) => {
    if (!session) return

    try {
      const profileData: Omit<Profile, "userId"> = {
        nim: data.nim || undefined,
        angkatan: data.angkatan,
        kelas: data.kelas || "A", // Default kelas to "A" if empty for mahasiswa
        prodi: data.prodi || undefined,
        bio: data.bio || undefined,
        website: data.website || undefined,
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
          angkatan: new Date().getFullYear(),
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

              {session.role === "mahasiswa" && (
                <div className="space-y-2">
                  <Label htmlFor="nim">NIM</Label>
                  <Input id="nim" placeholder="Contoh: 2022001" {...form.register("nim")} />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="angkatan">
                  Angkatan {session.role === "mahasiswa" && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="angkatan"
                  type="number"
                  min="2000"
                  max="2030"
                  {...form.register("angkatan", { valueAsNumber: true })}
                />
                {form.formState.errors.angkatan && (
                  <p className="text-sm text-destructive">{form.formState.errors.angkatan.message}</p>
                )}
                {session.role === "mahasiswa" && (
                  <p className="text-xs text-muted-foreground">Wajib diisi untuk akses KRS</p>
                )}
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

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="website">Website/Portfolio</Label>
                <Input id="website" type="url" placeholder="https://..." {...form.register("website")} />
                {form.formState.errors.website && (
                  <p className="text-sm text-destructive">{form.formState.errors.website.message}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Ceritakan sedikit tentang diri Anda..."
                  rows={3}
                  {...form.register("bio")}
                />
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
