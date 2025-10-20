import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { Grade } from "@/data/schema"
import { arr, generateId } from "@/lib/utils"

interface GradesState {
  grades: Grade[]
  addGrade: (
    userId: string,
    subjectId: string,
    term: string,
    nilaiAngka?: number,
    nilaiHuruf?: Grade["nilaiHuruf"],
  ) => void
  updateGrade: (id: string, nilaiAngka?: number, nilaiHuruf?: Grade["nilaiHuruf"]) => void
  removeGrade: (id: string) => void
  getGradesByUser: (userId: string, term?: string) => Grade[]
  calculateGPA: (userId: string, term?: string, subjects?: any[]) => number
  calculateSemesterGPA: (userId: string, term: string, subjects?: any[]) => number
}

// Grade point mapping
const gradePoints: Record<string, number> = {
  A: 4.0,
  "B+": 3.5,
  B: 3.0,
  "C+": 2.5,
  C: 2.0,
  D: 1.0,
  E: 0.0,
}

export const useGradesStore = create<GradesState>()(
  persist(
    (set, get) => ({
      grades: [],
      addGrade: (userId, subjectId, term, nilaiAngka, nilaiHuruf) => {
        const newGrade: Grade = {
          id: generateId(),
          userId,
          subjectId,
          term,
          nilaiAngka,
          nilaiHuruf,
        }
        set((state) => ({
          grades: [...state.grades, newGrade],
        }))
      },
      updateGrade: (id, nilaiAngka, nilaiHuruf) => {
        set((state) => ({
          grades: state.grades.map((grade) => (grade.id === id ? { ...grade, nilaiAngka, nilaiHuruf } : grade)),
        }))
      },
      removeGrade: (id) => {
        set((state) => ({
          grades: state.grades.filter((grade) => grade.id !== id),
        }))
      },
      getGradesByUser: (userId, term) => {
        const grades = get().grades.filter((grade) => grade.userId === userId)
        return term ? grades.filter((grade) => grade.term === term) : grades
      },
      calculateGPA: (userId, term, subjects = []) => {
        const grades = get().getGradesByUser(userId, term)
        let totalPoints = 0
        let totalCredits = 0

        grades.forEach((grade) => {
          if (grade.nilaiHuruf) {
            const subject = subjects.find((s) => s.id === grade.subjectId)
            if (subject) {
              const points = gradePoints[grade.nilaiHuruf] || 0
              totalPoints += points * subject.sks
              totalCredits += subject.sks
            }
          }
        })

        return totalCredits > 0 ? totalPoints / totalCredits : 0
      },
      calculateSemesterGPA: (userId, term, subjects = []) => {
        return get().calculateGPA(userId, term, subjects)
      },
    }),
    {
      name: "jadwalin:grades:v1",
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any, version) => {
        if (version === 0) {
          return { grades: arr(persistedState?.grades) }
        }
        return persistedState
      },
    },
  ),
)
