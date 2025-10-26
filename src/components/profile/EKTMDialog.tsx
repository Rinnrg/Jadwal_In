"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EKTMCardWithTilt } from "./EKTMCardWithTilt"

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
      <DialogContent className="max-w-[520px] w-[97vw] sm:w-full p-2 sm:p-6">
        <DialogHeader className="mb-0.5 sm:mb-2 px-2 sm:px-0">
          <DialogTitle className="text-center sm:text-left text-xs sm:text-lg font-semibold">
            E-KTM (Kartu Tanda Mahasiswa)
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-hidden">
          <EKTMCardWithTilt
            name={name}
            nim={nim}
            fakultas={fakultas}
            programStudi={programStudi}
            avatarUrl={avatarUrl}
          />
          <p className="text-center text-[9px] sm:text-sm text-muted-foreground mt-2 sm:mt-4">
            Scan QR code untuk melihat E-KTM
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
