"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
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
  const [isLoadingSession, setIsLoadingSession] = useState(false)
  const fetchingRef = useRef(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    if (!hasMounted || !hasHydrated) return
    if (fetchingRef.current) return // Already fetching
    if (session) return // Already have session

    console.log('[Protected] No session in store, fetching from API...')
    fetchingRef.current = true
    setIsLoadingSession(true)
    
    // Always try to fetch session from API
    // This works for both manual and Google auth (httpOnly cookie)
    fetch('/api/auth/session', { 
      cache: 'no-store',
      credentials: 'include', // Important! Include httpOnly cookies
    })
      .then(res => {
        console.log('[Protected] API response status:', res.status)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => {
        console.log('[Protected] API response data:', data)
        if (data.user) {
          console.log('[Protected] Session found! Email:', data.user.email)
          
          const newSession = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            role: data.user.role,
            image: data.user.image,
          }
          
          console.log('[Protected] Calling setSession with:', newSession)
          setSession(newSession)
          
          // Verify after set
          setTimeout(() => {
            console.log('[Protected] Verification - session should be set')
          }, 50)
        } else {
          console.log('[Protected] No valid session from API')
        }
      })
      .catch((error) => {
        console.error('[Protected] Failed to fetch session:', error)
      })
      .finally(() => {
        setIsLoadingSession(false)
      })
  }, [hasMounted, hasHydrated, session, setSession])

  // Show loading during hydration OR session fetch
  if (!hasMounted || !hasHydrated || isLoadingSession) {
    return <PageLoading message="Memuat sesi..." />
  }

  // Render children immediately, let dashboard handle its own loading
  return <>{children}</>
}

