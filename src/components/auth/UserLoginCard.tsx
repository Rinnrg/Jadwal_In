"use client"

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2, Mail, Lock, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react'
import Image from 'next/image'
import { useSessionStore } from '@/stores/session.store'
import { SuccessAnimation } from './SuccessAnimation'

// Google Icon SVG component
const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
)

export function UserLoginCard() {
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [buttonState, setButtonState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  
  const searchParams = useSearchParams()
  const router = useRouter()
  const { setSession } = useSessionStore()
  const error = searchParams.get('error')
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setButtonState('loading')
    setLoginError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
      setLoginError(data.error || 'Gagal login. Silakan coba lagi.')
      setButtonState('error')
      setIsLoading(false)
      
      // Reset button state lebih cepat
      setTimeout(() => {
        setButtonState('idle')
      }, 1000)
      return
    }      // Success state
      setButtonState('success')
      
      // Set session in store FIRST
      if (data.user) {
        const sessionData = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          image: data.user.image,
        }
        
        console.log('Setting session in store:', sessionData)
        setSession(sessionData)
        
        // Force save to localStorage immediately
        if (typeof window !== 'undefined') {
          localStorage.setItem('jadwalin:session:v1', JSON.stringify({
            state: { session: sessionData, isLoading: false, hasHydrated: true },
            version: 0
          }))
        }
      }
      
      // Show success animation IMMEDIATELY
      console.log('Login successful, showing animation...')
      setShowSuccessAnimation(true)

      // Minimal delay - hanya untuk animasi selesai
      setTimeout(() => {
        console.log('Redirecting to:', callbackUrl)
        window.location.href = callbackUrl
      }, 1500) // Sangat cepat - 1.5 detik total
    } catch (error) {
      console.error('Login error:', error)
      setLoginError('Gagal login. Silakan coba lagi.')
      setButtonState('error')
      setIsLoading(false)
      
      // Reset button state lebih cepat
      setTimeout(() => {
        setButtonState('idle')
      }, 1000)
    }
  }

  const handleGoogleSignIn = () => {
    setIsGoogleLoading(true)
    window.location.href = `/api/auth/google/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`
  }

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'no_code':
        return 'Tidak ada authorization code dari Google'
      case 'no_email':
        return 'Tidak dapat mengambil email dari Google'
      case 'callback_failed':
        return 'Gagal memproses autentikasi Google'
      case 'access_denied':
        return 'Akses ditolak. Anda membatalkan login.'
      default:
        return error ? `Error: ${error}` : null
    }
  }

  const errorMessage = getErrorMessage(error) || loginError
  
  return (
    <>
      {showSuccessAnimation && (
        <SuccessAnimation 
          onComplete={() => {
            window.location.href = callbackUrl
          }}
        />
      )}
      
      <Card className="w-full max-w-[440px] mx-auto border-0 shadow-2xl bg-card/95 backdrop-blur-xl animate-fade-in overflow-hidden">
      <CardContent className="p-5 sm:p-6 space-y-4">
        {/* Logo and Title Section */}
        <div className="text-center space-y-2 animate-slide-up">
          <div className="flex items-center justify-center gap-2.5">
            <Image 
              src="/logo jadwal in.svg" 
              alt="Jadwal-In Logo" 
              width={40} 
              height={40}
              className="w-10 h-10"
              priority
            />
            <h1 className="text-2xl font-bold text-blue-600">
              Jadwal_In
            </h1>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Masuk ke akun Anda untuk mengakses jadwal dan KRS
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <Alert variant="destructive" className="animate-shake">
            <AlertDescription className="text-sm">{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Login Form */}
        <form onSubmit={handleEmailLogin} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="isi dengan email anda"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-10"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-10"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className={`w-full h-10 text-base font-medium text-white transition-all duration-300 ${
              buttonState === 'success' 
                ? 'bg-green-600 hover:bg-green-600 scale-105' 
                : buttonState === 'error'
                ? 'bg-red-600 hover:bg-red-600 animate-shake'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {buttonState === 'loading' ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Masuk...</span>
              </div>
            ) : buttonState === 'success' ? (
              <div className="flex items-center gap-2 animate-scale-in">
                <CheckCircle2 className="h-5 w-5" />
                <span>Berhasil!</span>
              </div>
            ) : buttonState === 'error' ? (
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                <span>Gagal Masuk</span>
              </div>
            ) : (
              'Masuk'
            )}
          </Button>

          {/* Divider */}
          <div className="relative py-1.5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground font-medium">
                Atau lanjutkan dengan
              </span>
            </div>
          </div>

          {/* Google Sign In Button */}
          <Button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            variant="outline"
            className="w-full h-10 text-base font-medium bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100 border-2 group"
          >
            {isGoogleLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="group-hover:inline">Menghubungkan...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <GoogleIcon />
                <span className="group-hover:inline">Google</span>
              </div>
            )}
          </Button>
        </form>

        {/* Footer Links */}
        <div className="text-center pt-0.5">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Dengan masuk, Anda menyetujui{' '}
            <a href="/terms" className="text-primary hover:underline font-medium transition-colors">
              Syarat & Ketentuan
            </a>
            {' '}dan{' '}
            <a href="/privacy" className="text-primary hover:underline font-medium transition-colors">
              Kebijakan Privasi
            </a>
            {' '}kami
          </p>
        </div>
      </CardContent>
    </Card>
    </>
  )
}
