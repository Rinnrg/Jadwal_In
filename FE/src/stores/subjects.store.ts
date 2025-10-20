import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { Subject } from "@/data/schema"
import { arr, generateId } from "@/lib/utils"

interface SubjectsState {
  subjects: Subject[]
  addSubject: (subject: Omit<Subject, "id">) => void
  updateSubject: (id: string, updates: Partial<Subject>) => void
  deleteSubject: (id: string) => void
  getSubjectById: (id: string) => Subject | undefined
  getActiveSubjects: () => Subject[]
  getSubjectsByAngkatan: (angkatan: number) => Subject[]
  getSubjectsByPengampu: (dosenId: string) => Subject[]
}

export const useSubjectsStore = create<SubjectsState>()(
  persist(
    (set, get) => ({
      subjects: [],
      addSubject: (subject) => {
        const newSubject: Subject = {
          ...subject,
          id: generateId(),
        }
        set((state) => ({
          subjects: [...state.subjects, newSubject],
        }))
      },
      updateSubject: (id, updates) => {
        set((state) => ({
          subjects: state.subjects.map((subject) => (subject.id === id ? { ...subject, ...updates } : subject)),
        }))
      },
      deleteSubject: (id) => {
        set((state) => ({
          subjects: state.subjects.filter((subject) => subject.id !== id),
        }))
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
    }),
    {
      name: "jadwalin:subjects:v3",
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any, version) => {
        if (version === 0 || version === 1 || version === 2) {
          const subjects = arr(persistedState?.subjects).map((subject: any) => ({
            ...subject,
            pengampuIds: subject.pengampuIds || [],
            // Handle schema migration from old format to new format
            angkatan: subject.angkatan || subject.angkatanMin || 2022,
            kelas: subject.kelas || "A",
            color: subject.color || "#3b82f6",
            // Remove old fields that don't exist in new schema
            angkatanMin: undefined,
            angkatanMax: undefined,
            createdAt: undefined,
            updatedAt: undefined,
          }))
          return { subjects }
        }
        return persistedState
      },
    },
  ),
)
