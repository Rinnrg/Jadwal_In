"use client"

import { useState } from "react"
import { useSessionStore } from "@/stores/session.store"
import { useProfileStore } from "@/stores/profile.store"
import type { Profile } from "@/data/schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AvatarUploader } from "@/components/profile/AvatarUploader"
import { EKTMDialog } from "@/components/profile/EKTMDialog"
import { showSuccess, showError } from "@/lib/alerts"
import { Lock, IdCard } from "lucide-react"

interface ProfileFormProps {
  profile?: Profile
  onSuccess?: () => void
  onChangePassword?: () => void
}

export function ProfileForm({ profile, onSuccess, onChangePassword }: ProfileFormProps) {
  const { session } = useSessionStore()
  const { updateProfile, createProfile } = useProfileStore()
  const [showEKTM, setShowEKTM] = useState(false)

  // Helper untuk extract NIM dari email
  const getNIMFromEmail = (email: string): string | undefined => {
    // Format email: namapertamanamakedua.22002@mhs.unesa.ac.id
    // Dari .22002 kita extract: tahun(22) + nomor urut(002)
    // NIM lengkap: tahun(22) + fakultas(05) + prodi(0974) + urut(002) = 22050974002
    const emailParts = email.split('@')[0]
    const parts = emailParts.split('.')
    
    if (parts.length >= 2) {
      const nimPart = parts[1] // "22002"
      if (nimPart && nimPart.length >= 5) {
        // Extract tahun (2 digit pertama) dan nomor urut (3 digit terakhir)
        const tahun = nimPart.substring(0, 2) // "22"
        const nomorUrut = nimPart.substring(2) // "002"
        
        // Reconstruct NIM lengkap dengan fakultas dan prodi default
        const kodeFakultas = "05"
        const kodeProdi = "0974"
        
        return `${tahun}${kodeFakultas}${kodeProdi}${nomorUrut}` // "22050974002"
      }
    }
    return undefined
  }

  // Get NIM dari profile atau email
  const currentNIM = profile?.nim || getNIMFromEmail(session?.email || "")

  // Helper untuk mendapatkan fakultas dari NIM
  const getFakultasFromNIM = (nim?: string): string => {
    if (!nim || nim.length < 4) return "-"
    const kodeFakultas = nim.substring(2, 4)
    
    // Map kode fakultas
    const fakultasMap: Record<string, string> = {
      "05": "Fakultas Teknik",
      // Tambahkan mapping fakultas lain jika diperlukan
    }
    
    return fakultasMap[kodeFakultas] || "-"
  }

  // Helper untuk mendapatkan program studi dari NIM
  const getProdiFromNIM = (nim?: string): string => {
    if (!nim || nim.length < 8) return "-"
    const kodeProdi = nim.substring(4, 8)
    
    // Map kode prodi
    const prodiMap: Record<string, string> = {
      "0974": "S1 Pendidikan Teknologi Informasi",
      // Tambahkan mapping prodi lain jika diperlukan
    }
    
    return prodiMap[kodeProdi] || "-"
  }

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
    <>
      <EKTMDialog
        open={showEKTM}
        onOpenChange={setShowEKTM}
        name={session.name}
        nim={currentNIM || ""}
        fakultas={getFakultasFromNIM(currentNIM)}
        programStudi={getProdiFromNIM(currentNIM)}
        avatarUrl={profile?.avatarUrl}
      />
      
      <div className="grid gap-6 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Avatar</CardTitle>
          <CardDescription>Foto profil Anda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AvatarUploader
            currentAvatar={profile?.avatarUrl}
            userName={session.name}
            onAvatarChange={handleAvatarChange}
          />
          
          {/* E-KTM Button */}
          {session.role === "mahasiswa" && currentNIM && (
            <div className="space-y-2">
              <Button
                type="button"
                variant="default"
                className="w-full"
                onClick={() => setShowEKTM(true)}
                disabled={!profile?.avatarUrl}
              >
                <IdCard className="h-4 w-4 mr-2" />
                Lihat E-KTM
              </Button>
              {!profile?.avatarUrl && (
                <p className="text-xs text-center text-muted-foreground">
                  Unggah foto profil terlebih dahulu untuk melihat E-KTM
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Informasi Profil</CardTitle>
          <CardDescription>Kelola informasi pribadi Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
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

              {currentNIM && (
                <div className="space-y-2">
                  <Label htmlFor="nim">NIM</Label>
                  <Input
                    id="nim"
                    value={currentNIM}
                    disabled
                    className="bg-muted font-mono"
                  />
                  <p className="text-xs text-muted-foreground">NIM tidak dapat diubah</p>
                </div>
              )}

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

              <div className="space-y-2">
                <Label htmlFor="fakultas">Fakultas</Label>
                <Input
                  id="fakultas"
                  value={getFakultasFromNIM(currentNIM)}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Fakultas tidak dapat diubah</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prodi">Program Studi</Label>
                <Input
                  id="prodi"
                  value={getProdiFromNIM(currentNIM)}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Program Studi tidak dapat diubah</p>
              </div>
            </div>

            <div className="flex justify-start items-center pt-2">
              <Button 
                type="button" 
                variant="outline"
                onClick={onChangePassword}
                className="cursor-pointer"
              >
                <Lock className="h-4 w-4 mr-2" />
                Ganti Password
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </>
  )
}
