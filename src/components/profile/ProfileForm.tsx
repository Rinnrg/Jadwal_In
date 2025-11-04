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
import { Lock, IdCard, Edit2, Check, X, KeyRound, Upload, Phone, Plus, Trash2 } from "lucide-react"

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
  
  // Phone state
  const [phones, setPhones] = useState<Array<{id: string, phoneNumber: string, isPrimary: boolean}>>([])
  const [newPhone, setNewPhone] = useState("")
  const [isAddingPhone, setIsAddingPhone] = useState(false)
  const [isLoadingPhones, setIsLoadingPhones] = useState(true)

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

  // Fetch phones
  useEffect(() => {
    const fetchPhones = async () => {
      if (!session) return
      
      try {
        setIsLoadingPhones(true)
        const response = await fetch(`/api/profile/${session.id}/phone`)
        if (response.ok) {
          const data = await response.json()
          setPhones(data.phones || [])
        }
      } catch (error) {
        console.error('Error fetching phones:', error)
      } finally {
        setIsLoadingPhones(false)
      }
    }
    
    fetchPhones()
  }, [session])

  // Auto-sync NIM for Google Auth users on profile load
  useEffect(() => {
    const syncNIM = async () => {
      if (!session) return
      
      // Only sync if user has no NIM or NIM is too short
      const needsSync = !profile?.nim || (profile.nim.length < 8)
      
      if (needsSync && session.email) {
        try {
          console.log('[ProfileForm] Syncing NIM for user:', session.email)
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
            if (data.updated) {
              console.log('[ProfileForm] NIM synced successfully:', data.nim)
              // Note: All fields are now in User model
              // Store will be updated when page reloads or from API response
            }
          }
        } catch (error) {
          console.error('[ProfileForm] Error syncing NIM:', error)
        }
      }
    }
    
    syncNIM()
  }, [session, profile])

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

  const handleAddPhone = async () => {
    if (!session || !newPhone.trim()) return
    
    try {
      setIsAddingPhone(true)
      const response = await fetch(`/api/profile/${session.id}/phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phoneNumber: newPhone.trim(),
          isPrimary: phones.length === 0 // First phone is primary
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add phone')
      }
      
      const data = await response.json()
      setPhones([...phones, data.phone])
      setNewPhone("")
      showSuccess("Nomor telepon berhasil ditambahkan")
    } catch (error) {
      console.error('Add phone error:', error)
      showError(error instanceof Error ? error.message : "Gagal menambahkan nomor telepon")
    } finally {
      setIsAddingPhone(false)
    }
  }

  const handleDeletePhone = async (phoneId: string) => {
    if (!session) return
    
    try {
      const response = await fetch(`/api/profile/${session.id}/phone?phoneId=${phoneId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete phone')
      }
      
      setPhones(phones.filter(p => p.id !== phoneId))
      showSuccess("Nomor telepon berhasil dihapus")
    } catch (error) {
      console.error('Delete phone error:', error)
      showError(error instanceof Error ? error.message : "Gagal menghapus nomor telepon")
    }
  }

  const handleSetPrimary = async (phoneId: string) => {
    if (!session) return
    
    try {
      const response = await fetch(`/api/profile/${session.id}/phone`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneId, isPrimary: true })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update phone')
      }
      
      // Update local state
      setPhones(phones.map(p => ({
        ...p,
        isPrimary: p.id === phoneId
      })))
      showSuccess("Nomor telepon utama berhasil diubah")
    } catch (error) {
      console.error('Update phone error:', error)
      showError(error instanceof Error ? error.message : "Gagal mengubah nomor telepon utama")
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
          fakultas={getFakultasFromNIM(currentNIM)}
          programStudi={getProdiFromNIM(currentNIM)}
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

            {/* Phone Numbers Section - Integrated */}
            <div className="pt-4 border-t">
              <div className="mb-3">
                <Label className="text-base">Nomor Telepon</Label>
                <p className="text-xs text-muted-foreground mt-1">Tambah dan kelola nomor telepon Anda</p>
              </div>
              
              {/* Add Phone */}
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="Contoh: 081234567890"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  disabled={isAddingPhone}
                />
                <Button
                  type="button"
                  onClick={handleAddPhone}
                  disabled={isAddingPhone || !newPhone.trim()}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah
                </Button>
              </div>

              {/* Phone List */}
              {isLoadingPhones ? (
                <div className="text-sm text-muted-foreground">Memuat nomor telepon...</div>
              ) : phones.length === 0 ? (
                <div className="text-sm text-muted-foreground">Belum ada nomor telepon</div>
              ) : (
                <div className="space-y-2">
                  {phones.map((phone) => (
                    <div
                      key={phone.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{phone.phoneNumber}</p>
                          {phone.isPrimary && (
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                              Nomor Utama
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!phone.isPrimary && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetPrimary(phone.id)}
                          >
                            Jadikan Utama
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeletePhone(phone.id)}
                          className="text-destructive hover:text-destructive h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
