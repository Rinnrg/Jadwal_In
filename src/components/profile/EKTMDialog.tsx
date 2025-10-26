"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { EKTMCardWithTilt } from "./EKTMCardWithTilt"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EKTMDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  name: string
  nim: string
  fakultas: string
  programStudi: string
  avatarUrl?: string
  userId?: string // For Google Auth users
}

export function EKTMDialog({
  open,
  onOpenChange,
  name,
  nim,
  fakultas,
  programStudi,
  avatarUrl,
  userId,
}: EKTMDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-none w-full h-full p-0 border-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900"
        aria-describedby={undefined}
        onPointerDownOutside={() => onOpenChange(false)}
        onEscapeKeyDown={() => onOpenChange(false)}
      >
        {/* Close Button */}
        <Button
          onClick={() => onOpenChange(false)}
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-50 text-white hover:bg-white/10 rounded-full h-10 w-10"
        >
          <X className="h-6 w-6" />
        </Button>

        {/* Content */}
        <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-8">
          {/* Title */}
          <h2 className="text-white text-xl sm:text-2xl md:text-3xl font-bold mb-6 sm:mb-8 text-center">
            E-KTM
          </h2>
          
          {/* E-KTM Card */}
          <div className="w-full max-w-lg">
            <EKTMCardWithTilt
              name={name}
              nim={nim}
              fakultas={fakultas}
              programStudi={programStudi}
              avatarUrl={avatarUrl}
              userId={userId}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
