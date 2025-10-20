"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSessionStore } from "@/stores/session.store"

export default function AuthPage() {
  const router = useRouter()
  const { session, hasHydrated } = useSessionStore()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (hasHydrated) {
      const hasAuthCookie = document.cookie.includes('jadwalin-auth=true')
      
      // Quick decision based on session and cookie
      if (session && hasAuthCookie) {
        router.replace('/dashboard')
      } else {
        // Clear any stale cookie and go to login
        if (hasAuthCookie && !session) {
          document.cookie = "jadwalin-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        }
        router.replace('/login')
      }
      setIsChecking(false)
    }
  }, [router, session, hasHydrated])

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  return null
}
