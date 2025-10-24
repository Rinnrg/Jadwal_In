import { create } from "zustand"
import type { CourseOffering } from "@/data/schema"

interface OfferingsState {
  offerings: CourseOffering[]
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchOfferings: (subjectId?: string) => Promise<void>
  addOffering: (offering: Omit<CourseOffering, "id">) => Promise<void>
  updateOffering: (id: string, updates: Partial<CourseOffering>) => Promise<void>
  removeOffering: (id: string) => Promise<void>
  
  // Getters
  getOffering: (id: string) => CourseOffering | undefined
  getOfferingsBySubject: (subjectId: string) => CourseOffering[]
  getOfferingsForStudent: (angkatan: number, kelas?: string) => CourseOffering[]
  getOfferingsByAngkatan: (angkatan: number) => CourseOffering[]
  getOfferingsGroupedByKelas: (angkatan: number) => Record<string, CourseOffering[]>
  getOfferingsByPengampu: (dosenId: string) => CourseOffering[]
}

export const useOfferingsStore = create<OfferingsState>()((set, get) => ({
  offerings: [],
  isLoading: false,
  error: null,

  fetchOfferings: async (subjectId?: string) => {
    set({ isLoading: true, error: null })
    try {
      const url = subjectId ? `/api/offerings?subjectId=${subjectId}` : '/api/offerings'
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch offerings')
      const offerings = await response.json()
      set({ offerings, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  addOffering: async (offering) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch('/api/offerings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(offering),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create offering')
      }
      const newOffering = await response.json()
      set((state) => ({
        offerings: [...state.offerings, newOffering],
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },

  updateOffering: async (id, updates) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch('/api/offerings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update offering')
      }
      const updatedOffering = await response.json()
      set((state) => ({
        offerings: state.offerings.map((offering) =>
          offering.id === id ? updatedOffering : offering
        ),
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },

  removeOffering: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`/api/offerings?id=${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete offering')
      }
      set((state) => ({
        offerings: state.offerings.filter((offering) => offering.id !== id),
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
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
    // Note: CourseOffering doesn't have pengampuIds, need to join with subject
    // This would require fetching subject data, so return empty array for now
    return []
  },
}))
