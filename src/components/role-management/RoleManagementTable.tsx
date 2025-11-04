"use client"

import { useState } from "react"
import { useUsersStore } from "@/stores/users.store"
import type { User } from "@/data/schema"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Edit, Trash2, Search, Shield, User as UserIcon, GraduationCap, Users } from "lucide-react"
import { confirmAction, showSuccess, showError } from "@/lib/alerts"

interface RoleManagementTableProps {
  onEdit?: (user: User) => void
}

const getRoleIcon = (role: string) => {
  switch (role) {
    case "mahasiswa":
      return <GraduationCap className="h-4 w-4" />
    case "dosen":
      return <Users className="h-4 w-4" />
    case "kaprodi":
      return <UserIcon className="h-4 w-4" />
    case "super_admin":
      return <Shield className="h-4 w-4" />
    default:
      return <UserIcon className="h-4 w-4" />
  }
}

const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case "mahasiswa":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
    case "dosen":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    case "kaprodi":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
    case "super_admin":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
    default:
      return ""
  }
}

const getRoleLabel = (role: string) => {
  switch (role) {
    case "mahasiswa":
      return "Mahasiswa"
    case "dosen":
      return "Dosen"
    case "kaprodi":
      return "Kaprodi"
    case "super_admin":
      return "Super Admin"
    default:
      return role
  }
}

export function RoleManagementTable({ onEdit }: RoleManagementTableProps) {
  const { users, deleteUser } = useUsersStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("")

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = !roleFilter || user.role === roleFilter

    return matchesSearch && matchesRole
  })

  const handleDelete = async (user: User) => {
    // Prevent deleting super admin
    if (user.role === "super_admin") {
      confirmAction(
        "Tidak Dapat Menghapus",
        "Super Admin tidak dapat dihapus dari sistem.",
        "OK",
      )
      return
    }

    const confirmed = await confirmAction(
      "Hapus User",
      `Apakah Anda yakin ingin menghapus user "${user.name}"?`,
      "Ya, Hapus",
    )

    if (confirmed) {
      try {
        await deleteUser(user.id)
        showSuccess("User berhasil dihapus")
      } catch (error: any) {
        showError(error.message || "Gagal menghapus user")
      }
    }
  }

  const uniqueRoles = [...new Set(users.map((u) => u.role))]

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Daftar Users</h2>
            <p className="text-muted-foreground">Kelola pengguna dan role dalam sistem</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Cari user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 cursor-pointer"
              />
            </div>
            <div className="flex-1">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm cursor-pointer"
                aria-label="Filter berdasarkan role"
              >
                <option value="">Semua Role</option>
                {uniqueRoles.map((role) => (
                  <option key={role} value={role}>
                    {getRoleLabel(role)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm || roleFilter
                  ? "Tidak ada user yang sesuai dengan filter"
                  : "Belum ada user. Tambahkan user pertama Anda."}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>NIM/Info</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user, index) => (
                    <TableRow
                      key={user.id}
                      className="hover:bg-muted/50 transition-colors duration-200 animate-slide-in-left"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.role === "mahasiswa" && user.nim ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-mono text-sm font-medium">{user.nim}</span>
                            <span className="text-xs text-muted-foreground">
                              Angkatan {user.angkatan}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                          <span className="flex items-center gap-1">
                            {getRoleIcon(user.role)}
                            {getRoleLabel(user.role)}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200"
                            onClick={() => onEdit?.(user)}
                          >
                            <Edit className="h-4 w-4 mr-1.5" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 cursor-pointer hover:bg-destructive/10 text-destructive transition-colors duration-200"
                            onClick={() => handleDelete(user)}
                            disabled={user.role === "super_admin"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
