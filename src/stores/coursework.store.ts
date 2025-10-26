import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { Assignment, Material, AttendanceSession } from "@/data/schema"
import { arr, generateId } from "@/lib/utils"

interface CourseworkState {
  assignments: Assignment[]
  materials: Material[]
  attendance: AttendanceSession[]
  isLoading: boolean
  isFetching: boolean

  // Fetch methods
  fetchAssignments: (subjectId?: string) => Promise<void>
  fetchMaterials: (subjectId?: string) => Promise<void>

  // Assignment methods
  addAssignment: (assignment: Omit<Assignment, "id" | "createdAt">) => Promise<void>
  updateAssignment: (id: string, updates: Partial<Assignment>) => Promise<void>
  removeAssignment: (id: string) => Promise<void>
  getAssignmentsBySubject: (subjectId: string) => Assignment[]

  // Material methods
  addMaterial: (material: Omit<Material, "id" | "createdAt">) => Promise<void>
  updateMaterial: (id: string, updates: Partial<Material>) => Promise<void>
  removeMaterial: (id: string) => Promise<void>
  getMaterialsBySubject: (subjectId: string) => Material[]

  // Attendance methods
  addAttendanceSession: (session: Omit<AttendanceSession, "id">) => void
  setAttendanceRecord: (sessionId: string, studentId: string, status: "hadir" | "alfa" | "izin") => void
  removeAttendanceSession: (id: string) => void
  getAttendanceBySubject: (subjectId: string) => AttendanceSession[]
  initializeAttendanceSessions: (subjectId: string, enrolledStudents: Array<{ id: string }>) => void
}

export const useCourseworkStore = create<CourseworkState>()(
  persist(
    (set, get) => ({
      assignments: [],
      materials: [],
      attendance: [],
      isLoading: false,
      isFetching: false,

      // Fetch methods
      fetchAssignments: async (subjectId) => {
        try {
          set({ isFetching: true })
          const url = subjectId 
            ? `/api/assignments?subjectId=${subjectId}&_t=${Date.now()}` 
            : `/api/assignments?_t=${Date.now()}`
          
          console.log('[Coursework Store] Fetching assignments from:', url)
          
          const response = await fetch(url, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
            }
          })
          
          if (!response.ok) {
            throw new Error('Failed to fetch assignments')
          }
          
          const data = await response.json()
          console.log('[Coursework Store] Raw API response:', data)
          
          // Convert BigInt dueUTC to number
          const assignments = data.map((a: any) => ({
            ...a,
            dueUTC: a.dueUTC ? Number(a.dueUTC) : undefined,
            createdAt: new Date(a.createdAt).getTime(),
          }))
          
          console.log('[Coursework Store] Processed assignments:', assignments)
          console.log('[Coursework Store] Assignments for subject', subjectId, ':', assignments.filter((a: any) => a.subjectId === subjectId).length)
          
          set({ assignments, isFetching: false })
          console.log('[Coursework Store] Fetched assignments:', assignments.length)
        } catch (error) {
          console.error('[Coursework Store] Error fetching assignments:', error)
          set({ isFetching: false })
        }
      },

      fetchMaterials: async (subjectId) => {
        try {
          set({ isFetching: true })
          const url = subjectId 
            ? `/api/materials?subjectId=${subjectId}&_t=${Date.now()}` 
            : `/api/materials?_t=${Date.now()}`
          
          console.log('[Coursework Store] Fetching materials from:', url)
          
          const response = await fetch(url, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
            }
          })
          
          if (!response.ok) {
            throw new Error('Failed to fetch materials')
          }
          
          const data = await response.json()
          console.log('[Coursework Store] Raw materials API response:', data)
          
          // Convert timestamps
          const materials = data.map((m: any) => ({
            ...m,
            createdAt: new Date(m.createdAt).getTime(),
          }))
          
          console.log('[Coursework Store] Processed materials:', materials)
          console.log('[Coursework Store] Materials for subject', subjectId, ':', materials.filter((m: any) => m.subjectId === subjectId).length)
          
          set({ materials, isFetching: false })
          console.log('[Coursework Store] Fetched materials:', materials.length)
        } catch (error) {
          console.error('[Coursework Store] Error fetching materials:', error)
          set({ isFetching: false })
        }
      },

      // Assignment methods
      addAssignment: async (assignment) => {
        try {
          // Call API to create assignment
          const response = await fetch('/api/assignments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              subjectId: assignment.subjectId,
              title: assignment.title,
              description: assignment.description,
              dueUTC: assignment.dueUTC,
              allowedFileTypes: assignment.allowedFileTypes || ['.pdf', '.doc', '.docx'],
              maxFileSize: assignment.maxFileSize || 10485760,
              maxFiles: assignment.maxFiles || 3,
            }),
          })

          if (!response.ok) {
            throw new Error('Failed to create assignment')
          }

          const data = await response.json()
          
          // Convert to local format
          const newAssignment: Assignment = {
            ...assignment,
            id: data.id,
            createdAt: new Date(data.createdAt).getTime(),
            dueUTC: data.dueUTC ? Number(data.dueUTC) : undefined,
          }

          set((state) => ({
            assignments: [...state.assignments, newAssignment],
          }))
          
          console.log('[Coursework Store] Assignment created successfully:', newAssignment.id)
          
          // Trigger notification for students enrolled in this subject
          try {
            ;(async () => {
              const { useNotificationStore } = await import('./notification.store')
              const { useKrsStore } = await import('./krs.store')
              const { triggerNotification } = useNotificationStore.getState()
              const { getKrsBySubject } = useKrsStore.getState()
              
              // Get all students enrolled in this subject
              const enrolledStudents = getKrsBySubject(assignment.subjectId)
              
              const message = assignment.title 
                ? `Tugas baru: "${assignment.title}"` 
                : 'Tugas baru telah ditambahkan'
              
              // Notify each enrolled student
              enrolledStudents.forEach(krsItem => {
                triggerNotification('asynchronous', krsItem.userId, message, 1)
              })
              
              console.log('[Coursework Store] Assignment notification triggered for', enrolledStudents.length, 'students')
            })()
          } catch (error) {
            console.error('[Coursework Store] Failed to trigger assignment notification:', error)
          }
        } catch (error) {
          console.error('[Coursework Store] Error adding assignment:', error)
          throw error
        }
      },
      updateAssignment: async (id, updates) => {
        try {
          // Call API to update assignment
          const response = await fetch('/api/assignments', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id,
              ...updates,
            }),
          })

          if (!response.ok) {
            throw new Error('Failed to update assignment')
          }

          const data = await response.json()
          
          // Update local state
          set((state) => ({
            assignments: state.assignments.map((assignment) =>
              assignment.id === id 
                ? { 
                    ...assignment, 
                    ...updates,
                    dueUTC: data.dueUTC ? Number(data.dueUTC) : undefined,
                  } 
                : assignment
            ),
          }))
          
          console.log('[Coursework Store] Assignment updated successfully:', id)
        } catch (error) {
          console.error('[Coursework Store] Error updating assignment:', error)
          throw error
        }
      },
      removeAssignment: async (id) => {
        try {
          // Call API to delete assignment
          const response = await fetch(`/api/assignments?id=${id}`, {
            method: 'DELETE',
          })

          if (!response.ok) {
            throw new Error('Failed to delete assignment')
          }

          // Update local state
          set((state) => ({
            assignments: state.assignments.filter((assignment) => assignment.id !== id),
          }))
          
          console.log('[Coursework Store] Assignment deleted successfully:', id)
        } catch (error) {
          console.error('[Coursework Store] Error deleting assignment:', error)
          throw error
        }
      },
      getAssignmentsBySubject: (subjectId) => {
        return get().assignments.filter((assignment) => assignment.subjectId === subjectId)
      },

      // Material methods
      addMaterial: async (material) => {
        try {
          // Call API to create material
          const response = await fetch('/api/materials', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              subjectId: material.subjectId,
              title: material.title,
              content: material.content,
            }),
          })

          if (!response.ok) {
            throw new Error('Failed to create material')
          }

          const data = await response.json()
          
          // Convert to local format
          const newMaterial: Material = {
            ...material,
            id: data.id,
            createdAt: new Date(data.createdAt).getTime(),
          }

          set((state) => ({
            materials: [...state.materials, newMaterial],
          }))
          
          console.log('[Coursework Store] Material created successfully:', newMaterial.id)
          
          // Trigger notification for students enrolled in this subject
          try {
            ;(async () => {
              const { useNotificationStore } = await import('./notification.store')
              const { useKrsStore } = await import('./krs.store')
              const { triggerNotification } = useNotificationStore.getState()
              const { getKrsBySubject } = useKrsStore.getState()
              
              // Get all students enrolled in this subject
              const enrolledStudents = getKrsBySubject(material.subjectId)
              
              const message = material.title 
                ? `Materi baru: "${material.title}"` 
                : 'Materi baru telah ditambahkan'
              
              // Notify each enrolled student
              enrolledStudents.forEach(krsItem => {
                triggerNotification('asynchronous', krsItem.userId, message, 1)
              })
              
              console.log('[Coursework Store] Material notification triggered for', enrolledStudents.length, 'students')
            })()
          } catch (error) {
            console.error('[Coursework Store] Failed to trigger material notification:', error)
          }
        } catch (error) {
          console.error('[Coursework Store] Error adding material:', error)
          throw error
        }
      },
      updateMaterial: async (id, updates) => {
        try {
          // Call API to update material
          const response = await fetch('/api/materials', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id,
              ...updates,
            }),
          })

          if (!response.ok) {
            throw new Error('Failed to update material')
          }

          // Update local state
          set((state) => ({
            materials: state.materials.map((material) => 
              material.id === id ? { ...material, ...updates } : material
            ),
          }))
          
          console.log('[Coursework Store] Material updated successfully:', id)
        } catch (error) {
          console.error('[Coursework Store] Error updating material:', error)
          throw error
        }
      },
      removeMaterial: async (id) => {
        try {
          // Call API to delete material
          const response = await fetch(`/api/materials?id=${id}`, {
            method: 'DELETE',
          })

          if (!response.ok) {
            throw new Error('Failed to delete material')
          }

          // Update local state
          set((state) => ({
            materials: state.materials.filter((material) => material.id !== id),
          }))
          
          console.log('[Coursework Store] Material deleted successfully:', id)
        } catch (error) {
          console.error('[Coursework Store] Error deleting material:', error)
          throw error
        }
      },
      getMaterialsBySubject: (subjectId) => {
        return get().materials.filter((material) => material.subjectId === subjectId)
      },

      // Attendance methods
      addAttendanceSession: (session) => {
        const newSession: AttendanceSession = {
          ...session,
          id: generateId(),
        }
        set((state) => ({
          attendance: [...state.attendance, newSession],
        }))
      },
      setAttendanceRecord: (sessionId, studentId, status) => {
        set((state) => ({
          attendance: state.attendance.map((session) => {
            if (session.id === sessionId) {
              const existingRecordIndex = session.records.findIndex((record) => record.studentId === studentId)

              if (existingRecordIndex >= 0) {
                const updatedRecords = [...session.records]
                updatedRecords[existingRecordIndex] = { studentId, status }
                return { ...session, records: updatedRecords }
              } else {
                return {
                  ...session,
                  records: [...session.records, { studentId, status }],
                }
              }
            }
            return session
          }),
        }))
      },
      removeAttendanceSession: (id) => {
        set((state) => ({
          attendance: state.attendance.filter((session) => session.id !== id),
        }))
      },
      getAttendanceBySubject: (subjectId) => {
        return get().attendance.filter((session) => session.subjectId === subjectId)
      },
      initializeAttendanceSessions: (subjectId, enrolledStudents) => {
        const existingSessions = get().attendance.filter((session) => session.subjectId === subjectId)

        if (existingSessions.length === 0) {
          const startDate = new Date()

          for (let i = 1; i <= 16; i++) {
            const sessionDate = new Date(startDate)
            sessionDate.setDate(startDate.getDate() + (i - 1) * 7)

            // Determine session type based on meeting number
            let sessionType: "regular" | "UTS" | "UAS" = "regular"
            if (i === 8) sessionType = "UTS"
            if (i === 16) sessionType = "UAS"

            const newSession: AttendanceSession = {
              id: generateId(),
              subjectId,
              dateUTC: sessionDate.getTime(),
              meetingNumber: i,
              sessionType,
              records: enrolledStudents.map((student) => ({
                studentId: student.id,
                status: "alfa" as const,
              })),
            }

            set((state) => ({
              attendance: [...state.attendance, newSession],
            }))
          }
        }
      },
    }),
    {
      name: "jadwalin:coursework:v1",
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any, version) => {
        if (version === 0) {
          return {
            assignments: arr(persistedState?.assignments),
            materials: arr(persistedState?.materials),
            attendance: arr(persistedState?.attendance),
          }
        }
        return persistedState
      },
    },
  ),
)
