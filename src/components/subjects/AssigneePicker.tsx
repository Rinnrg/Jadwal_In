"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { useUsersStore, seedInitialUsers } from "@/stores/users.store"
import { cn } from "@/lib/utils"

interface AssigneePickerProps {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
}

export function AssigneePicker({ value, onChange, placeholder = "Pilih dosen pengampu..." }: AssigneePickerProps) {
  const [open, setOpen] = useState(false)
  const { users, getDosenUsers } = useUsersStore()

  useEffect(() => {
    if (users.length === 0) {
      seedInitialUsers()
    }
  }, [users.length])

  const dosenUsers = getDosenUsers()
  const selectedUsers = dosenUsers.filter((user) => value.includes(user.id))

  const handleSelect = (userId: string) => {
    if (value.includes(userId)) {
      onChange(value.filter((id) => id !== userId))
    } else {
      onChange([...value, userId])
    }
  }

  const handleRemove = (userId: string) => {
    onChange(value.filter((id) => id !== userId))
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-transparent"
          >
            {selectedUsers.length > 0 ? `${selectedUsers.length} dosen dipilih` : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Cari dosen..." />
            <CommandList>
              <CommandEmpty>Tidak ada dosen ditemukan.</CommandEmpty>
              <CommandGroup>
                {dosenUsers.map((user) => (
                  <CommandItem key={user.id} value={user.name} onSelect={() => handleSelect(user.id)}>
                    <Check className={cn("mr-2 h-4 w-4", value.includes(user.id) ? "opacity-100" : "opacity-0")} />
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedUsers.map((user) => (
            <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
              {user.name}
              <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => handleRemove(user.id)} />
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
