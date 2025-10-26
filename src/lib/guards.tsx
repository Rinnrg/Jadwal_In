"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSessionStore } from "@/stores/session.store"
import { PageLoading } from "@/components/ui/loading"

// Hydration Guard to prevent hydration mismatch
export function HydrationGuard({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [showLoading, setShowLoading] = useState(true)

  useEffect(() => {
    // Add minimum delay untuk memastikan animasi terlihat
    const timer = setTimeout(() => {
      setMounted(true)
      // Add extra delay setelah mounted untuk animasi
      setTimeout(() => {
        setShowLoading(false)
      }, 800) // 800ms tambahan setelah mounted
    }, 500) // 500ms minimum delay

    return () => clearTimeout(timer)
  }, [])

  if (!mounted || showLoading) {
    return <PageLoading message="Memuat aplikasi..." />
  }

  return <>{children}</>
}

// Protected route guard
export function Protected({ children }: { children: React.ReactNode }) {
  const { session, setSession, hasHydrated } = useSessionStore()
  const [hasMounted, setHasMounted] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(false) // Changed: default false
  const [minLoadingComplete, setMinLoadingComplete] = useState(false)
  const fetchingRef = useRef(false)
  const hasCheckedRef = useRef(false)
  const router = useRouter()

  // Minimum loading time untuk animasi
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadingComplete(true)
    }, 1000) // 1 detik minimum loading

    return () => clearTimeout(timer)
  }, [])

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
  if (!hasMounted || !hasHydrated || !minLoadingComplete) {
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

