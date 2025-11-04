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
      name: "jadwalin:profile:v3", // Bumped version for removing kelas field
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any, version) => {
        if (version === 0 || version === 1 || version === 2) {
          const profiles = (persistedState?.profiles || []).map((profile: any) => {
            // Remove kelas field as it's no longer in Profile model
            const { kelas, bio, website, ...rest } = profile
            return rest
          })
          return { profiles }
        }
        return persistedState
      },
    },
  ),
)
