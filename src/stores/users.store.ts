import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { User } from "@/data/schema"
import { arr, generateId } from "@/lib/utils"

interface UsersState {
  users: User[]
  isLoading: boolean
  error: string | null
  lastCreatedCredentials: { email: string; password: string; nim?: string } | null
  fetchUsers: () => Promise<void>
  addUser: (user: any) => Promise<{ email: string; password: string; nim?: string } | null>
  updateUser: (id: string, updates: Partial<User>) => Promise<void>
  deleteUser: (id: string) => Promise<void>
  getUserById: (id: string) => User | undefined
  getUsersByRole: (role: User["role"]) => User[]
  getDosenUsers: () => User[]
  getMahasiswaUsers: () => User[]
  getDosenAndKaprodiUsers: () => User[] // New function for pengampu selection
  clearCredentials: () => void
}

export const useUsersStore = create<UsersState>()(
  persist(
    (set, get) => ({
      users: [],
      isLoading: false,
      error: null,
      lastCreatedCredentials: null,
      
      fetchUsers: async () => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch("/api/users")
          if (!response.ok) {
            throw new Error("Failed to fetch users")
          }
          const data = await response.json()
          set({ users: data.users || [], isLoading: false })
        } catch (error) {
          console.error("Fetch users error:", error)
          set({ error: "Gagal mengambil data users", isLoading: false })
        }
      },
      
      addUser: async (user) => {
        set({ isLoading: true, error: null, lastCreatedCredentials: null })
        try {
          const response = await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(user),
          })
          
          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || "Failed to add user")
          }
          
          const data = await response.json()
          set((state) => ({
            users: [...state.users, data.user],
            isLoading: false,
            lastCreatedCredentials: data.credentials || null,
          }))
          
          return data.credentials || null
        } catch (error: any) {
          console.error("Add user error:", error)
          set({ error: error.message || "Gagal menambah user", isLoading: false })
          throw error
        }
      },
      
      updateUser: async (id, updates) => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch(`/api/users?id=${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          })
          
          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || "Failed to update user")
          }
          
          const data = await response.json()
          set((state) => ({
            users: state.users.map((user) => (user.id === id ? data.user : user)),
            isLoading: false,
          }))
        } catch (error: any) {
          console.error("Update user error:", error)
          set({ error: error.message || "Gagal mengupdate user", isLoading: false })
          throw error
        }
      },
      
      deleteUser: async (id) => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch(`/api/users?id=${id}`, {
            method: "DELETE",
          })
          
          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || "Failed to delete user")
          }
          
          set((state) => ({
            users: state.users.filter((user) => user.id !== id),
            isLoading: false,
          }))
        } catch (error: any) {
          console.error("Delete user error:", error)
          set({ error: error.message || "Gagal menghapus user", isLoading: false })
          throw error
        }
      },
      
      getUserById: (id) => {
        return get().users.find((user) => user.id === id)
      },
      getUsersByRole: (role) => {
        return get().users.filter((user) => user.role === role)
      },
      getDosenUsers: () => {
        return get().users.filter((user) => user.role === "dosen")
      },
      getMahasiswaUsers: () => {
        return get().users.filter((user) => user.role === "mahasiswa")
      },
      // Get all users who can be pengampu (dosen + kaprodi)
      getDosenAndKaprodiUsers: () => {
        return get().users.filter((user) => user.role === "dosen" || user.role === "kaprodi")
      },
      clearCredentials: () => {
        set({ lastCreatedCredentials: null })
      },
    }),
    {
      name: "jadwalin:users:v1",
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any, version) => {
        if (version === 0) {
          return { users: arr(persistedState?.users) }
        }
        return persistedState
      },
    },
  ),
)

// Auto-fetch users on first load
if (typeof window !== 'undefined') {
  useUsersStore.getState().fetchUsers()
}
