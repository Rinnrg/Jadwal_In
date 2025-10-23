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
  const { session, setSession, hasHydrated } = useSessionStore()
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    if (!hasMounted || !hasHydrated) return

    // Check for auth cookies
    const hasManualCookie = document.cookie.includes('jadwalin-auth=true')
    const hasGoogleCookie = document.cookie.includes('session_token=')

    // If no cookies AND no session in store, let middleware handle redirect
    if (!hasManualCookie && !hasGoogleCookie && !session) {
      // Don't redirect here, let middleware handle it to avoid race conditions
      console.log('[Protected] No auth found, middleware will redirect')
      return
    }

    // If has Google cookie but no session in store, fetch in background
    if (hasGoogleCookie && !session) {
      // Fetch session in background, don't block rendering
      fetch('/api/auth/session', { 
        cache: 'no-store',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            setSession({
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              role: data.user.role,
              image: data.user.image,
            })
          } else {
            // Invalid session, clear and let middleware redirect
            console.log('[Protected] Invalid session, clearing')
          }
        })
        .catch((error) => {
          console.error('Failed to fetch session:', error)
          // Don't redirect on fetch error, middleware will handle auth
        })
    }
  }, [hasMounted, hasHydrated, session, setSession])

  // Only show loading during hydration
  if (!hasMounted || !hasHydrated) {
    return <PageLoading message="Memuat..." />
  }

  // Render immediately if cookie exists (middleware protects the route)
  return <>{children}</>
}

