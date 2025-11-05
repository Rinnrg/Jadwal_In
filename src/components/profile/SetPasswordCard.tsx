"use client"

import { useState } from "react"
import { useSessionStore } from "@/stores/session.store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { showSuccess } from "@/lib/alerts"
import { Eye, EyeOff, KeyRound, Loader2, CheckCircle2 } from "lucide-react"
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface SetPasswordCardProps {
  onSuccess?: () => void
}

export function SetPasswordCard({ onSuccess }: SetPasswordCardProps) {
  const { session } = useSessionStore()
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const validatePassword = () => {
    if (newPassword.length < 6) {
      setError("Password minimal 6 karakter")
      return false
    }
    if (newPassword !== confirmPassword) {
      setError("Password tidak cocok")
      return false
    }
    setError("")
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validatePassword()) return
    if (!session) return

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.id,
          newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengatur password')
      }

      showSuccess(data.message || 'Password berhasil diatur!')
      setNewPassword("")
      setConfirmPassword("")
      
      if (onSuccess) {
        setTimeout(() => {
          onSuccess()
        }, 500)
      }
    } catch (error: any) {
      console.error('Set password error:', error)
      setError(error.message || 'Gagal mengatur password. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <DialogHeader className="space-y-1">
        <DialogTitle className="flex items-center gap-2 text-lg">
          <KeyRound className="h-4 w-4" />
          Atur Password
        </DialogTitle>
        <DialogDescription className="text-xs sm:text-sm">
          Atur password untuk akun yang login via Google Sign-In
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <Alert variant="destructive" className="py-2">
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 py-2">
          <AlertDescription className="text-xs text-blue-800 dark:text-blue-200">
            <p className="font-semibold mb-1">💡 Informasi:</p>
            <p className="mb-1">Setelah mengatur password, Anda dapat login menggunakan:</p>
            <ul className="list-disc list-inside space-y-0.5 text-xs">
              <li>Google Sign-In (seperti biasa)</li>
              <li>Email & Password (baru)</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="space-y-1.5">
          <Label htmlFor="newPassword" className="text-sm">Password Baru</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showNewPassword ? "text" : "password"}
              placeholder="Minimal 6 karakter"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isLoading}
              required
              minLength={6}
              className="pr-10 h-9 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              disabled={isLoading}
            >
              {showNewPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-sm">Konfirmasi Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Ketik ulang password baru"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              required
              minLength={6}
              className="pr-10 h-9 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              disabled={isLoading}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <Button
            type="submit"
            disabled={isLoading || !newPassword || !confirmPassword}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto h-9 text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                Simpan Password
              </>
            )}
          </Button>
        </div>
      </form>
    </>
  )
}
