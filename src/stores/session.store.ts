import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { UserSession } from "@/data/schema"

interface SessionState {
  session: UserSession | null
  isLoading: boolean
  hasHydrated: boolean
  setSession: (session: UserSession | null) => void
  setLoading: (loading: boolean) => void
  updateSessionImage: (imageUrl: string) => void
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
      setSession: (session) => {
        console.log('[SessionStore] setSession called with:', session?.email || 'null')
        console.log('[SessionStore] Current state before set:', get().session?.email || 'null')
        set({ session, isLoading: false })
        console.log('[SessionStore] State after set:', get().session?.email || 'null')
      },
      setLoading: (isLoading) => set({ isLoading }),
      updateSessionImage: (imageUrl) => {
        const { session } = get()
        if (session) {
          set({ session: { ...session, image: imageUrl } })
        }
      },
      logout: () => {
        console.log('[SessionStore] logout() called')
        
        // Clear session from store
        set({ session: null, isLoading: false })
        console.log('[SessionStore] Session cleared from store')
        
        // Clear localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('jadwalin:session:v1')
          console.log('[SessionStore] localStorage cleared')
        }
        
        // Clear all auth cookies
        if (typeof document !== 'undefined') {
          // Clear session_token cookie (both secure and non-secure)
          document.cookie = "session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax"
          document.cookie = "session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure"
          
          // Clear jadwalin-auth cookie (both secure and non-secure)
          document.cookie = "jadwalin-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax"
          document.cookie = "jadwalin-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure"
          
          console.log('[SessionStore] Cookies cleared')
        }
        
        console.log('[SessionStore] Logout complete')
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
