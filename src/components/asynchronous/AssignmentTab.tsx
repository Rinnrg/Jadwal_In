"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useCourseworkStore } from "@/stores/coursework.store"
import { useSubmissionsStore } from "@/stores/submissions.store"
import { useSessionStore } from "@/stores/session.store"
import { useUsersStore } from "@/stores/users.store"
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
import { Plus, Edit, Trash2, Calendar, Clock, FileText, Upload, Download, Eye, FileUp, Image as ImageIcon, X, CheckCircle, AlertCircle, User } from "lucide-react"
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
  const { getUserById } = useUsersStore()
  const { getAssignmentsBySubject, addAssignment, updateAssignment, removeAssignment, fetchAssignments, isFetching } = useCourseworkStore()
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
  const [isSubmissionsListDialogOpen, setIsSubmissionsListDialogOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<any>(null)
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null)
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null)
  const [viewingSubmissionsForAssignment, setViewingSubmissionsForAssignment] = useState<any>(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    dueTime: "",
    imageUrl: "",
    fileUrl: "",
  })

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingPdf, setUploadingPdf] = useState(false)

  const [gradingData, setGradingData] = useState({
    grade: "",
    feedback: "",
  })

  // Fetch assignments on mount and when subjectId changes
  useEffect(() => {
    console.log('[AssignmentTab] Fetching assignments for subject:', subjectId)
    fetchAssignments(subjectId)
  }, [subjectId, fetchAssignments])

  // Log assignments count for debugging
  useEffect(() => {
    console.log('[AssignmentTab] Assignments count for subject', subjectId, ':', assignments.length)
  }, [assignments.length, subjectId])
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError("File harus berupa gambar (JPG, PNG, dll)")
      e.target.value = ""
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError("Ukuran gambar maksimal 5MB")
      e.target.value = ""
      return
    }

    setImageFile(file)
    setUploadingImage(true)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('type', 'image')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await response.json()
      setFormData(prev => ({ ...prev, imageUrl: data.url }))
      showSuccess("Gambar berhasil diupload")
    } catch (error) {
      showError(error instanceof Error ? error.message : "Gagal mengupload gambar")
      setImageFile(null)
      e.target.value = ""
    } finally {
      setUploadingImage(false)
    }
  }

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (file.type !== 'application/pdf') {
      showError("File harus berupa PDF")
      e.target.value = ""
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showError("Ukuran PDF maksimal 10MB")
      e.target.value = ""
      return
    }

    setPdfFile(file)
    setUploadingPdf(true)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('type', 'pdf')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await response.json()
      setFormData(prev => ({ ...prev, fileUrl: data.url }))
      showSuccess("PDF berhasil diupload")
    } catch (error) {
      showError(error instanceof Error ? error.message : "Gagal mengupload PDF")
      setPdfFile(null)
      e.target.value = ""
    } finally {
      setUploadingPdf(false)
    }
  }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      showError("Judul tugas wajib diisi")
      return
    }

    const dueUTC =
      formData.dueDate && formData.dueTime ? new Date(`${formData.dueDate}T${formData.dueTime}`).getTime() : undefined

    try {
      if (editingAssignment) {
        await updateAssignment(editingAssignment.id, {
          title: formData.title,
          description: formData.description || undefined,
          dueUTC,
          imageUrl: formData.imageUrl || undefined,
          fileUrl: formData.fileUrl || undefined,
        })
        showSuccess("Tugas berhasil diperbarui")
      } else {
        await addAssignment({
          subjectId,
          title: formData.title,
          description: formData.description || undefined,
          dueUTC,
          imageUrl: formData.imageUrl || undefined,
          fileUrl: formData.fileUrl || undefined,
          attachments: [],
          allowedFileTypes: [],
          maxFileSize: 10 * 1024 * 1024, // 10MB
          maxFiles: 5,
        })
        showSuccess("Tugas berhasil ditambahkan")
      }

      setIsDialogOpen(false)
      setEditingAssignment(null)
      setFormData({ title: "", description: "", dueDate: "", dueTime: "", imageUrl: "", fileUrl: "" })
      setImageFile(null)
      setPdfFile(null)
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
      imageUrl: assignment.imageUrl || "",
      fileUrl: assignment.fileUrl || "",
    })
    setImageFile(null)
    setPdfFile(null)
    setIsDialogOpen(true)
  }

  const handleDelete = async (assignment: any) => {
    const confirmed = await confirmAction(
      "Hapus Tugas",
      `Apakah Anda yakin ingin menghapus tugas "${assignment.title}"?`,
      "Ya, Hapus",
    )

    if (confirmed) {
      try {
        await removeAssignment(assignment.id)
        showSuccess("Tugas berhasil dihapus")
      } catch (error) {
        showError("Gagal menghapus tugas")
        console.error(error)
      }
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
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
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

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label htmlFor="imageUpload" className="text-sm flex items-center gap-1.5">
                    <ImageIcon className="h-4 w-4 text-blue-500" />
                    Gambar Pendukung (Opsional)
                  </Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="imageUpload"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="flex-1 h-10 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    />
                    {uploadingImage && (
                      <div className="flex items-center gap-2 text-sm text-primary">
                        <FileUp className="h-4 w-4 animate-spin" />
                        <span>Uploading...</span>
                      </div>
                    )}
                  </div>
                  {formData.imageUrl && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-green-700 dark:text-green-400 truncate">
                          {imageFile?.name || formData.imageUrl.split('/').pop()}
                        </p>
                        {imageFile && (
                          <p className="text-xs text-green-600 dark:text-green-500">
                            {(imageFile.size / 1024).toFixed(2)} KB
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, imageUrl: "" }))
                          setImageFile(null)
                          const input = document.getElementById("imageUpload") as HTMLInputElement
                          if (input) input.value = ""
                        }}
                        className="flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Format: JPG/PNG. Maksimal 5MB
                  </p>
                </div>

                {/* PDF Upload */}
                <div className="space-y-2">
                  <Label htmlFor="pdfUpload" className="text-sm flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-red-500" />
                    Dokumen PDF (Opsional)
                  </Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="pdfUpload"
                      type="file"
                      accept="application/pdf"
                      onChange={handlePdfUpload}
                      disabled={uploadingPdf}
                      className="flex-1 h-10 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    />
                    {uploadingPdf && (
                      <div className="flex items-center gap-2 text-sm text-primary">
                        <FileUp className="h-4 w-4 animate-spin" />
                        <span>Uploading...</span>
                      </div>
                    )}
                  </div>
                  {formData.fileUrl && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-green-700 dark:text-green-400 truncate">
                          {pdfFile?.name || formData.fileUrl.split('/').pop()}
                        </p>
                        {pdfFile && (
                          <p className="text-xs text-green-600 dark:text-green-500">
                            {(pdfFile.size / 1024).toFixed(2)} KB
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, fileUrl: "" }))
                          setPdfFile(null)
                          const input = document.getElementById("pdfUpload") as HTMLInputElement
                          if (input) input.value = ""
                        }}
                        className="flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Format: PDF. Maksimal 10MB
                  </p>
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
                  {/* Display Image and PDF attachments */}
                  {(assignment.imageUrl || assignment.fileUrl) && (
                    <div className="mb-4 space-y-3">
                      {assignment.imageUrl && (
                        <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted border">
                          <img
                            src={assignment.imageUrl}
                            alt={assignment.title}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = "none"
                            }}
                          />
                        </div>
                      )}
                      {assignment.fileUrl && (
                        <a
                          href={assignment.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors"
                        >
                          <FileText className="h-5 w-5 text-blue-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                              Dokumen Tugas
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                              Klik untuk membuka PDF
                            </p>
                          </div>
                          <Download className="h-4 w-4 text-blue-600" />
                        </a>
                      )}
                    </div>
                  )}

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
                            setViewingSubmissionsForAssignment(assignment)
                            setIsSubmissionsListDialogOpen(true)
                          }}
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Lihat Submissions ({submissions.length})
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

      {/* Submissions List Dialog for Dosen/Kaprodi */}
      <Dialog open={isSubmissionsListDialogOpen} onOpenChange={setIsSubmissionsListDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Daftar Pengumpulan Tugas</DialogTitle>
            <DialogDescription>
              {viewingSubmissionsForAssignment?.title} • {
                getSubmissionsByAssignment(viewingSubmissionsForAssignment?.id || "").length
              } pengumpulan
            </DialogDescription>
          </DialogHeader>

          {viewingSubmissionsForAssignment && (
            <div className="space-y-3">
              {getSubmissionsByAssignment(viewingSubmissionsForAssignment.id).length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Belum ada mahasiswa yang mengumpulkan tugas ini</p>
                  </CardContent>
                </Card>
              ) : (
                getSubmissionsByAssignment(viewingSubmissionsForAssignment.id).map((submission: any) => {
                  const student = getUserById(submission.studentId)
                  const submissionDate = new Date(submission.submittedAt)
                  const isLate = viewingSubmissionsForAssignment.dueUTC && submission.submittedAt > viewingSubmissionsForAssignment.dueUTC
                  
                  return (
                    <Card key={submission.id} className="hover:border-primary/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-sm">{student?.name || "Unknown Student"}</h4>
                                {submission.status === "graded" && (
                                  <Badge variant="default" className="text-xs">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Dinilai
                                  </Badge>
                                )}
                                {submission.status === "submitted" && (
                                  <Badge variant="secondary" className="text-xs">
                                    Menunggu Penilaian
                                  </Badge>
                                )}
                                {isLate && (
                                  <Badge variant="destructive" className="text-xs">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Terlambat
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {student?.email || "-"}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {fmtDateTime(submission.submittedAt)}
                                </div>
                                {submission.files && submission.files.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    {submission.files.length} file
                                  </div>
                                )}
                              </div>
                              {submission.note && (
                                <p className="text-xs mt-2 p-2 bg-muted rounded border">
                                  {submission.note}
                                </p>
                              )}
                              {submission.grade !== undefined && submission.grade !== null && (
                                <div className="mt-2 flex items-center gap-2">
                                  <Badge variant="default" className="text-xs font-bold">
                                    Nilai: {submission.grade}
                                  </Badge>
                                  {submission.feedback && (
                                    <span className="text-xs text-muted-foreground">• {submission.feedback}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedSubmission(submission)
                                setSelectedAssignment(viewingSubmissionsForAssignment)
                                setIsSubmissionsListDialogOpen(false)
                                setIsSubmissionDialogOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {submission.status === "submitted" && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => {
                                  setSelectedSubmission(submission)
                                  setSelectedAssignment(viewingSubmissionsForAssignment)
                                  setGradingData({
                                    grade: "",
                                    feedback: "",
                                  })
                                  setIsSubmissionsListDialogOpen(false)
                                  setIsGradingDialogOpen(true)
                                }}
                              >
                                Nilai
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
