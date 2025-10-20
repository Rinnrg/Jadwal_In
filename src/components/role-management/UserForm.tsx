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
import { Save, X, User as UserIcon, Mail, Lock, Shield, Eye, EyeOff } from "lucide-react"

const userFormSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter").optional().or(z.literal("")),
  role: z.enum(["mahasiswa", "dosen", "kaprodi", "super_admin"]),
})

type UserFormData = z.infer<typeof userFormSchema>

interface UserFormProps {
  user?: User
  onSuccess?: () => void
  onCancel?: () => void
}

export function UserForm({ user, onSuccess, onCancel }: UserFormProps) {
  const { addUser, updateUser } = useUsersStore()
  const isEdit = !!user
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      password: "",
      role: user?.role || "mahasiswa",
    },
  })

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        email: user.email,
        password: "",
        role: user.role,
      })
    }
  }, [user, form])

  const onSubmit = (data: UserFormData) => {
    try {
      if (isEdit && user) {
        // Update existing user
        const updates: Partial<User> = {
          name: data.name,
          email: data.email,
          role: data.role,
        }
        
        // Only update password if provided
        if (data.password) {
          updates.password = data.password
        }
        
        updateUser(user.id, updates)
        showSuccess("User berhasil diperbarui")
      } else {
        // Add new user
        addUser({
          name: data.name,
          email: data.email,
          role: data.role,
          password: data.password || undefined,
        })
        showSuccess("User berhasil ditambahkan")
      }
      
      form.reset()
      onSuccess?.()
    } catch (error) {
      showError("Terjadi kesalahan saat menyimpan user")
    }
  }

  return (
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
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

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
              disabled={isEdit} // Don't allow email changes in edit mode
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">
                {form.formState.errors.email.message}
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
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Role
            </Label>
            <Select
              value={form.watch("role")}
              onValueChange={(value) => form.setValue("role", value as any)}
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
            {form.formState.errors.role && (
              <p className="text-sm text-destructive">
                {form.formState.errors.role.message}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1 cursor-pointer"
            >
              <Save className="h-4 w-4 mr-2" />
              {isEdit ? "Perbarui User" : "Tambah User"}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1 cursor-pointer"
              >
                <X className="h-4 w-4 mr-2" />
                Batal
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
