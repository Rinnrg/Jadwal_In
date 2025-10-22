"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EKTMCard } from "./EKTMCard"

interface EKTMDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  name: string
  nim: string
  fakultas: string
  programStudi: string
  avatarUrl?: string
}

export function EKTMDialog({
  open,
  onOpenChange,
  name,
  nim,
  fakultas,
  programStudi,
  avatarUrl,
}: EKTMDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px] w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-center sm:text-left">E-KTM (Kartu Tanda Mahasiswa)</DialogTitle>
        </DialogHeader>
        <div className="py-4 px-2 sm:px-4">
          <EKTMCard
            name={name}
            nim={nim}
            fakultas={fakultas}
            programStudi={programStudi}
            avatarUrl={avatarUrl}
          />
          <p className="text-center text-xs sm:text-sm text-muted-foreground mt-4">
            Scan QR code untuk melihat E-KTM
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
