import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { UserSession } from "@/data/schema"

interface SessionState {
  session: UserSession | null
  isLoading: boolean
  hasHydrated: boolean
  setSession: (session: UserSession | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

// Helper function to migrate old name format to new format
const migrateSessionName = (session: UserSession): UserSession => {
  // Check if name is in old format: "Nama - NIM (Role)"
  const oldFormatMatch = session.name.match(/^(.+?)\s*-\s*(\d+)\s*\((.+?)\)$/)
  
  if (oldFormatMatch && session.role === 'mahasiswa') {
    const [, nama, nim, role] = oldFormatMatch
    
    // Extract angkatan from first 2 digits of NIM
    if (nim && nim.length >= 2) {
      const yearPrefix = nim.substring(0, 2)
      const angkatan = 2000 + parseInt(yearPrefix)
      
      return {
        ...session,
        name: `${nama.trim()} (Angkatan ${angkatan})`
      }
    }
  }
  
  // Check if name is in old format for dosen/kaprodi: "Nama - NIM (Role)"
  const dosenFormatMatch = session.name.match(/^(.+?)\s*-\s*\d+\s*\((.+?)\)$/)
  if (dosenFormatMatch && (session.role === 'dosen' || session.role === 'kaprodi')) {
    const [, nama] = dosenFormatMatch
    return {
      ...session,
      name: nama.trim()
    }
  }
  
  return session
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      session: null,
      isLoading: false, // Changed: Start with false instead of true
      hasHydrated: false,
      setSession: (session) => set({ session, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => {
        // Remove auth cookie with proper attributes
        if (typeof document !== 'undefined') {
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
        }
        set({ session: null, isLoading: false })
      },
    }),
    {
      name: "jadwalin:session:v1",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => {
        return (state) => {
          // Mark as hydrated immediately
          if (state) {
            state.hasHydrated = true
            state.isLoading = false
            
            // Migrate old session format to new format
            if (state.session) {
              const migratedSession = migrateSessionName(state.session)
              if (migratedSession.name !== state.session.name) {
                console.log('Migrating session name format:', state.session.name, '->', migratedSession.name)
                state.session = migratedSession
              }
            }
          }
        }
      },
    },
  ),
)
