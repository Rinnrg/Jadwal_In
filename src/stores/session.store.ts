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

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      session: null,
      isLoading: false, // Changed: Start with false instead of true
      hasHydrated: false,
      setSession: (session) => set({ session, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => {
        // Remove auth cookie
        if (typeof document !== 'undefined') {
          document.cookie = "jadwalin-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
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
          }
        }
      },
    },
  ),
)
