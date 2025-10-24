"use client"

import { useState, useEffect } from "react"
import { useSessionStore } from "@/stores/session.store"
import { useUsersStore } from "@/stores/users.store"
import { canAccessRoleManagement } from "@/lib/rbac"
import type { User } from "@/data/schema"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { UserForm } from "@/components/role-management/UserForm"
import { RoleManagementTable } from "@/components/role-management/RoleManagementTable"
import {
  Plus,
  ArrowLeft,
  Shield,
  Users,
  UserCog,
  Loader2,
} from "lucide-react"

export default function RoleManagementPage() {
  const { session } = useSessionStore()
  const { users, isLoading, fetchUsers } = useUsersStore()
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  useEffect(() => {
    // Fetch users on component mount
    fetchUsers()
  }, [fetchUsers])

  if (!session || !canAccessRoleManagement(session.role)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center animate-fade-in">
        <Card className="glass-effect border-2 border-primary/20 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Akses Ditolak</h2>
          <p className="text-muted-foreground">Anda tidak memiliki akses ke halaman ini.</p>
        </Card>
      </div>
    )
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setShowForm(true)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingUser(null)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingUser(null)
  }

  if (showForm) {
    return (
      <div className="space-y-4 md:space-y-6 px-2 md:px-4">
        <div className="flex items-center space-x-3 md:space-x-4">
          <Button variant="ghost" onClick={handleCancel} className="text-xs md:text-sm">
            <ArrowLeft className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">
              {editingUser ? "Edit User" : "Tambah User Baru"}
            </h1>
            <p className="text-gray-900 dark:text-gray-100 font-bold text-sm md:text-base">
              {editingUser ? "Perbarui informasi user" : "Tambahkan user baru ke sistem"}
            </p>
          </div>
        </div>

        <div className="animate-slide-up">
          <UserForm user={editingUser || undefined} onSuccess={handleFormSuccess} onCancel={handleCancel} />
        </div>
      </div>
    )
  }

  const userStats = {
    total: users.length,
    mahasiswa: users.filter((u) => u.role === "mahasiswa").length,
    dosen: users.filter((u) => u.role === "dosen").length,
    kaprodi: users.filter((u) => u.role === "kaprodi").length,
    super_admin: users.filter((u) => u.role === "super_admin").length,
  }

  if (isLoading && users.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center animate-fade-in">
        <Card className="glass-effect border-2 border-primary/20 p-8 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Memuat data users...</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-3 md:space-y-6 px-2 md:px-4 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">
            Role Management
          </h1>
          <p className="text-gray-900 dark:text-gray-100 font-bold text-sm md:text-base">
            Kelola pengguna dan role dalam sistem
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="text-xs md:text-sm w-full sm:w-auto"
        >
          <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
          Tambah User
        </Button>
      </div>

      <div className="grid grid-cols-2 md:flex gap-2 md:gap-4 overflow-x-auto pb-2 md:snap-x md:snap-mandatory">
        <Card className="card-interactive border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 group md:min-w-[200px] md:snap-start">
          <div className="p-3 md:p-6">
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <div className="text-[10px] md:text-sm font-bold text-muted-foreground">Total Users</div>
              <Users className="h-4 w-4 md:h-6 md:w-6 text-blue-500 group-hover:scale-125 transition-transform duration-300" />
            </div>
            <div className="text-2xl md:text-4xl font-bold text-blue-600">{userStats.total}</div>
            <p className="text-[10px] md:text-sm text-muted-foreground mt-1 md:mt-2">Semua pengguna</p>
          </div>
        </Card>

        <Card className="card-interactive border-2 border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 group md:min-w-[200px] md:snap-start">
          <div className="p-3 md:p-6">
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <div className="text-[10px] md:text-sm font-bold text-muted-foreground">Mahasiswa</div>
              <UserCog className="h-4 w-4 md:h-6 md:w-6 text-green-500 group-hover:scale-125 transition-transform duration-300" />
            </div>
            <div className="text-2xl md:text-4xl font-bold text-green-600">{userStats.mahasiswa}</div>
            <p className="text-[10px] md:text-sm text-muted-foreground mt-1 md:mt-2">Role mahasiswa</p>
          </div>
        </Card>

        <Card className="card-interactive border-2 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 group md:min-w-[200px] md:snap-start">
          <div className="p-3 md:p-6">
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <div className="text-[10px] md:text-sm font-bold text-muted-foreground">Dosen</div>
              <UserCog className="h-4 w-4 md:h-6 md:w-6 text-purple-500 group-hover:scale-125 transition-transform duration-300" />
            </div>
            <div className="text-2xl md:text-4xl font-bold text-purple-600">{userStats.dosen}</div>
            <p className="text-[10px] md:text-sm text-muted-foreground mt-1 md:mt-2">Role dosen</p>
          </div>
        </Card>

        <Card className="card-interactive border-2 border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-600 group md:min-w-[200px] md:snap-start">
          <div className="p-3 md:p-6">
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <div className="text-[10px] md:text-sm font-bold text-muted-foreground">Kaprodi</div>
              <UserCog className="h-4 w-4 md:h-6 md:w-6 text-orange-500 group-hover:scale-125 transition-transform duration-300" />
            </div>
            <div className="text-2xl md:text-4xl font-bold text-orange-600">{userStats.kaprodi}</div>
            <p className="text-[10px] md:text-sm text-muted-foreground mt-1 md:mt-2">Role kaprodi</p>
          </div>
        </Card>

        <Card className="card-interactive border-2 border-red-200 dark:border-red-800 hover:border-red-400 dark:hover:border-red-600 group md:min-w-[200px] md:snap-start">
          <div className="p-3 md:p-6">
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <div className="text-[10px] md:text-sm font-bold text-muted-foreground">Super Admin</div>
              <Shield className="h-4 w-4 md:h-6 md:w-6 text-red-500 group-hover:scale-125 transition-transform duration-300" />
            </div>
            <div className="text-2xl md:text-4xl font-bold text-red-600">{userStats.super_admin}</div>
            <p className="text-[10px] md:text-sm text-muted-foreground mt-1 md:mt-2">Role super admin</p>
          </div>
        </Card>
      </div>

      <RoleManagementTable onEdit={handleEdit} />
    </div>
  )
}
