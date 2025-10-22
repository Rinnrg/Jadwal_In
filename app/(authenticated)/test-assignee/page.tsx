"use client"

import { useState } from "react"
import { AssigneePicker } from "@/components/subjects/AssigneePicker"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useUsersStore } from "@/stores/users.store"

export default function TestAssigneePickerPage() {
  const [selectedDosen, setSelectedDosen] = useState<string[]>([])
  const { users, getDosenUsers, fetchUsers } = useUsersStore()

  const handleSeedUsers = () => {
    // Fetch users from database
    fetchUsers()
  }

  const handleClearLocalStorage = () => {
    if (confirm("Apakah Anda yakin ingin menghapus semua data?")) {
      localStorage.clear()
      window.location.reload()
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Test Assignee Picker (Dropdown Dosen)</CardTitle>
          <CardDescription>
            Halaman ini untuk testing dropdown dosen pengampu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Debug Info */}
          <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h3 className="font-semibold">Debug Information:</h3>
            <p>Total Users: {users.length}</p>
            <p>Total Dosen: {getDosenUsers().length}</p>
            <p>Selected Dosen: {selectedDosen.length}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={handleSeedUsers} variant="outline">
              🔄 Refresh Users from Database
            </Button>
            <Button onClick={handleClearLocalStorage} variant="destructive">
              🗑️ Clear LocalStorage
            </Button>
          </div>

          {/* Assignee Picker */}
          <div className="space-y-2">
            <h3 className="font-semibold">Pilih Dosen Pengampu:</h3>
            <AssigneePicker
              value={selectedDosen}
              onChange={setSelectedDosen}
              placeholder="Klik untuk memilih dosen..."
            />
          </div>

          {/* Selected Dosen */}
          {selectedDosen.length > 0 && (
            <div className="space-y-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold">Dosen yang Dipilih:</h3>
              {(() => {
                const dosen = users.find(u => u.id === selectedDosen[0])
                return dosen ? (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{dosen.name}</span>
                    <span className="text-sm text-muted-foreground">({dosen.email})</span>
                  </div>
                ) : null
              })()}
            </div>
          )}

          {/* All Dosen List */}
          <div className="space-y-2">
            <h3 className="font-semibold">Semua Dosen di Database:</h3>
            {getDosenUsers().length === 0 ? (
              <p className="text-amber-600">
                ⚠️ Tidak ada dosen. Klik tombol "Refresh Users" atau tambahkan di halaman Role Management.
              </p>
            ) : (
              <ul className="list-disc list-inside">
                {getDosenUsers().map((dosen) => (
                  <li key={dosen.id}>
                    {dosen.name} ({dosen.email})
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
