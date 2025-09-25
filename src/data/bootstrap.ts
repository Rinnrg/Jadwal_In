import { useSubjectsStore } from "@/stores/subjects.store"
import { useProfileStore } from "@/stores/profile.store"
import { generateId } from "@/lib/utils"

// Bootstrap data for demo
export function bootstrapData() {
  const isSeeded = localStorage.getItem("jadwalin:seeded")
  if (isSeeded) return

  // Seed subjects
  const subjectsStore = useSubjectsStore.getState()
  const sampleSubjects = [
    {
      id: generateId(),
      kode: "IF101",
      nama: "Pemrograman Dasar",
      sks: 3,
      semester: 1,
      prodi: "Teknik Informatika",
      status: "aktif" as const,
      angkatanMin: 2022,
      angkatanMax: 2024,
      color: "#3b82f6",
      slotDefault: {
        day: 1, // Monday
        startUTC: 8 * 60 * 60 * 1000, // 08:00
        endUTC: 10 * 60 * 60 * 1000, // 10:00
      },
    },
    {
      id: generateId(),
      kode: "IF102",
      nama: "Struktur Data",
      sks: 3,
      semester: 2,
      prodi: "Teknik Informatika",
      status: "aktif" as const,
      angkatanMin: 2022,
      angkatanMax: 2024,
      color: "#10b981",
    },
    {
      id: generateId(),
      kode: "IF201",
      nama: "Basis Data",
      sks: 3,
      semester: 3,
      prodi: "Teknik Informatika",
      status: "aktif" as const,
      angkatanMin: 2021,
      angkatanMax: 2023,
      color: "#f59e0b",
      slotDefault: {
        day: 2, // Tuesday
        startUTC: 10 * 60 * 60 * 1000, // 10:00
        endUTC: 12 * 60 * 60 * 1000, // 12:00
      },
    },
    {
      id: generateId(),
      kode: "IF202",
      nama: "Pemrograman Web",
      sks: 3,
      semester: 4,
      prodi: "Teknik Informatika",
      status: "aktif" as const,
      angkatanMin: 2021,
      angkatanMax: 2023,
      color: "#ef4444",
    },
    {
      id: generateId(),
      kode: "IF301",
      nama: "Rekayasa Perangkat Lunak",
      sks: 3,
      semester: 5,
      prodi: "Teknik Informatika",
      status: "aktif" as const,
      angkatanMin: 2020,
      angkatanMax: 2022,
      color: "#8b5cf6",
    },
    {
      id: generateId(),
      kode: "IF302",
      nama: "Kecerdasan Buatan",
      sks: 3,
      semester: 6,
      prodi: "Teknik Informatika",
      status: "aktif" as const,
      angkatanMin: 2020,
      angkatanMax: 2022,
      color: "#06b6d4",
    },
    {
      id: generateId(),
      kode: "IF401",
      nama: "Skripsi",
      sks: 6,
      semester: 8,
      prodi: "Teknik Informatika",
      status: "aktif" as const,
      angkatanMin: 2019,
      angkatanMax: 2021,
      color: "#64748b",
    },
    {
      id: generateId(),
      kode: "IF001",
      nama: "Algoritma Lama",
      sks: 3,
      semester: 1,
      prodi: "Teknik Informatika",
      status: "arsip" as const,
      angkatanMin: 2018,
      angkatanMax: 2020,
      color: "#6b7280",
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
      prodi: "Teknik Informatika",
      bio: "Mahasiswa semester 5 yang tertarik dengan web development",
    },
    {
      userId: "4", // mahasiswa2@univ.ac.id
      nim: "2023001",
      angkatan: 2023,
      prodi: "Teknik Informatika",
      bio: "Mahasiswa semester 3 yang fokus pada data science",
    },
  ]

  sampleProfiles.forEach((profile) => {
    profileStore.createProfile(profile)
  })

  localStorage.setItem("jadwalin:seeded", "true")
}
