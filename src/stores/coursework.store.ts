import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { Assignment, Material, AttendanceSession } from "@/data/schema"
import { arr, generateId } from "@/lib/utils"

interface CourseworkState {
  assignments: Assignment[]
  materials: Material[]
  attendance: AttendanceSession[]

  // Assignment methods
  addAssignment: (assignment: Omit<Assignment, "id" | "createdAt">) => void
  updateAssignment: (id: string, updates: Partial<Assignment>) => void
  removeAssignment: (id: string) => void
  getAssignmentsBySubject: (subjectId: string) => Assignment[]

  // Material methods
  addMaterial: (material: Omit<Material, "id" | "createdAt">) => void
  updateMaterial: (id: string, updates: Partial<Material>) => void
  removeMaterial: (id: string) => void
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

      // Assignment methods
      addAssignment: (assignment) => {
        const newAssignment: Assignment = {
          ...assignment,
          id: generateId(),
          createdAt: Date.now(),
        }
        set((state) => ({
          assignments: [...state.assignments, newAssignment],
        }))
      },
      updateAssignment: (id, updates) => {
        set((state) => ({
          assignments: state.assignments.map((assignment) =>
            assignment.id === id ? { ...assignment, ...updates } : assignment,
          ),
        }))
      },
      removeAssignment: (id) => {
        set((state) => ({
          assignments: state.assignments.filter((assignment) => assignment.id !== id),
        }))
      },
      getAssignmentsBySubject: (subjectId) => {
        return get().assignments.filter((assignment) => assignment.subjectId === subjectId)
      },

      // Material methods
      addMaterial: (material) => {
        const newMaterial: Material = {
          ...material,
          id: generateId(),
          createdAt: Date.now(),
        }
        set((state) => ({
          materials: [...state.materials, newMaterial],
        }))
      },
      updateMaterial: (id, updates) => {
        set((state) => ({
          materials: state.materials.map((material) => (material.id === id ? { ...material, ...updates } : material)),
        }))
      },
      removeMaterial: (id) => {
        set((state) => ({
          materials: state.materials.filter((material) => material.id !== id),
        }))
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
