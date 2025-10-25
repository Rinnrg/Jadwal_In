"use client"

import { useEffect, useState } from "react"
import { useUsersStore } from "@/stores/users.store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { X, Users } from "lucide-react"

interface AssigneePickerProps {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
}

export function AssigneePicker({ value, onChange, placeholder = "Pilih dosen pengampu..." }: AssigneePickerProps) {
  const { users, getDosenAndKaprodiUsers, fetchUsers } = useUsersStore()
  const [selectedDosenId, setSelectedDosenId] = useState<string>("")

  useEffect(() => {
    // Fetch users from database if empty
    const dosenCount = users.filter(u => u.role === "dosen" || u.role === "kaprodi").length
    if (dosenCount === 0) {
      fetchUsers()
    }
  }, [users, fetchUsers])

  const dosenUsers = getDosenAndKaprodiUsers() // Now includes both dosen and kaprodi
  const selectedDosen = dosenUsers.filter(user => value.includes(user.id))

  // Handle selecting dosen from dropdown
  const handleSelectDosen = (dosenId: string) => {
    if (dosenId && !value.includes(dosenId)) {
      onChange([...value, dosenId])
    }
    setSelectedDosenId("") // Reset dropdown after selection
  }

  const removeDosen = (dosenId: string) => {
    onChange(value.filter(id => id !== dosenId))
  }

  const clearAll = () => {
    onChange([])
  }

  // Filter out already selected dosen
  const availableDosen = dosenUsers.filter(user => !value.includes(user.id))

  return (
    <div className="space-y-3">
      {/* Dropdown Select */}
      <Select value={selectedDosenId} onValueChange={handleSelectDosen}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Daftar Dosen & Kaprodi</SelectLabel>
            {availableDosen.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {dosenUsers.length === 0 
                  ? "Belum ada data dosen/kaprodi" 
                  : "Semua dosen/kaprodi sudah dipilih"}
              </div>
            ) : (
              availableDosen.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {user.email} • {user.role === "kaprodi" ? "Kaprodi" : "Dosen"}
                    </span>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectGroup>
        </SelectContent>
      </Select>

      {/* Selected Dosen Tags */}
      {selectedDosen.length > 0 && (
        <Card className="border-2 border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Dosen Pengampu Terpilih ({selectedDosen.length})
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-7 text-xs text-muted-foreground hover:text-destructive"
              >
                Hapus Semua
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedDosen.map((user) => (
                <Badge
                  key={user.id}
                  variant="secondary"
                  className="pl-3 pr-1 py-1.5 gap-2 hover:bg-secondary/80 transition-colors"
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-xs">{user.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {user.email} • {user.role === "kaprodi" ? "Kaprodi" : "Dosen"}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDosen(user.id)}
                    className="h-5 w-5 p-0 hover:bg-destructive/20 hover:text-destructive rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {dosenUsers.length === 0 && (
        <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
          ⚠️ Belum ada data dosen/kaprodi. Data akan ditambahkan secara otomatis saat halaman dimuat ulang.
        </p>
      )}
    </div>
  )
}
