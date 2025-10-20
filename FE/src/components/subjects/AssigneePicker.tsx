"use client"

import { useEffect } from "react"
import { useUsersStore, seedInitialUsers } from "@/stores/users.store"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AssigneePickerProps {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
}

export function AssigneePicker({ value, onChange, placeholder = "Pilih dosen pengampu..." }: AssigneePickerProps) {
  const { users, getDosenUsers } = useUsersStore()

  useEffect(() => {
    // Always ensure initial users are seeded
    const dosenCount = users.filter(u => u.role === "dosen").length
    if (dosenCount === 0) {
      seedInitialUsers()
    }
  }, [users])

  const dosenUsers = getDosenUsers()
  const selectedDosenId = value.length > 0 ? value[0] : ""
  const selectedDosen = dosenUsers.find(user => user.id === selectedDosenId)

  const handleValueChange = (dosenId: string) => {
    if (dosenId === "none") {
      onChange([])
    } else {
      onChange([dosenId])
    }
  }

  return (
    <div className="space-y-2">
      <Select value={selectedDosenId || "none"} onValueChange={handleValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder}>
            {selectedDosen ? selectedDosen.name : placeholder}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <span className="text-muted-foreground">Tidak ada dosen</span>
          </SelectItem>
          {dosenUsers.length === 0 ? (
            <SelectItem value="empty" disabled>
              <span className="text-amber-600">Belum ada data dosen</span>
            </SelectItem>
          ) : (
            dosenUsers.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{user.name}</span>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {dosenUsers.length === 0 && (
        <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
          ⚠️ Belum ada data dosen. Data dosen akan ditambahkan secara otomatis saat halaman dimuat ulang.
        </p>
      )}
    </div>
  )
}
