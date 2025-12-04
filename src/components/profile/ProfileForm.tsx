"use client"

import { useState, useEffect, useRef } from "react"
import { useSessionStore } from "@/stores/session.store"
import { useProfileStore } from "@/stores/profile.store"
import type { Profile } from "@/data/schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AvatarUploader } from "@/components/profile/AvatarUploader"
import { EKTMFullView } from "@/components/profile/EKTMFullView"
import { showSuccess, showError } from "@/lib/alerts"
import { ActivityLogger } from "@/lib/activity-logger"
import { Lock, IdCard, Edit2, Check, X, KeyRound, Phone, Plus, Trash2, Upload } from "lucide-react"

// Simple gender detection fallback
function detectGenderFromNameSimple(name: string): string | null {
  if (!name) return null
  const lowerName = name.toLowerCase()
  
  // Common male indicators
  const maleNames = ['ahmad', 'muhammad', 'budi', 'andi', 'agus', 'dedi', 'rino', 'raihan']
  const maleEndings = ['wan', 'man', 'din']
  
  // Common female indicators  
  const femaleNames = ['siti', 'nur', 'dewi', 'putri', 'ayu', 'ratna']
  const femaleEndings = ['wati', 'ningsih', 'yani', 'yanti', 'tun', 'ni', 'tika']
  
  // Check male patterns
  if (lowerName.startsWith('muhammad ') || lowerName.startsWith('ahmad ')) return 'Laki - Laki'
  if (maleNames.some(n => lowerName.includes(n))) return 'Laki - Laki'
  if (maleEndings.some(e => lowerName.endsWith(e))) return 'Laki - Laki'
  
  // Check female patterns
  if (lowerName.startsWith('siti ') || lowerName.startsWith('dewi ') || lowerName.startsWith('putri ')) return 'Perempuan'
  if (femaleNames.some(n => lowerName.includes(n))) return 'Perempuan'
  if (femaleEndings.some(e => lowerName.endsWith(e))) return 'Perempuan'
  
  return null
}

interface ProfileFormProps {
  profile?: any // API returns extended profile with User fields (nim, angkatan, avatarUrl)
  onSuccess?: () => void
  onChangePassword?: () => void
  onSetPassword?: () => void
}

export function ProfileForm({ profile, onSuccess, onChangePassword, onSetPassword }: ProfileFormProps) {
  const { session, updateSessionImage } = useSessionStore()
  const { updateProfile, createProfile } = useProfileStore()
  const [showEKTM, setShowEKTM] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(session?.name || "")
  const [isSaving, setIsSaving] = useState(false)
  const [hasPassword, setHasPassword] = useState<boolean | null>(null)
  const [isCheckingPassword, setIsCheckingPassword] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Phone state - using phoneNumber from User model
  const [phoneInput, setPhoneInput] = useState(profile?.phoneNumber || "")
  const [isEditingPhone, setIsEditingPhone] = useState(false)
  const [isSavingPhone, setIsSavingPhone] = useState(false)
  
  // Gender state
  const [isEditingGender, setIsEditingGender] = useState(false)
  const [editedGender, setEditedGender] = useState("")
  const [isSavingGender, setIsSavingGender] = useState(false)

  // Check if user has password
  useEffect(() => {
    const checkPassword = async () => {
      if (!session) return
      
      try {
        const response = await fetch(`/api/users/check-password?userId=${session.id}`)
        if (response.ok) {
          const data = await response.json()
          setHasPassword(data.hasPassword)
        }
      } catch (error) {
        console.error('Error checking password:', error)
      } finally {
        setIsCheckingPassword(false)
      }
    }
    
    checkPassword()
  }, [session])

  // Sync phoneInput when profile changes
  useEffect(() => {
    if (profile?.phoneNumber) {
      setPhoneInput(profile.phoneNumber)
    }
  }, [profile?.phoneNumber])

  // Auto-sync data from multi-source when profile loads - RUN ONCE per session
  useEffect(() => {
    const syncData = async () => {
      if (!session || session.role !== 'mahasiswa') return
      
      // Check if we've already synced in this session to prevent infinite loop
      const syncKey = `profile_synced_${session.id}`
      const lastSync = sessionStorage.getItem(syncKey)
      const now = Date.now()
      
      // Only sync if we haven't synced in the last 5 minutes
      if (lastSync && now - parseInt(lastSync) < 5 * 60 * 1000) {
        console.log('[ProfileForm] Skipping sync - recently synced')
        return
      }
      
      try {
        console.log('[ProfileForm] Auto-syncing data using multi-source for:', session.email)
        const response = await fetch('/api/profile/sync-nim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: session.id,
            email: session.email
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('[ProfileForm] Sync response:', data)
          
          // Mark as synced
          sessionStorage.setItem(syncKey, now.toString())
          
          // Reload ONLY if data was updated AND we're not in a reload loop
          if (data.updated && !sessionStorage.getItem('reload_pending')) {
            console.log('[ProfileForm] Data updated, reloading in 1.5s...')
            sessionStorage.setItem('reload_pending', 'true')
            setTimeout(() => {
              sessionStorage.removeItem('reload_pending')
              window.location.reload()
            }, 1500)
          } else {
            console.log('[ProfileForm] Data already up-to-date')
          }
        } else {
          const errorData = await response.json()
          console.error('[ProfileForm] Sync failed:', errorData)
        }
      } catch (error) {
        console.error('[ProfileForm] Error syncing data:', error)
      }
    }
    
    // Run sync after component mounts
    const timer = setTimeout(syncData, 500)
    return () => clearTimeout(timer)
  }, [session])

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

  // Helper untuk mendapatkan fakultas dari NIM (fallback only)
  const getFakultasFromNIM = (nim?: string): string => {
    if (!nim || nim.length < 4) return "-"
    const kodeFakultas = nim.substring(2, 4)
    
    // Map kode fakultas
    const fakultasMap: Record<string, string> = {
      "05": "Fakultas Teknik",
      "01": "Fakultas Ilmu Pendidikan",
      "02": "Fakultas Bahasa dan Seni",
      "03": "Fakultas MIPA",
      "04": "Fakultas Ilmu Sosial dan Hukum",
      "06": "Fakultas Ilmu Keolahragaan",
      "07": "Fakultas Ekonomi dan Bisnis",
      "08": "Fakultas Vokasi",
      // Tambahkan mapping fakultas lain jika diperlukan
    }
    
    return fakultasMap[kodeFakultas] || "-"
  }

  // Helper untuk mendapatkan program studi dari NIM (fallback only)
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

  // Helper to get angkatan - prioritize database value
  const getAngkatan = (): number | string => {
    // Priority 1: Database field
    if (profile?.angkatan) {
      return profile.angkatan
    }
    
    // Priority 2: Extract from semesterAwal
    if (profile?.semesterAwal) {
      const match = profile.semesterAwal.match(/(\d{4})/)
      if (match) {
        return parseInt(match[1])
      }
    }
    
    // Priority 3: Extract from NIM
    if (currentNIM && currentNIM.length >= 2) {
      const yearPrefix = currentNIM.substring(0, 2)
      const year = parseInt(yearPrefix)
      if (!isNaN(year) && year >= 0 && year <= 99) {
        return 2000 + year
      }
    }
    
    // Priority 4: Extract from email
    if (session?.email) {
      const emailParts = session.email.split('@')[0]
      const parts = emailParts.split('.')
      
      if (parts.length >= 2) {
        const nim = parts[1]
        if (nim && nim.length >= 2) {
          const yearPrefix = nim.substring(0, 2)
          const year = parseInt(yearPrefix)
          
          if (!isNaN(year) && year >= 0 && year <= 99) {
            return 2000 + year
          }
        }
      }
    }
    
    // Default
    return "-"
  }

  const angkatan = getAngkatan()

  // Helper to get Fakultas - prioritize database/extracted from prodi
  const getFakultas = (): string => {
    // If prodi contains fakultas info, extract it
    if (profile?.prodi) {
      // Some prodi names include fakultas info
      if (profile.prodi.toLowerCase().includes('teknik')) return "Fakultas Teknik"
      if (profile.prodi.toLowerCase().includes('pendidikan')) {
        if (profile.prodi.toLowerCase().includes('ilmu pengetahuan') || 
            profile.prodi.toLowerCase().includes('mipa')) {
          return "Fakultas MIPA"
        }
        return "Fakultas Ilmu Pendidikan"
      }
    }
    
    // Fallback to NIM-based extraction
    return getFakultasFromNIM(currentNIM)
  }

  // Helper to get Prodi - prioritize database field
  const getProdi = (): string => {
    // Priority 1: Database field from pd-unesa
    if (profile?.prodi) {
      return profile.prodi
    }
    
    // Priority 2: Extract from NIM
    return getProdiFromNIM(currentNIM)
  }

  // Get current avatar from session or profile (session.image is synced from profile)
  const currentAvatar = session?.image || profile?.avatarUrl
  
  // Enhanced debug logging
  console.log('=== ProfileForm Avatar Debug ===')
  console.log('session.image:', session?.image?.substring(0, 100) || 'null')
  console.log('profile.avatarUrl:', profile?.avatarUrl?.substring(0, 100) || 'null')
  console.log('currentAvatar:', currentAvatar?.substring(0, 100) || 'null')
  console.log('Is base64?', currentAvatar?.startsWith('data:'))
  console.log('================================')

  const handleAvatarChange = async (avatarUrl: string) => {
    if (!session) return

    try {
      // Update profile via API
      const response = await fetch(`/api/profile/${session.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ avatarUrl }),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      const { profile: updatedProfile } = await response.json()

      // Note: All fields now in User model, no separate Profile table
      // Update session image for immediate UI update
      updateSessionImage(avatarUrl)
      
      // Log activity
      ActivityLogger.profilePictureUpdated(session.id)
      
      // Note: Success message is shown in AvatarUploader component
    } catch (error) {
      console.error('Avatar update error:', error)
      showError("Gagal menyimpan avatar. Silakan coba lagi.")
    }
  }

  const handleSaveName = async () => {
    if (!session || !editedName.trim()) return

    try {
      setIsSaving(true)
      
      // Update profile via API
      const response = await fetch(`/api/profile/${session.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: editedName.trim() }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('API Error:', errorData)
        throw new Error(errorData.error || 'Failed to update name')
      }

      const data = await response.json()
      console.log('Name updated successfully:', data)

      // Update session store (will trigger re-render)
      const sessionStore = useSessionStore.getState()
      sessionStore.setSession({
        ...session,
        name: editedName.trim()
      })
      
      setIsEditing(false)
      showSuccess("Nama berhasil diperbarui")
      
      // Log activity
      ActivityLogger.profileUpdated(session.id, "name")
    } catch (error) {
      console.error('Name update error:', error)
      const errorMessage = error instanceof Error ? error.message : "Gagal menyimpan nama. Silakan coba lagi."
      showError(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditedName(session?.name || "")
    setIsEditing(false)
  }

  const handleSaveGender = async () => {
    if (!session || !editedGender.trim()) return
    
    try {
      setIsSavingGender(true)
      
      const response = await fetch(`/api/profile/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jenisKelamin: editedGender.trim() })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update gender')
      }
      
      setIsEditingGender(false)
      showSuccess("Jenis kelamin berhasil diperbarui")
      
      // Reload to show updated data
      setTimeout(() => window.location.reload(), 1000)
    } catch (error) {
      console.error('Gender update error:', error)
      showError(error instanceof Error ? error.message : "Gagal menyimpan jenis kelamin")
    } finally {
      setIsSavingGender(false)
    }
  }
  
  const handleCancelGenderEdit = () => {
    setEditedGender(profile?.jenisKelamin || "")
    setIsEditingGender(false)
  }

  const handleSavePhone = async () => {
    if (!session || !phoneInput.trim()) return
    
    try {
      setIsSavingPhone(true)
      
      // Update phoneNumber directly in User model
      const response = await fetch(`/api/profile/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phoneNumber: phoneInput.trim()
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update phone')
      }
      
      // Update local profile store
      if (profile) {
        updateProfile(session.id, { phoneNumber: phoneInput.trim() })
      }
      
      showSuccess("Nomor telepon berhasil diperbarui")
      setIsEditingPhone(false)
    } catch (error) {
      console.error('Save phone error:', error)
      showError(error instanceof Error ? error.message : "Gagal menyimpan nomor telepon")
    } finally {
      setIsSavingPhone(false)
    }
  }

  const handleCancelPhoneEdit = () => {
    setPhoneInput(profile?.phoneNumber || "")
    setIsEditingPhone(false)
  }
  
  const handleDeletePhone = async () => {
    if (!session || !profile?.phoneNumber) return
    
    if (!confirm("Yakin ingin menghapus nomor telepon?")) return
    
    try {
      const response = await fetch(`/api/profile/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: null })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete phone')
      }
      
      // Update local profile store
      updateProfile(session.id, { phoneNumber: null })
      setPhoneInput("")
      showSuccess("Nomor telepon berhasil dihapus")
    } catch (error) {
      console.error('Delete phone error:', error)
      showError(error instanceof Error ? error.message : "Gagal menghapus nomor telepon")
    }
  }

  if (!session) return null

  return (
    <>
      {/* E-KTM hanya untuk mahasiswa */}
      {session.role === "mahasiswa" && (
        <EKTMFullView
          open={showEKTM}
          onOpenChange={setShowEKTM}
          name={session.name}
          nim={currentNIM || ""}
          fakultas={getFakultas()}
          programStudi={getProdi()}
          avatarUrl={currentAvatar}
          userId={session.id}
        />
      )}
      
      <div className="grid gap-6 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Avatar</CardTitle>
          <CardDescription>Foto profil Anda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AvatarUploader
            currentAvatar={currentAvatar}
            userName={session.name}
            onAvatarChange={handleAvatarChange}
            fileInputRef={fileInputRef}
          />
          
          {/* E-KTM Button */}
          {session.role === "mahasiswa" && currentNIM && (
            <div className="space-y-2">
              <Button
                type="button"
                variant="default"
                className="w-full"
                onClick={() => setShowEKTM(true)}
                disabled={!currentAvatar}
              >
                <IdCard className="h-4 w-4 mr-2" />
                Lihat E-KTM
              </Button>
              
              {/* Tombol Ubah Foto Profile */}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Ubah Foto Profile
              </Button>
              
              {!currentAvatar && (
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
                <div className="flex gap-2">
                  <Input 
                    id="name" 
                    value={isEditing ? editedName : session.name}
                    onChange={(e) => setEditedName(e.target.value)}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-muted" : ""}
                  />
                  {!isEditing ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="default"
                        size="icon"
                        onClick={handleSaveName}
                        disabled={isSaving || !editedName.trim()}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
                {!isEditing && (
                  <p className="text-xs text-muted-foreground">Klik ikon edit untuk mengubah nama</p>
                )}
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
                  value={getFakultas()}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  {profile?.prodi 
                    ? "Data dari pd-unesa.unesa.ac.id" 
                    : "Fakultas tidak dapat diubah"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prodi">Program Studi</Label>
                <Input
                  id="prodi"
                  value={getProdi()}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  {profile?.prodi 
                    ? "Data dari multi-source (PDDIKTI/pd-unesa)" 
                    : getProdi() !== "-"
                    ? "Data dari kode NIM (fallback)"
                    : "Menunggu sinkronisasi data..."}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jenisKelamin">Jenis Kelamin</Label>
                <div className="flex gap-2">
                  {!isEditingGender ? (
                    <>
                      <Input
                        id="jenisKelamin"
                        value={(() => {
                          // Priority 1: Database value
                          if (profile?.jenisKelamin) return profile.jenisKelamin
                          
                          // Priority 2: Detect from name as fallback (without "(terdeteksi)")
                          if (session?.name) {
                            const detected = detectGenderFromNameSimple(session.name)
                            if (detected) return detected
                          }
                          
                          return "-"
                        })()}
                        disabled
                        className="bg-muted"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const currentGender = profile?.jenisKelamin || 
                            (session?.name ? detectGenderFromNameSimple(session.name) : "") || ""
                          setEditedGender(currentGender)
                          setIsEditingGender(true)
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <select
                        value={editedGender}
                        onChange={(e) => setEditedGender(e.target.value)}
                        disabled={isSavingGender}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Pilih Jenis Kelamin</option>
                        <option value="Laki - Laki">Laki - Laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                      <Button
                        type="button"
                        variant="default"
                        size="icon"
                        onClick={handleSaveGender}
                        disabled={isSavingGender || !editedGender}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleCancelGenderEdit}
                        disabled={isSavingGender}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {!isEditingGender ? (
                    profile?.jenisKelamin 
                      ? "Data dari multi-source (PDDIKTI/pd-unesa)" 
                      : session?.name && detectGenderFromNameSimple(session.name)
                      ? "Terdeteksi otomatis dari nama"
                      : "Klik ikon edit untuk mengatur jenis kelamin"
                  ) : (
                    "Pilih jenis kelamin dan klik centang untuk menyimpan"
                  )}
                </p>
              </div>

              {profile?.semesterAwal && (
                <div className="space-y-2">
                  <Label htmlFor="semesterAwal">Semester Awal</Label>
                  <Input
                    id="semesterAwal"
                    value={profile.semesterAwal}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Semester Awal tidak dapat diubah</p>
                </div>
              )}
            </div>

            {/* Phone Number Section - Single Phone with Edit */}
            <div className="pt-4 border-t">
              <div className="mb-3">
                <Label className="text-base">Nomor Telepon</Label>
                <p className="text-xs text-muted-foreground mt-1">Nomor telepon untuk dihubungi</p>
              </div>
              
              <div className="space-y-2 mb-4">
                  {!isEditingPhone && profile?.phoneNumber ? (
                    // Display mode
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{profile.phoneNumber}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditingPhone(true)}
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleDeletePhone}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Hapus
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Edit/Add mode
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Contoh: 081234567890"
                          value={phoneInput}
                          onChange={(e) => setPhoneInput(e.target.value)}
                          disabled={isSavingPhone}
                        />
                        <Button
                          type="button"
                          variant="default"
                          size="icon"
                          onClick={handleSavePhone}
                          disabled={isSavingPhone || !phoneInput.trim()}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        {profile?.phoneNumber && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={handleCancelPhoneEdit}
                            disabled={isSavingPhone}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {profile?.phoneNumber ? 'Ubah nomor telepon Anda' : 'Tambahkan nomor telepon'}
                      </p>
                    </div>
                  )}
                  
                  {!profile?.phoneNumber && !isEditingPhone && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => setIsEditingPhone(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Nomor Telepon
                    </Button>
                  )}
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              {isCheckingPassword ? (
                <Button type="button" variant="outline" disabled>
                  <Lock className="h-4 w-4 mr-2" />
                  Memuat...
                </Button>
              ) : hasPassword ? (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={onChangePassword}
                  className="cursor-pointer"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Ganti Password
                </Button>
              ) : (
                <>
                  <Button 
                    type="button" 
                    variant="default"
                    onClick={onSetPassword}
                    className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <KeyRound className="h-4 w-4 mr-2" />
                    Atur Password
                  </Button>
                  <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                    <div className="text-xs text-blue-800 dark:text-blue-200">
                      <p className="font-semibold mb-1">Akun Google Belum Punya Password</p>
                      <p>Atur password agar bisa login menggunakan email dan password selain Google Sign-In.</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </>
  )
}
