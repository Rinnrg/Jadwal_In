import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { Profile } from "@/data/schema"

interface ProfileState {
  profiles: Profile[]
  getProfile: (userId: string) => Profile | undefined
  updateProfile: (userId: string, updates: Partial<Profile>) => void
  createProfile: (profile: Omit<Profile, "userId"> & { userId: string }) => void
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profiles: [],
      getProfile: (userId) => {
        return get().profiles.find((profile) => profile.userId === userId)
      },
      updateProfile: (userId, updates) => {
        set((state) => ({
          profiles: state.profiles.map((profile) => (profile.userId === userId ? { ...profile, ...updates } : profile)),
        }))
      },
      createProfile: (profile) => {
        set((state) => ({
          profiles: [...state.profiles, profile],
        }))
      },
    }),
    {
      name: "jadwalin:profile:v2", // Bumped version for kelas field migration
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any, version) => {
        if (version === 0 || version === 1) {
          const profiles = (persistedState?.profiles || []).map((profile: any) => ({
            ...profile,
            kelas: profile.kelas || "A", // Default kelas if missing
          }))
          return { profiles }
        }
        return persistedState
      },
    },
  ),
)
