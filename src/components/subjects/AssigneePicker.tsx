"use client"

import { useEffect, useState } from "react"
import { useUsersStore, seedInitialUsers } from "@/stores/users.store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown, X, Users } from "lucide-react"
import { cn } from "@/lib/utils"

interface AssigneePickerProps {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
}

export function AssigneePicker({ value, onChange, placeholder = "Pilih dosen pengampu..." }: AssigneePickerProps) {
  const { users, getDosenUsers } = useUsersStore()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Always ensure initial users are seeded
    const dosenCount = users.filter(u => u.role === "dosen").length
    if (dosenCount === 0) {
      seedInitialUsers()
    }
  }, [users])

  const dosenUsers = getDosenUsers()
  const selectedDosen = dosenUsers.filter(user => value.includes(user.id))

  const toggleDosen = (dosenId: string) => {
    const newValue = value.includes(dosenId)
      ? value.filter(id => id !== dosenId)
      : [...value, dosenId]
    onChange(newValue)
  }

  const removeDosen = (dosenId: string) => {
    onChange(value.filter(id => id !== dosenId))
  }

  const clearAll = () => {
    onChange([])
  }

  return (
    <div className="space-y-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between hover:bg-accent"
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {selectedDosen.length === 0
                  ? placeholder
                  : `${selectedDosen.length} dosen dipilih`}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Cari dosen..." />
            <CommandList>
              <CommandEmpty>
                {dosenUsers.length === 0 
                  ? "Belum ada data dosen" 
                  : "Dosen tidak ditemukan"}
              </CommandEmpty>
              <CommandGroup>
                {dosenUsers.map((user) => {
                  const isSelected = value.includes(user.id)
                  return (
                    <CommandItem
                      key={user.id}
                      onSelect={() => toggleDosen(user.id)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleDosen(user.id)}
                          className="pointer-events-none"
                        />
                        <div className="flex flex-col flex-1">
                          <span className="font-medium">{user.name}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

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
                    <span className="text-[10px] text-muted-foreground">{user.email}</span>
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
          ⚠️ Belum ada data dosen. Data dosen akan ditambahkan secara otomatis saat halaman dimuat ulang.
        </p>
      )}
    </div>
  )
}
