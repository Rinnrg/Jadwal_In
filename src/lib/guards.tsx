"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSessionStore } from "@/stores/session.store"
import { PageLoading } from "@/components/ui/loading"

// Hydration Guard to prevent hydration mismatch
export function HydrationGuard({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <PageLoading message="Memuat aplikasi..." />
  }

  return <>{children}</>
}

// Protected route guard
export function Protected({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { session, hasHydrated } = useSessionStore()
  const [hasMounted, setHasMounted] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    if (hasMounted && hasHydrated) {
      // Check both session from store and cookie
      const hasAuthCookie = typeof document !== 'undefined' 
        ? document.cookie.includes('jadwalin-auth=true')
        : false

      // If no session AND no auth cookie, redirect to login
      if (!session && !hasAuthCookie) {
        router.replace("/login")
        return
      }
      
      // If we have cookie but no session, user might need to re-login
      if (!session && hasAuthCookie) {
        // Clear invalid cookie and redirect with proper attributes
        const isProduction = window.location.protocol === 'https:'
        const cookieAttributes = [
          "jadwalin-auth=",
          "path=/",
          "expires=Thu, 01 Jan 1970 00:00:00 GMT",
          "SameSite=Lax"
        ]
        
        if (isProduction) {
          cookieAttributes.push("Secure")
        }
        
        document.cookie = cookieAttributes.join("; ")
        router.replace("/login")
        return
      }

      setIsCheckingAuth(false)
    }
  }, [session, hasMounted, hasHydrated, router])

  // Show loading while mounting, hydrating, or checking auth
  if (!hasMounted || !hasHydrated || isCheckingAuth) {
    return <PageLoading message="Memverifikasi sesi..." />
  }

  // If no session, don't render anything (will redirect)
  if (!session) {
    return <PageLoading message="Mengalihkan ke halaman login..." />
  }

  return <>{children}</>
}
