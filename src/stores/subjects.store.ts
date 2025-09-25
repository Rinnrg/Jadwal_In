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
          (subject) => subject.status === "aktif" && angkatan >= subject.angkatanMin && angkatan <= subject.angkatanMax,
        )
      },
      getSubjectsByPengampu: (dosenId) => {
        return get().subjects.filter((subject) => subject.status === "aktif" && subject.pengampuIds?.includes(dosenId))
      },
    }),
    {
      name: "jadwalin:subjects:v2",
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any, version) => {
        if (version === 0 || version === 1) {
          const subjects = arr(persistedState?.subjects).map((subject: any) => ({
            ...subject,
            pengampuIds: subject.pengampuIds || [],
          }))
          return { subjects }
        }
        return persistedState
      },
    },
  ),
)
