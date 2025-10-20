import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { User } from "@/data/schema"
import { arr, generateId } from "@/lib/utils"

interface UsersState {
  users: User[]
  addUser: (user: Omit<User, "id">) => void
  updateUser: (id: string, updates: Partial<User>) => void
  deleteUser: (id: string) => void
  getUserById: (id: string) => User | undefined
  getUsersByRole: (role: User["role"]) => User[]
  getDosenUsers: () => User[]
  getMahasiswaUsers: () => User[]
}

export const useUsersStore = create<UsersState>()(
  persist(
    (set, get) => ({
      users: [],
      addUser: (user) => {
        const newUser: User = {
          ...user,
          id: generateId(),
        }
        set((state) => ({
          users: [...state.users, newUser],
        }))
      },
      updateUser: (id, updates) => {
        set((state) => ({
          users: state.users.map((user) => (user.id === id ? { ...user, ...updates } : user)),
        }))
      },
      deleteUser: (id) => {
        set((state) => ({
          users: state.users.filter((user) => user.id !== id),
        }))
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

// Seed some initial users if store is empty
export const seedInitialUsers = () => {
  const store = useUsersStore.getState()
  const dosenUsers = store.users.filter(u => u.role === "dosen")
  const superAdminUsers = store.users.filter(u => u.role === "super_admin")
  
  // Seed super admin if not exists
  if (superAdminUsers.length === 0) {
    console.log("Seeding super admin user...")
    store.addUser({
      name: "Super Administrator",
      email: "gacor@unesa.ac.id",
      role: "super_admin",
      password: "gacorkang", // Stored for management purposes
    })
    console.log("Super admin user seeded successfully")
  }
  
  // Only seed dosen if there are no dosen users
  if (dosenUsers.length === 0) {
    console.log("Seeding initial dosen users...")
    store.addUser({
      name: "Dr. Ahmad Wijaya",
      email: "ahmad.wijaya@university.ac.id",
      role: "dosen",
    })
    store.addUser({
      name: "Prof. Siti Nurhaliza",
      email: "siti.nurhaliza@university.ac.id",
      role: "dosen",
    })
    store.addUser({
      name: "Dr. Budi Santoso",
      email: "budi.santoso@university.ac.id",
      role: "dosen",
    })
    store.addUser({
      name: "Dr. Rina Kusuma",
      email: "rina.kusuma@university.ac.id",
      role: "dosen",
    })
    store.addUser({
      name: "Prof. Muhammad Hasan",
      email: "muhammad.hasan@university.ac.id",
      role: "dosen",
    })
    console.log("Initial dosen users seeded successfully")
  }
}
