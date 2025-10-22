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
      <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">
        <div className="flex items-center space-x-6 animate-slide-in-left">
          <Button variant="ghost" onClick={handleCancel} className="button-modern cursor-pointer">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              {editingUser ? "Edit User" : "Tambah User Baru"}
            </h1>
            <p className="text-muted-foreground text-lg mt-2">
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
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-16">
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-5xl font-bold tracking-tight animate-float flex items-center gap-3">
            Role Management
          </h1>
          <p className="text-muted-foreground text-xl mt-2 animate-slide-in-left" style={{ animationDelay: "0.1s" }}>
            Kelola pengguna dan role dalam sistem
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="px-6 py-3 rounded-xl shadow-lg animate-slide-in-right cursor-pointer"
        >
          <Plus className="h-5 w-5 mr-2" />
          Tambah User
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-5 animate-slide-up" style={{ animationDelay: "0.2s" }}>
        <Card className="card-interactive border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 group">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-bold text-muted-foreground">Total Users</div>
              <Users className="h-6 w-6 text-blue-500 group-hover:scale-125 transition-transform duration-300" />
            </div>
            <div className="text-4xl font-bold text-blue-600">{userStats.total}</div>
            <p className="text-sm text-muted-foreground mt-2">Semua pengguna</p>
          </div>
        </Card>

        <Card className="card-interactive border-2 border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 group">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-bold text-muted-foreground">Mahasiswa</div>
              <UserCog className="h-6 w-6 text-green-500 group-hover:scale-125 transition-transform duration-300" />
            </div>
            <div className="text-4xl font-bold text-green-600">{userStats.mahasiswa}</div>
            <p className="text-sm text-muted-foreground mt-2">Role mahasiswa</p>
          </div>
        </Card>

        <Card className="card-interactive border-2 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 group">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-bold text-muted-foreground">Dosen</div>
              <UserCog className="h-6 w-6 text-purple-500 group-hover:scale-125 transition-transform duration-300" />
            </div>
            <div className="text-4xl font-bold text-purple-600">{userStats.dosen}</div>
            <p className="text-sm text-muted-foreground mt-2">Role dosen</p>
          </div>
        </Card>

        <Card className="card-interactive border-2 border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-600 group">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-bold text-muted-foreground">Kaprodi</div>
              <UserCog className="h-6 w-6 text-orange-500 group-hover:scale-125 transition-transform duration-300" />
            </div>
            <div className="text-4xl font-bold text-orange-600">{userStats.kaprodi}</div>
            <p className="text-sm text-muted-foreground mt-2">Role kaprodi</p>
          </div>
        </Card>

        <Card className="card-interactive border-2 border-red-200 dark:border-red-800 hover:border-red-400 dark:hover:border-red-600 group">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-bold text-muted-foreground">Super Admin</div>
              <Shield className="h-6 w-6 text-red-500 group-hover:scale-125 transition-transform duration-300" />
            </div>
            <div className="text-4xl font-bold text-red-600">{userStats.super_admin}</div>
            <p className="text-sm text-muted-foreground mt-2">Role super admin</p>
          </div>
        </Card>
      </div>

      <RoleManagementTable onEdit={handleEdit} />
    </div>
  )
}
