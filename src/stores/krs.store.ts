import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { KrsItem } from "@/data/schema"
import { arr, generateId } from "@/lib/utils"
import { ActivityLogger } from "@/lib/activity-logger"
import { useGradesStore } from "./grades.store"

interface KrsState {
  krsItems: KrsItem[]
  addKrsItem: (userId: string, subjectId: string, term: string, offeringId?: string, subjectName?: string, sks?: number) => void
  removeKrsItem: (id: string, userId?: string, subjectName?: string) => void
  getKrsByUser: (userId: string, term?: string) => KrsItem[]
  getKrsBySubject: (subjectId: string) => KrsItem[]
  isSubjectInKrs: (userId: string, subjectId: string, term: string) => boolean
  isOfferingInKrs: (userId: string, offeringId: string) => boolean
  getTotalSks: (userId: string, term: string, subjects: any[]) => number
  clearKrsByUserAndTerm: (userId: string, term: string) => void
  getKrsByOffering: (offeringId: string) => KrsItem[]
}

export const useKrsStore = create<KrsState>()(
  persist(
    (set, get) => ({
      krsItems: [],
      addKrsItem: (userId, subjectId, term, offeringId, subjectName, sks) => {
        const newItem: KrsItem = {
          id: generateId(),
          userId,
          subjectId,
          offeringId,
          term,
          createdAt: Date.now(),
        }
        set((state) => ({
          krsItems: [...state.krsItems, newItem],
        }))
        
        // Automatically add to KHS (grades) with no grade yet
        const gradesStore = useGradesStore.getState()
        const existingGrade = gradesStore.grades.find(
          (grade) => grade.userId === userId && grade.subjectId === subjectId && grade.term === term
        )
        
        // Only add if grade doesn't exist yet
        if (!existingGrade) {
          gradesStore.addGrade(userId, subjectId, term, undefined, undefined)
        }
        
        // Log activity
        if (subjectName) {
          ActivityLogger.krsAdded(userId, subjectName, sks || 0)
        }
      },
      removeKrsItem: (id, userId, subjectName) => {
        // Get the KRS item before deleting to get subjectId and term
        const krsItem = get().krsItems.find((item) => item.id === id)
        
        set((state) => ({
          krsItems: state.krsItems.filter((item) => item.id !== id),
        }))
        
        // Remove from KHS (grades) if the grade is still empty (no nilaiAngka or nilaiHuruf)
        if (krsItem) {
          const gradesStore = useGradesStore.getState()
          const grade = gradesStore.grades.find(
            (g) => g.userId === krsItem.userId && 
                   g.subjectId === krsItem.subjectId && 
                   g.term === krsItem.term
          )
          
          // Only remove if grade is empty (hasn't been graded yet)
          if (grade && !grade.nilaiAngka && !grade.nilaiHuruf) {
            gradesStore.removeGrade(grade.id)
          }
        }
        
        // Log activity
        if (userId && subjectName) {
          ActivityLogger.krsRemoved(userId, subjectName)
        }
      },
      getKrsByUser: (userId, term) => {
        const items = get().krsItems.filter((item) => item.userId === userId)
        return term ? items.filter((item) => item.term === term) : items
      },
      getKrsBySubject: (subjectId) => {
        return get().krsItems.filter((item) => item.subjectId === subjectId)
      },
      isSubjectInKrs: (userId, subjectId, term) => {
        return get().krsItems.some(
          (item) => item.userId === userId && item.subjectId === subjectId && item.term === term,
        )
      },
      isOfferingInKrs: (userId, offeringId) => {
        return get().krsItems.some((item) => item.userId === userId && item.offeringId === offeringId)
      },
      getTotalSks: (userId, term, subjects) => {
        const userKrs = get().getKrsByUser(userId, term)
        return userKrs.reduce((total, krsItem) => {
          const subject = subjects.find((s) => s.id === krsItem.subjectId)
          return total + (subject?.sks || 0)
        }, 0)
      },
      clearKrsByUserAndTerm: (userId, term) => {
        set((state) => ({
          krsItems: state.krsItems.filter((item) => !(item.userId === userId && item.term === term)),
        }))
        
        // Log activity
        ActivityLogger.krsCleared(userId)
      },
      getKrsByOffering: (offeringId) => {
        return get().krsItems.filter((item) => item.offeringId === offeringId)
      },
    }),
    {
      name: "jadwalin:krs:v2",
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any, version) => {
        if (version === 0 || version === 1) {
          const krsItems = arr(persistedState?.krsItems).map((item: any) => ({
            ...item,
            offeringId: item.offeringId || undefined,
          }))
          return { krsItems }
        }
        return persistedState
      },
    },
  ),
)
