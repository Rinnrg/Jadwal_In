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
  const [isCheckingSession, setIsCheckingSession] = useState(false) // Changed: default false
  const fetchingRef = useRef(false)
  const hasCheckedRef = useRef(false)
  const router = useRouter()

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    if (!hasMounted || !hasHydrated) return
    if (fetchingRef.current) return // Already fetching
    if (hasCheckedRef.current) return // Already checked once

    // If we already have a session from localStorage, use it immediately
    if (session) {
      console.log('[Protected] Session found in store:', session.email)
      hasCheckedRef.current = true
      return
    }

    console.log('[Protected] No session in store, fetching from API...')
    fetchingRef.current = true
    hasCheckedRef.current = true
    setIsCheckingSession(true)
    
    // Try to fetch session from API (for httpOnly cookies)
    fetch('/api/auth/session', { 
      cache: 'no-store',
      credentials: 'include',
    })
      .then(res => {
        console.log('[Protected] API response status:', res.status)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => {
        console.log('[Protected] API response data:', data)
        if (data.user) {
          console.log('[Protected] Session found from API! Email:', data.user.email)
          
          const newSession = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            role: data.user.role,
            image: data.user.image,
          }
          
          setSession(newSession)
          setIsCheckingSession(false)
        } else {
          console.log('[Protected] No session from API, redirecting to login...')
          // Direct redirect without showing loading
          window.location.href = '/login'
        }
      })
      .catch((error) => {
        console.error('[Protected] Failed to fetch session:', error)
        // Direct redirect without showing loading
        window.location.href = '/login'
      })
      .finally(() => {
        fetchingRef.current = false
        setIsCheckingSession(false)
      })
  }, [hasMounted, hasHydrated, setSession, router])

  // Show loading ONLY during initial hydration or when actively checking session
  if (!hasMounted || !hasHydrated) {
    return <PageLoading message="Memuat aplikasi..." />
  }

  if (isCheckingSession) {
    return <PageLoading message="Memuat sesi..." />
  }

  // If no session after check, don't render (redirect will handle)
  if (!session) {
    return null
  }

  // Render children immediately when we have a valid session
  return <>{children}</>
}

