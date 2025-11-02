"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import type { User } from "@/data/schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUsersStore } from "@/stores/users.store"
import { showSuccess, showError } from "@/lib/alerts"
import { Save, X, User as UserIcon, Mail, Lock, Shield, Eye, EyeOff, Loader2, Copy, CheckCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PRODI_OPTIONS } from "@/lib/prodi-config"

// Schema untuk mahasiswa (create)
const mahasiswaFormSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  nomorHp: z.string().min(10, "Nomor HP minimal 10 digit").regex(/^[0-9]+$/, "Nomor HP hanya boleh berisi angka"),
  tanggalLahir: z.string().min(1, "Tanggal lahir wajib diisi"),
  tempatLahir: z.string().min(2, "Tempat lahir minimal 2 karakter"),
  angkatan: z.number().min(2000).max(2100, "Tahun angkatan tidak valid"),
  role: z.literal("mahasiswa"),
})

// Schema untuk edit mahasiswa
const editMahasiswaFormSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  nim: z.string().min(11, "NIM harus 11 digit").max(11, "NIM harus 11 digit").regex(/^[0-9]+$/, "NIM hanya boleh berisi angka"),
  angkatan: z.number().min(2000).max(2100, "Tahun angkatan tidak valid"),
  role: z.enum(["mahasiswa", "dosen", "kaprodi", "super_admin"]),
})

// Schema untuk dosen/kaprodi/admin (create)
const staffFormSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter").optional().or(z.literal("")),
  role: z.enum(["dosen", "kaprodi", "super_admin"]),
  prodi: z.string().min(3, "Prodi minimal 3 karakter").optional(),
}).refine((data) => {
  // Prodi wajib diisi jika role kaprodi
  if (data.role === "kaprodi" && !data.prodi) {
    return false
  }
  return true
}, {
  message: "Prodi wajib diisi untuk role Kaprodi",
  path: ["prodi"],
})

// Schema untuk edit staff
const editStaffFormSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter").optional().or(z.literal("")),
  role: z.enum(["mahasiswa", "dosen", "kaprodi", "super_admin"]),
  prodi: z.string().min(3, "Prodi minimal 3 karakter").optional(),
}).refine((data) => {
  // Prodi wajib diisi jika role kaprodi
  if (data.role === "kaprodi" && !data.prodi) {
    return false
  }
  return true
}, {
  message: "Prodi wajib diisi untuk role Kaprodi",
  path: ["prodi"],
})

// Union schema
const userFormSchema = z.discriminatedUnion("role", [
  mahasiswaFormSchema,
  staffFormSchema,
])

type UserFormData = z.infer<typeof mahasiswaFormSchema> | z.infer<typeof staffFormSchema>

interface UserFormProps {
  user?: User
  onSuccess?: () => void
  onCancel?: () => void
}

export function UserForm({ user, onSuccess, onCancel }: UserFormProps) {
  const { addUser, updateUser } = useUsersStore()
  const isEdit = !!user
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedRole, setSelectedRole] = useState<"mahasiswa" | "dosen" | "kaprodi" | "super_admin">(
    user?.role || "mahasiswa"
  )
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    email: string
    password: string
    nim?: string
  } | null>(null)

  const form = useForm<any>({
    resolver: isEdit 
      ? (selectedRole === "mahasiswa" ? zodResolver(editMahasiswaFormSchema) : zodResolver(editStaffFormSchema))
      : (selectedRole === "mahasiswa" ? zodResolver(mahasiswaFormSchema) : zodResolver(staffFormSchema)),
    defaultValues: isEdit
      ? (user?.role === "mahasiswa"
          ? {
              name: user?.name || "",
              nim: user?.profile?.nim || "",
              angkatan: user?.profile?.angkatan || new Date().getFullYear(),
              role: user?.role || "mahasiswa",
            }
          : {
              name: user?.name || "",
              email: user?.email || "",
              password: "",
              role: user?.role || "dosen",
              prodi: user?.prodi || "",
            })
      : (selectedRole === "mahasiswa" 
          ? {
              name: "",
              nomorHp: "",
              tanggalLahir: "",
              tempatLahir: "",
              angkatan: new Date().getFullYear(),
              role: "mahasiswa",
            }
          : {
              name: "",
              email: "",
              password: "",
              role: selectedRole,
              prodi: "",
            }),
  })

  useEffect(() => {
    if (user) {
      if (user.role === "mahasiswa") {
        form.reset({
          name: user.name,
          nim: user.profile?.nim || "",
          angkatan: user.profile?.angkatan || new Date().getFullYear(),
          role: user.role,
        })
        setSelectedRole(user.role)
      } else {
        form.reset({
          name: user.name,
          email: user.email,
          password: "",
          role: user.role,
          prodi: user.prodi || "",
        })
        setSelectedRole(user.role)
      }
    }
  }, [user, form])

  // Update form when role changes
  useEffect(() => {
    if (!isEdit) {
      if (selectedRole === "mahasiswa") {
        form.reset({
          name: "",
          nomorHp: "",
          tanggalLahir: "",
          tempatLahir: "",
          angkatan: new Date().getFullYear(),
          role: "mahasiswa",
        })
      } else {
        form.reset({
          name: "",
          email: "",
          password: "",
          role: selectedRole,
          prodi: "",
        })
      }
    }
  }, [selectedRole, isEdit, form])

  const onSubmit = async (data: any) => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    try {
      if (isEdit && user) {
        // Update existing user
        const updates: any = {
          name: data.name,
          role: data.role,
        }
        
        // Update email untuk non-mahasiswa
        if (data.role !== "mahasiswa" && data.email) {
          updates.email = data.email
        }
        
        // Update password jika diisi
        if (data.password) {
          updates.password = data.password
        }
        
        // Update NIM dan angkatan untuk mahasiswa
        if (data.role === "mahasiswa") {
          updates.nim = data.nim
          updates.angkatan = data.angkatan
        }
        
        // Update prodi untuk kaprodi/dosen
        if (data.role === "kaprodi" || data.role === "dosen") {
          updates.prodi = data.prodi || null
        }
        
        await updateUser(user.id, updates)
        showSuccess("User berhasil diperbarui")
        form.reset()
        onSuccess?.()
      } else {
        // Add new user
        if (data.role === "mahasiswa") {
          // Data mahasiswa untuk auto-generate email & password
          const credentials = await addUser({
            name: data.name,
            role: data.role,
            nomorHp: data.nomorHp,
            tanggalLahir: data.tanggalLahir,
            tempatLahir: data.tempatLahir,
            angkatan: data.angkatan,
          })
          
          if (credentials) {
            setGeneratedCredentials(credentials)
            showSuccess("Mahasiswa berhasil ditambahkan!")
          }
        } else {
          // Data staff (dosen, kaprodi, super_admin)
          await addUser({
            name: data.name,
            email: data.email,
            role: data.role,
            password: data.password || undefined,
            prodi: data.prodi || undefined,
          })
          showSuccess("User berhasil ditambahkan")
          form.reset()
          onSuccess?.()
        }
      }
    } catch (error: any) {
      showError(error.message || "Terjadi kesalahan saat menyimpan user")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseCredentials = () => {
    setGeneratedCredentials(null)
    form.reset()
    onSuccess?.()
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            {isEdit ? "Edit User" : "Tambah User Baru"}
          </CardTitle>
          <CardDescription>
            {isEdit 
              ? "Perbarui informasi user yang ada" 
              : "Tambahkan user baru dengan role yang sesuai"}
          </CardDescription>
        </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Role Selection - For both new and edit users */}
          <div className="space-y-2">
            <Label htmlFor="role" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Role
            </Label>
            <Select
              value={selectedRole}
              onValueChange={(value: any) => {
                setSelectedRole(value)
                form.setValue("role", value)
              }}
            >
              <SelectTrigger className="cursor-pointer">
                <SelectValue placeholder="Pilih role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mahasiswa" className="cursor-pointer">Mahasiswa</SelectItem>
                <SelectItem value="dosen" className="cursor-pointer">Dosen</SelectItem>
                <SelectItem value="kaprodi" className="cursor-pointer">Kaprodi</SelectItem>
                <SelectItem value="super_admin" className="cursor-pointer">Super Admin</SelectItem>
              </SelectContent>
            </Select>
            {isEdit && (
              <p className="text-xs text-muted-foreground">
                ⚠️ Mengubah role user dapat mempengaruhi akses dan data mereka
              </p>
            )}
            {isEdit && user?.role === "mahasiswa" && (
              <p className="text-xs text-muted-foreground">
                Role mahasiswa tidak dapat diubah
              </p>
            )}
          </div>

          {/* Nama Lengkap - Common for all */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              Nama Lengkap
            </Label>
            <Input
              id="name"
              placeholder="Masukkan nama lengkap"
              {...form.register("name")}
              className="cursor-pointer"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {String(form.formState.errors.name.message || "Error")}
              </p>
            )}
          </div>

          {/* Form untuk Edit Mahasiswa */}
          {selectedRole === "mahasiswa" && isEdit && (
            <>
              <div className="space-y-2">
                <Label htmlFor="nim" className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  NIM
                </Label>
                <Input
                  id="nim"
                  placeholder="22050974025"
                  maxLength={11}
                  {...form.register("nim")}
                  className="cursor-pointer font-mono"
                />
                {form.formState.errors.nim && (
                  <p className="text-sm text-destructive">
                    {String(form.formState.errors.nim.message || "")}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  NIM harus 11 digit angka
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="angkatan" className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  Angkatan
                </Label>
                <Input
                  id="angkatan"
                  type="number"
                  placeholder="2024"
                  {...form.register("angkatan", { valueAsNumber: true })}
                  className="cursor-pointer"
                  min={2000}
                  max={2100}
                />
                {form.formState.errors.angkatan && (
                  <p className="text-sm text-destructive">
                    {String(form.formState.errors.angkatan.message || "")}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Form untuk Mahasiswa */}
          {selectedRole === "mahasiswa" && !isEdit && (
            <>
              <div className="space-y-2">
                <Label htmlFor="nomorHp" className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  Nomor HP
                </Label>
                <Input
                  id="nomorHp"
                  placeholder="08123456789"
                  {...form.register("nomorHp")}
                  className="cursor-pointer"
                />
                {form.formState.errors.nomorHp && (
                  <p className="text-sm text-destructive">
                    {String(form.formState.errors.nomorHp.message || "")}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tempatLahir" className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    Tempat Lahir
                  </Label>
                  <Input
                    id="tempatLahir"
                    placeholder="Jakarta"
                    {...form.register("tempatLahir")}
                    className="cursor-pointer"
                  />
                  {form.formState.errors.tempatLahir && (
                    <p className="text-sm text-destructive">
                      {String(form.formState.errors.tempatLahir.message || "")}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tanggalLahir" className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    Tanggal Lahir
                  </Label>
                  <Input
                    id="tanggalLahir"
                    type="date"
                    {...form.register("tanggalLahir")}
                    className="cursor-pointer"
                  />
                  {form.formState.errors.tanggalLahir && (
                    <p className="text-sm text-destructive">
                      {String(form.formState.errors.tanggalLahir.message || "")}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="angkatan" className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  Angkatan
                </Label>
                <Input
                  id="angkatan"
                  type="number"
                  placeholder="2024"
                  {...form.register("angkatan", { valueAsNumber: true })}
                  className="cursor-pointer"
                  min={2000}
                  max={2100}
                />
                {form.formState.errors.angkatan && (
                  <p className="text-sm text-destructive">
                    {String(form.formState.errors.angkatan.message || "")}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Email akan di-generate dengan format: <strong>(nama).(tahun)(nomor urut)@mhs.unesa.ac.id</strong>
                  <br />
                  Contoh: rinoraihan.22025@mhs.unesa.ac.id
                </p>
              </div>
            </>
          )}

          {/* Form untuk Dosen/Kaprodi/Admin */}
          {selectedRole !== "mahasiswa" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  {...form.register("email")}
                  className="cursor-pointer"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {String(form.formState.errors.email.message || "")}
                  </p>
                )}
                {isEdit && (
                  <p className="text-xs text-muted-foreground">
                    Email dapat diubah untuk role non-mahasiswa
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password {isEdit && "(kosongkan jika tidak ingin mengubah)"}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={isEdit ? "Kosongkan jika tidak ingin mengubah" : "Minimal 6 karakter"}
                    {...form.register("password")}
                    className="cursor-pointer pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {String(form.formState.errors.password.message || "")}
                  </p>
                )}
              </div>

              {/* Prodi field - Required for Kaprodi, Optional for Dosen */}
              {(selectedRole === "kaprodi" || selectedRole === "dosen") && (
                <div className="space-y-2">
                  <Label htmlFor="prodi" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Program Studi {selectedRole === "kaprodi" && <span className="text-destructive">*</span>}
                  </Label>
                  <Select
                    value={form.watch("prodi") || ""}
                    onValueChange={(value) => form.setValue("prodi", value)}
                  >
                    <SelectTrigger className="cursor-pointer">
                      <SelectValue placeholder="Pilih Program Studi" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODI_OPTIONS.map((prodi) => (
                        <SelectItem key={prodi.value} value={prodi.value} className="cursor-pointer">
                          {prodi.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.prodi && (
                    <p className="text-sm text-destructive">
                      {String(form.formState.errors.prodi.message || "")}
                    </p>
                  )}
                  {selectedRole === "kaprodi" && (
                    <p className="text-xs text-muted-foreground">
                      <strong>⚠️ Penting:</strong> Kaprodi hanya dapat mengelola mata kuliah sesuai dengan prodi yang dipilih
                      <br />
                      <strong>Jurusan Teknik Informatika:</strong> PTI, TI, SI
                    </p>
                  )}
                  {selectedRole === "dosen" && (
                    <p className="text-xs text-muted-foreground">
                      Prodi dosen (opsional) untuk keperluan filter dan pelaporan
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1 cursor-pointer"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEdit ? "Memperbarui..." : selectedRole === "mahasiswa" ? "Membuat Mahasiswa..." : "Menambahkan..."}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEdit ? "Perbarui User" : selectedRole === "mahasiswa" ? "Generate & Tambah" : "Tambah User"}
                </>
              )}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1 cursor-pointer"
                disabled={isSubmitting}
              >
                <X className="h-4 w-4 mr-2" />
                Batal
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
    
    {/* Dialog untuk menampilkan credentials yang di-generate */}
    <Dialog open={!!generatedCredentials} onOpenChange={(open) => !open && handleCloseCredentials()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Mahasiswa Berhasil Ditambahkan!
          </DialogTitle>
          <DialogDescription>
            Berikut adalah informasi login untuk mahasiswa yang baru ditambahkan. 
            Pastikan untuk menyimpan informasi ini dengan aman.
          </DialogDescription>
        </DialogHeader>
        
        {generatedCredentials && (
          <div className="space-y-4 py-4">
            {generatedCredentials.nim && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">NIM</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={generatedCredentials.nim}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedCredentials.nim!)
                      showSuccess("NIM disalin ke clipboard")
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Email</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={generatedCredentials.email}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedCredentials.email)
                    showSuccess("Email disalin ke clipboard")
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Password</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={generatedCredentials.password}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedCredentials.password)
                    showSuccess("Password disalin ke clipboard")
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>⚠️ Penting:</strong> Simpan informasi ini dengan aman. 
                Password ini tidak akan ditampilkan lagi setelah dialog ini ditutup.
              </p>
            </div>
          </div>
        )}
        
        <div className="flex justify-end gap-2">
          <Button onClick={handleCloseCredentials} className="cursor-pointer">
            <CheckCircle className="h-4 w-4 mr-2" />
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </>
  )
}
