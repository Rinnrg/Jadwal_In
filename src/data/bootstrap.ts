import { useSubjectsStore } from "@/stores/subjects.store"
import { useProfileStore } from "@/stores/profile.store"
import { useUsersStore } from "@/stores/users.store"
import { useSessionStore } from "@/stores/session.store"
import { generateId } from "@/lib/utils"
import type { Subject } from "@/data/schema"

// Fetch user profile from database
export async function fetchUserProfile() {
  const session = useSessionStore.getState().session
  if (!session) return

  try {
    const response = await fetch(`/api/profile/${session.id}`)
    if (response.ok) {
      const { profile } = await response.json()
      const profileStore = useProfileStore.getState()
      const sessionStore = useSessionStore.getState()
      
      // Update local store with database profile
      if (profile) {
        const existingProfile = profileStore.getProfile(session.id)
        if (existingProfile) {
          profileStore.updateProfile(session.id, {
            nim: profile.nim,
            angkatan: profile.angkatan,
            kelas: profile.kelas,
            prodi: profile.prodi,
            bio: profile.bio,
            website: profile.website,
            avatarUrl: profile.avatarUrl,
          })
        } else {
          profileStore.createProfile({
            userId: profile.userId,
            nim: profile.nim,
            angkatan: profile.angkatan,
            kelas: profile.kelas,
            prodi: profile.prodi,
            bio: profile.bio,
            website: profile.website,
            avatarUrl: profile.avatarUrl,
          })
        }
        
        // Sync avatarUrl to session.image for consistent display
        if (profile.avatarUrl && profile.avatarUrl !== session.image) {
          sessionStore.updateSessionImage(profile.avatarUrl)
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch user profile:', error)
  }
}

// Bootstrap data for demo
export function bootstrapData() {
  const isSeeded = localStorage.getItem("jadwalin:seeded")
  if (isSeeded) return

  // Fetch users from database (including dosen)
  const usersStore = useUsersStore.getState()
  usersStore.fetchUsers()

  // Seed subjects
  const subjectsStore = useSubjectsStore.getState()
  const sampleSubjects: Omit<Subject, "id">[] = [
    {
      kode: "IF101",
      nama: "Pemrograman Dasar",
      sks: 3,
      semester: 1,
      prodi: "Teknik Informatika",
      status: "aktif" as const,
      angkatan: 2022,
      kelas: "A",
      color: "#3b82f6",
      pengampuIds: [],
      slotDefault: {
        day: 1, // Monday
        startUTC: 8 * 60 * 60 * 1000, // 08:00
        endUTC: 10 * 60 * 60 * 1000, // 10:00
      },
    },
    {
      kode: "IF102",
      nama: "Struktur Data",
      sks: 3,
      semester: 2,
      prodi: "Teknik Informatika",
      status: "aktif" as const,
      angkatan: 2022,
      kelas: "A",
      color: "#10b981",
      pengampuIds: [],
    },
    {
      kode: "IF201",
      nama: "Basis Data",
      sks: 3,
      semester: 3,
      prodi: "Teknik Informatika",
      status: "aktif" as const,
      angkatan: 2021,
      kelas: "B",
      color: "#f59e0b",
      pengampuIds: [],
      slotDefault: {
        day: 2, // Tuesday
        startUTC: 10 * 60 * 60 * 1000, // 10:00
        endUTC: 12 * 60 * 60 * 1000, // 12:00
      },
    },
    {
      kode: "IF202",
      nama: "Pemrograman Web",
      sks: 3,
      semester: 4,
      prodi: "Teknik Informatika",
      status: "aktif" as const,
      angkatan: 2021,
      kelas: "A",
      color: "#ef4444",
      pengampuIds: [],
    },
    {
      kode: "IF301",
      nama: "Rekayasa Perangkat Lunak",
      sks: 3,
      semester: 5,
      prodi: "Teknik Informatika",
      status: "aktif" as const,
      angkatan: 2020,
      kelas: "A",
      color: "#8b5cf6",
      pengampuIds: [],
    },
    {
      kode: "IF302",
      nama: "Kecerdasan Buatan",
      sks: 3,
      semester: 6,
      prodi: "Teknik Informatika",
      status: "aktif" as const,
      angkatan: 2020,
      kelas: "B",
      color: "#06b6d4",
      pengampuIds: [],
    },
    {
      kode: "IF401",
      nama: "Skripsi",
      sks: 6,
      semester: 8,
      prodi: "Teknik Informatika",
      status: "aktif" as const,
      angkatan: 2019,
      kelas: "A",
      color: "#64748b",
      pengampuIds: [],
    },
    {
      kode: "IF001",
      nama: "Algoritma Lama",
      sks: 3,
      semester: 1,
      prodi: "Teknik Informatika",
      status: "arsip" as const,
      angkatan: 2018,
      kelas: "A",
      color: "#6b7280",
      pengampuIds: [],
    },
  ]

  // Add subjects to store
  sampleSubjects.forEach((subject) => {
    subjectsStore.addSubject(subject)
  })

  // Seed sample profiles
  const profileStore = useProfileStore.getState()
  const sampleProfiles = [
    {
      userId: "3", // mahasiswa1@univ.ac.id
      nim: "2022001",
      angkatan: 2022,
      kelas: "A",
      prodi: "Teknik Informatika",
      bio: "Mahasiswa semester 5 yang tertarik dengan web development",
    },
    {
      userId: "4", // mahasiswa2@univ.ac.id
      nim: "2023001",
      angkatan: 2023,
      kelas: "B",
      prodi: "Teknik Informatika",
      bio: "Mahasiswa semester 3 yang fokus pada data science",
    },
  ]

  sampleProfiles.forEach((profile) => {
    profileStore.createProfile(profile)
  })

  localStorage.setItem("jadwalin:seeded", "true")
}
