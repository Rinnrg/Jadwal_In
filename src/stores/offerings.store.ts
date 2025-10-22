import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { CourseOffering } from "@/data/schema"

interface OfferingsState {
  offerings: CourseOffering[]
  addOffering: (offering: CourseOffering) => void
  updateOffering: (id: string, updates: Partial<CourseOffering>) => void
  removeOffering: (id: string) => void
  getOffering: (id: string) => CourseOffering | undefined
  getOfferingsBySubject: (subjectId: string) => CourseOffering[]
  getOfferingsForStudent: (angkatan: number, kelas?: string) => CourseOffering[]
  getOfferingsByAngkatan: (angkatan: number) => CourseOffering[]
  getOfferingsGroupedByKelas: (angkatan: number) => Record<string, CourseOffering[]>
  getOfferingsByPengampu: (dosenId: string) => CourseOffering[]
}

export const useOfferingsStore = create<OfferingsState>()(
  persist(
    (set, get) => ({
      offerings: [],
      addOffering: (offering) => {
        set((state) => ({
          offerings: [...state.offerings, offering],
        }))
      },
      updateOffering: (id, updates) => {
        set((state) => ({
          offerings: state.offerings.map((offering) => (offering.id === id ? { ...offering, ...updates } : offering)),
        }))
      },
      removeOffering: (id) => {
        set((state) => ({
          offerings: state.offerings.filter((offering) => offering.id !== id),
        }))
      },
      getOffering: (id) => {
        return get().offerings.find((offering) => offering.id === id)
      },
      getOfferingsBySubject: (subjectId) => {
        return get().offerings.filter((offering) => offering.subjectId === subjectId)
      },
      getOfferingsForStudent: (angkatan, kelas) => {
        // Filter by angkatan only - mahasiswa bebas pilih kelas mana saja
        // Parameter kelas tetap ada untuk backward compatibility tapi tidak digunakan
        return get().offerings.filter(
          (offering) =>
            offering.angkatan === angkatan &&
            offering.status === "buka"
        )
      },
      getOfferingsByAngkatan: (angkatan) => {
        return get().offerings.filter(
          (offering) => offering.angkatan === angkatan && offering.status === "buka"
        )
      },
      getOfferingsGroupedByKelas: (angkatan) => {
        const offerings = get().offerings.filter(
          (offering) => offering.angkatan === angkatan && offering.status === "buka"
        )
        
        // Group by kelas
        const grouped: Record<string, CourseOffering[]> = {}
        offerings.forEach((offering) => {
          const kelas = offering.kelas.trim()
          if (!grouped[kelas]) {
            grouped[kelas] = []
          }
          grouped[kelas].push(offering)
        })
        
        return grouped
      },
      getOfferingsByPengampu: (dosenId) => {
        return get().offerings.filter((offering) => offering.pengampuIds?.includes(dosenId))
      },
    }),
    {
      name: "jadwalin:offerings:v1",
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any, version) => {
        if (version === 0) {
          return { offerings: persistedState?.offerings || [] }
        }
        return persistedState
      },
    },
  ),
)
