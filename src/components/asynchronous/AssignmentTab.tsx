"use client"

import type React from "react"

import { useState } from "react"
import { useCourseworkStore } from "@/stores/coursework.store"
import { useSubmissionsStore } from "@/stores/submissions.store"
import { useSessionStore } from "@/stores/session.store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { FileUpload } from "@/components/ui/file-upload"
import { Plus, Edit, Trash2, Calendar, Clock, FileText, Upload, Download, Eye } from "lucide-react"
import { confirmAction, showSuccess, showError } from "@/lib/alerts"
import { fmtDate, fmtDateTime } from "@/lib/time"
import { arr } from "@/lib/utils"
import { AssignmentSubmission } from "./AssignmentSubmission"

interface AssignmentTabProps {
  subjectId: string
  canManage: boolean
  userRole: string
}

export function AssignmentTab({ subjectId, canManage, userRole }: AssignmentTabProps) {
  const { session } = useSessionStore()
  const { getAssignmentsBySubject, addAssignment, updateAssignment, removeAssignment } = useCourseworkStore()
  const {
    getSubmissionsByAssignment,
    getSubmissionByStudent,
    addSubmission,
    updateSubmission,
    submitAssignment,
    gradeSubmission,
    addFileToSubmission,
    removeFileFromSubmission,
    clearSubmissionFiles,
  } = useSubmissionsStore()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmissionDialogOpen, setIsSubmissionDialogOpen] = useState(false)
  const [isGradingDialogOpen, setIsGradingDialogOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<any>(null)
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null)
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    dueTime: "",
  })

  const [gradingData, setGradingData] = useState({
    grade: "",
    feedback: "",
  })

  const assignments = arr(getAssignmentsBySubject(subjectId)).sort((a, b) => {
    if (!a.dueUTC && !b.dueUTC) return b.createdAt - a.createdAt
    if (!a.dueUTC) return 1
    if (!b.dueUTC) return -1
    return a.dueUTC - b.dueUTC
  })

  // Get submissions for current user (if student) or all submissions (if lecturer)
  const getAssignmentSubmissions = (assignmentId: string) => {
    if (userRole === "mahasiswa" && session) {
      const submission = getSubmissionByStudent(assignmentId, session.id)
      return Array.isArray(submission) ? submission[0] : submission
    }
    return getSubmissionsByAssignment(assignmentId)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      showError("Judul tugas wajib diisi")
      return
    }

    const dueUTC =
      formData.dueDate && formData.dueTime ? new Date(`${formData.dueDate}T${formData.dueTime}`).getTime() : undefined

    try {
      if (editingAssignment) {
        updateAssignment(editingAssignment.id, {
          title: formData.title,
          description: formData.description || undefined,
          dueUTC,
        })
        showSuccess("Tugas berhasil diperbarui")
      } else {
        addAssignment({
          subjectId,
          title: formData.title,
          description: formData.description || undefined,
          dueUTC,
          attachments: [],
          allowedFileTypes: [],
          maxFileSize: 10 * 1024 * 1024, // 10MB
          maxFiles: 5,
        })
        showSuccess("Tugas berhasil ditambahkan")
      }

      setIsDialogOpen(false)
      setEditingAssignment(null)
      setFormData({ title: "", description: "", dueDate: "", dueTime: "" })
    } catch (error) {
      showError("Terjadi kesalahan saat menyimpan tugas")
    }
  }

  const handleEdit = (assignment: any) => {
    setEditingAssignment(assignment)
    setFormData({
      title: assignment.title,
      description: assignment.description || "",
      dueDate: assignment.dueUTC ? new Date(assignment.dueUTC).toISOString().split("T")[0] : "",
      dueTime: assignment.dueUTC ? new Date(assignment.dueUTC).toTimeString().slice(0, 5) : "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (assignment: any) => {
    const confirmed = await confirmAction(
      "Hapus Tugas",
      `Apakah Anda yakin ingin menghapus tugas "${assignment.title}"?`,
      "Ya, Hapus",
    )

    if (confirmed) {
      removeAssignment(assignment.id)
      showSuccess("Tugas berhasil dihapus")
    }
  }

  const handleSubmitAssignment = (assignment: any) => {
    if (!session) return

    let submission = getSubmissionByStudent(assignment.id, session.id)

    if (!submission) {
      // Create new submission
      addSubmission({
        assignmentId: assignment.id,
        studentId: session.id,
        status: "draft",
        files: [],
      })
      submission = getSubmissionByStudent(assignment.id, session.id)
    }

    setSelectedAssignment(assignment)
    setSelectedSubmission(submission)
    setIsSubmissionDialogOpen(true)
  }

  const handleSubmissionSubmit = (files: any[], note?: string) => {
    if (!selectedSubmission || !selectedAssignment) return

    // Update submission with files and note
    files.forEach((file) => {
      addFileToSubmission(selectedSubmission.id, file)
    })
    
    if (note) {
      updateSubmission(selectedSubmission.id, { note })
    }

    submitAssignment(selectedSubmission.id, selectedAssignment.title, undefined)
    showSuccess("Tugas berhasil dikumpulkan")
    setIsSubmissionDialogOpen(false)
  }

  const handleSubmissionSaveDraft = (files: any[], note?: string) => {
    if (!selectedSubmission) return

    // Clear existing files first
    clearSubmissionFiles(selectedSubmission.id)

    // Add new files
    files.forEach((file) => {
      addFileToSubmission(selectedSubmission.id, file)
    })
    
    if (note) {
      updateSubmission(selectedSubmission.id, { note })
    }

    showSuccess("Draft berhasil disimpan")
  }

  const handleGradeSubmission = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSubmission || !session) return

    const grade = Number.parseFloat(gradingData.grade)
    if (isNaN(grade) || grade < 0 || grade > 100) {
      showError("Nilai harus berupa angka antara 0-100")
      return
    }

    gradeSubmission(selectedSubmission.id, grade, gradingData.feedback, session.id)
    showSuccess("Nilai berhasil diberikan")
    setIsGradingDialogOpen(false)
    setGradingData({ grade: "", feedback: "" })
  }

  const getDueBadge = (dueUTC?: number) => {
    if (!dueUTC) return null

    const now = Date.now()
    const isOverdue = dueUTC < now
    const isUpcoming = dueUTC - now < 24 * 60 * 60 * 1000 // 24 hours

    if (isOverdue) {
      return <Badge variant="destructive">Terlambat</Badge>
    } else if (isUpcoming) {
      return <Badge variant="secondary">Segera</Badge>
    }

    return <Badge variant="outline">Aktif</Badge>
  }

  const getSubmissionBadge = (submission: any) => {
    if (!submission) return <Badge variant="outline">Belum Dikumpulkan</Badge>

    switch (submission.status) {
      case "draft":
        return <Badge variant="secondary">Draft</Badge>
      case "submitted":
        return <Badge variant="default">Dikumpulkan</Badge>
      case "graded":
        return <Badge variant="default">Dinilai</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Tugas</h3>
          <p className="text-sm text-muted-foreground">
            {canManage ? "Kelola tugas untuk mata kuliah ini" : "Daftar tugas yang harus dikerjakan"}
          </p>
        </div>
        {canManage && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Tambah Tugas
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingAssignment ? "Edit Tugas" : "Tambah Tugas Baru"}</DialogTitle>
                <DialogDescription>
                  {editingAssignment ? "Perbarui informasi tugas" : "Buat tugas baru untuk mahasiswa"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Judul Tugas</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Masukkan judul tugas"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Deskripsi tugas (opsional)"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Tanggal Deadline</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueTime">Waktu Deadline</Label>
                    <Input
                      id="dueTime"
                      type="time"
                      value={formData.dueTime}
                      onChange={(e) => setFormData((prev) => ({ ...prev, dueTime: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit">{editingAssignment ? "Perbarui" : "Tambah"} Tugas</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Belum Ada Tugas</h3>
            <p className="text-muted-foreground">
              {canManage ? "Tambahkan tugas pertama untuk mata kuliah ini" : "Belum ada tugas yang diberikan"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => {
            const submission = session ? getAssignmentSubmissions(assignment.id) : null
            const submissions = canManage ? getSubmissionsByAssignment(assignment.id) : []

            return (
              <Card key={assignment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {assignment.title}
                        {(assignment.title.toLowerCase().includes("uts") || 
                          assignment.title.toLowerCase().includes("ujian tengah")) && (
                          <Badge variant="default" className="bg-blue-600">UTS</Badge>
                        )}
                        {(assignment.title.toLowerCase().includes("uas") || 
                          assignment.title.toLowerCase().includes("ujian akhir")) && (
                          <Badge variant="default" className="bg-purple-600">UAS</Badge>
                        )}
                      </CardTitle>
                      {assignment.description && <CardDescription>{assignment.description}</CardDescription>}
                    </div>
                    <div className="flex items-center gap-2">
                      {getDueBadge(assignment.dueUTC)}
                      {userRole === "mahasiswa" && getSubmissionBadge(submission)}
                      {canManage && (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(assignment)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(assignment)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Dibuat: {fmtDate(assignment.createdAt)}
                      </div>
                      {assignment.dueUTC && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Deadline: {fmtDateTime(assignment.dueUTC)}
                        </div>
                      )}
                      {canManage && (
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {submissions.length} Submission{submissions.length !== 1 ? "s" : ""}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {userRole === "mahasiswa" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSubmitAssignment(assignment)}
                          className="gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          {(submission && !Array.isArray(submission) && (submission.status === "submitted" || submission.status === "graded"))
                            ? "Lihat Submission"
                            : "Kumpulkan Tugas"}
                        </Button>
                      )}

                      {canManage && submissions.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Show submissions list - you could implement this
                            showSuccess(`${submissions.length} submission(s) found`)
                          }}
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Lihat Submissions
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={isSubmissionDialogOpen} onOpenChange={setIsSubmissionDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[calc(100vh-4rem)]">
          <DialogHeader>
            <DialogTitle>
              {selectedSubmission && !Array.isArray(selectedSubmission) && (selectedSubmission.status === "submitted" || selectedSubmission.status === "graded")
                ? "Lihat Submission" 
                : "Kumpulkan Tugas"
              }
            </DialogTitle>
            <DialogDescription>
              {selectedSubmission && !Array.isArray(selectedSubmission) && (selectedSubmission.status === "submitted" || selectedSubmission.status === "graded")
                ? "Detail submission dan hasil penilaian" 
                : "Upload file atau tambahkan link untuk tugas Anda"
              }
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && selectedAssignment && !Array.isArray(selectedSubmission) && (
            <AssignmentSubmission
              assignment={selectedAssignment}
              submission={selectedSubmission}
              onSubmit={handleSubmissionSubmit}
              onSaveDraft={handleSubmissionSaveDraft}
              readonly={selectedSubmission.status === "submitted" || selectedSubmission.status === "graded"}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
