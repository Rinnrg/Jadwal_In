import { create } from "zustand"
import type { Subject } from "@/data/schema"

interface SubjectsState {
  subjects: Subject[]
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchSubjects: () => Promise<void>
  addSubject: (subject: Omit<Subject, "id">) => Promise<void>
  updateSubject: (id: string, updates: Partial<Subject>) => Promise<void>
  deleteSubject: (id: string) => Promise<void>
  
  // Getters
  getSubjectById: (id: string) => Subject | undefined
  getActiveSubjects: () => Subject[]
  getSubjectsByAngkatan: (angkatan: number) => Subject[]
  getSubjectsByPengampu: (dosenId: string) => Subject[]
}

export const useSubjectsStore = create<SubjectsState>()((set, get) => ({
  subjects: [],
  isLoading: false,
  error: null,

  fetchSubjects: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch('/api/subjects')
      if (!response.ok) throw new Error('Failed to fetch subjects')
      const subjects = await response.json()
      set({ subjects, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  addSubject: async (subject) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subject),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create subject')
      }
      const newSubject = await response.json()
      set((state) => ({
        subjects: [...state.subjects, newSubject],
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },

  updateSubject: async (id, updates) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch('/api/subjects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update subject')
      }
      const updatedSubject = await response.json()
      set((state) => ({
        subjects: state.subjects.map((subject) =>
          subject.id === id ? updatedSubject : subject
        ),
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },

  deleteSubject: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`/api/subjects?id=${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete subject')
      }
      set((state) => ({
        subjects: state.subjects.filter((subject) => subject.id !== id),
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },

  getSubjectById: (id) => {
    return get().subjects.find((subject) => subject.id === id)
  },

  getActiveSubjects: () => {
    return get().subjects.filter((subject) => subject.status === "aktif")
  },

  getSubjectsByAngkatan: (angkatan) => {
    return get().subjects.filter(
      (subject) => subject.status === "aktif" && subject.angkatan === angkatan,
    )
  },

  getSubjectsByPengampu: (dosenId) => {
    return get().subjects.filter((subject) => subject.status === "aktif" && subject.pengampuIds?.includes(dosenId))
  },
}))
