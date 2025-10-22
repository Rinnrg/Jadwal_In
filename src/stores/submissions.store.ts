import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { Submission, FileAttachment } from "@/data/schema"
import { arr, generateId } from "@/lib/utils"
import { ActivityLogger } from "@/lib/activity-logger"

interface SubmissionsState {
  submissions: Submission[]

  // Submission methods
  addSubmission: (submission: Omit<Submission, "id" | "submittedAt">) => void
  updateSubmission: (id: string, updates: Partial<Submission>) => void
  removeSubmission: (id: string) => void
  getSubmissionsByAssignment: (assignmentId: string) => Submission[]
  getSubmissionByStudent: (assignmentId: string, studentId: string) => Submission | undefined
  submitAssignment: (submissionId: string, assignmentTitle?: string, subjectName?: string) => void
  gradeSubmission: (submissionId: string, grade: number, feedback?: string, gradedBy?: string) => void

  // File methods
  addFileToSubmission: (submissionId: string, file: Omit<FileAttachment, "id" | "uploadedAt">) => void
  removeFileFromSubmission: (submissionId: string, fileId: string) => void
  clearSubmissionFiles: (submissionId: string) => void
}

export const useSubmissionsStore = create<SubmissionsState>()(
  persist(
    (set, get) => ({
      submissions: [],

      addSubmission: (submission) => {
        const newSubmission: Submission = {
          ...submission,
          id: generateId(),
          submittedAt: Date.now(),
        }
        set((state) => ({
          submissions: [...state.submissions, newSubmission],
        }))
      },

      updateSubmission: (id, updates) => {
        set((state) => ({
          submissions: state.submissions.map((submission) =>
            submission.id === id ? { ...submission, ...updates } : submission,
          ),
        }))
      },

      removeSubmission: (id) => {
        set((state) => ({
          submissions: state.submissions.filter((submission) => submission.id !== id),
        }))
      },

      getSubmissionsByAssignment: (assignmentId) => {
        return get().submissions.filter((submission) => submission.assignmentId === assignmentId)
      },

      getSubmissionByStudent: (assignmentId, studentId) => {
        return get().submissions.find(
          (submission) => submission.assignmentId === assignmentId && submission.studentId === studentId,
        )
      },

      submitAssignment: (submissionId, assignmentTitle, subjectName) => {
        const submission = get().submissions.find((s) => s.id === submissionId)
        
        set((state) => ({
          submissions: state.submissions.map((submission) =>
            submission.id === submissionId
              ? { ...submission, status: "submitted" as const, submittedAt: Date.now() }
              : submission,
          ),
        }))
        
        // Log activity
        if (submission && assignmentTitle) {
          ActivityLogger.assignmentSubmitted(submission.studentId, assignmentTitle, subjectName)
        }
      },

      gradeSubmission: (submissionId, grade, feedback, gradedBy) => {
        set((state) => ({
          submissions: state.submissions.map((submission) =>
            submission.id === submissionId
              ? {
                  ...submission,
                  status: "graded" as const,
                  grade,
                  feedback,
                  gradedAt: Date.now(),
                  gradedBy,
                }
              : submission,
          ),
        }))
      },

      addFileToSubmission: (submissionId, file) => {
        const newFile: FileAttachment = {
          ...file,
          id: generateId(),
          uploadedAt: Date.now(),
        }

        set((state) => ({
          submissions: state.submissions.map((submission) =>
            submission.id === submissionId ? { ...submission, files: [...submission.files, newFile] } : submission,
          ),
        }))
      },

      removeFileFromSubmission: (submissionId, fileId) => {
        set((state) => ({
          submissions: state.submissions.map((submission) =>
            submission.id === submissionId
              ? { ...submission, files: submission.files.filter((file) => file.id !== fileId) }
              : submission,
          ),
        }))
      },

      clearSubmissionFiles: (submissionId) => {
        set((state) => ({
          submissions: state.submissions.map((submission) =>
            submission.id === submissionId
              ? { ...submission, files: [] }
              : submission,
          ),
        }))
      },
    }),
    {
      name: "jadwalin:submissions:v1",
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any, version) => {
        if (version === 0) {
          return {
            submissions: arr(persistedState?.submissions),
          }
        }
        return persistedState
      },
    },
  ),
)
