"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { FileUpload } from "@/components/ui/file-upload"
import { Upload, Link2, FileText, Trash2, ExternalLink, Download } from "lucide-react"
import { showSuccess, showError } from "@/lib/alerts"

interface SubmissionFile {
  id?: string
  name: string
  url: string
  size: number
  type: string
  uploadType: 'file' | 'link'
  uploadedAt?: number
}

interface AssignmentSubmissionProps {
  assignment: any
  submission: any
  onSubmit: (files: SubmissionFile[], note?: string) => void
  onSaveDraft: (files: SubmissionFile[], note?: string) => void
  readonly?: boolean
}

export function AssignmentSubmission({ 
  assignment, 
  submission, 
  onSubmit, 
  onSaveDraft, 
  readonly = false 
}: AssignmentSubmissionProps) {
  const [submissionFiles, setSubmissionFiles] = useState<SubmissionFile[]>(submission?.files || [])
  const [submissionNote, setSubmissionNote] = useState(submission?.note || "")
  const [linkUrl, setLinkUrl] = useState("")
  const [linkDescription, setLinkDescription] = useState("")
  const [activeTab, setActiveTab] = useState("files")

  const handleFilesChange = (files: File[]) => {
    const newFiles: SubmissionFile[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      url: URL.createObjectURL(file), // In real app, upload to server
      size: file.size,
      type: file.type,
      uploadType: 'file'
    }))

    setSubmissionFiles(prev => [...prev, ...newFiles])
  }

  const handleAddLink = () => {
    if (!linkUrl.trim()) {
      showError("URL link wajib diisi")
      return
    }

    // Basic URL validation
    try {
      new URL(linkUrl)
    } catch {
      showError("Format URL tidak valid")
      return
    }

    const linkFile: SubmissionFile = {
      id: Math.random().toString(36).substr(2, 9),
      name: linkDescription || linkUrl,
      url: linkUrl,
      size: 0,
      type: 'link',
      uploadType: 'link'
    }

    setSubmissionFiles(prev => [...prev, linkFile])
    setLinkUrl("")
    setLinkDescription("")
    showSuccess("Link berhasil ditambahkan")
  }

  const removeFile = (fileId: string) => {
    setSubmissionFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const handleSubmitForGrading = () => {
    if (submissionFiles.length === 0) {
      showError("Minimal upload 1 file atau tambahkan 1 link")
      return
    }
    onSubmit(submissionFiles, submissionNote)
  }

  const handleSaveDraft = () => {
    onSaveDraft(submissionFiles, submissionNote)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return ""
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  if (readonly) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={submission?.status === 'graded' ? 'default' : 'secondary'}>
              {submission?.status === 'graded' ? 'Dinilai' : 
               submission?.status === 'submitted' ? 'Dikumpulkan' : 'Draft'}
            </Badge>
            {submission?.submittedAt && (
              <span className="text-sm text-muted-foreground">
                Dikumpulkan: {new Date(submission.submittedAt).toLocaleString('id-ID')}
              </span>
            )}
          </div>
          
          {submission?.status === 'graded' && (
            <>
              <p className="text-lg font-semibold">Nilai: {submission.grade}/100</p>
              {submission.feedback && (
                <div className="mt-2">
                  <p className="text-sm font-medium">Feedback:</p>
                  <p className="text-sm text-muted-foreground">{submission.feedback}</p>
                </div>
              )}
            </>
          )}
        </div>

        {submissionNote && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Catatan Mahasiswa</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{submissionNote}</p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          <h4 className="text-sm font-medium">File/Link yang dikumpulkan:</h4>
          {submissionFiles.map((file) => (
            <Card key={file.id}>
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  {file.uploadType === 'link' ? (
                    <Link2 className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{file.name}</p>
                    {file.uploadType === 'file' && file.size > 0 && (
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {file.uploadType === 'link' ? 'Link' : file.name.split('.').pop()?.toUpperCase()}
                    </Badge>
                    {file.uploadType === 'link' ? (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={file.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={file.url} download={file.name}>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{assignment.title}</CardTitle>
          <CardDescription>{assignment.description}</CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="files" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload File
          </TabsTrigger>
          <TabsTrigger value="links" className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Tambah Link
          </TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upload File</CardTitle>
              <CardDescription>
                Upload file tugas dalam format PDF, Word, atau gambar (JPG, PNG)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload
                onFilesChange={handleFilesChange}
                acceptedTypes={[".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"]}
                maxFileSize={10 * 1024 * 1024} // 10MB
                maxFiles={5}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tambah Link</CardTitle>
              <CardDescription>
                Tambahkan link ke Google Drive, OneDrive, atau platform lainnya
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="linkUrl">URL Link *</Label>
                <Input
                  id="linkUrl"
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkDescription">Deskripsi (opsional)</Label>
                <Input
                  id="linkDescription"
                  value={linkDescription}
                  onChange={(e) => setLinkDescription(e.target.value)}
                  placeholder="Deskripsi singkat tentang file"
                />
              </div>
              <Button onClick={handleAddLink} className="w-full">
                <Link2 className="h-4 w-4 mr-2" />
                Tambah Link
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Submission Note */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Catatan (opsional)</CardTitle>
          <CardDescription>Tambahkan catatan atau keterangan untuk dosen</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={submissionNote}
            onChange={(e) => setSubmissionNote(e.target.value)}
            placeholder="Tulis catatan atau keterangan tambahan..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Submitted Files List */}
      {submissionFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">File/Link yang akan dikumpulkan ({submissionFiles.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {submissionFiles.map((file) => (
              <Card key={file.id}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    {file.uploadType === 'link' ? (
                      <Link2 className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{file.name}</p>
                      {file.uploadType === 'file' && file.size > 0 && (
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      )}
                      {file.uploadType === 'link' && (
                        <p className="text-xs text-muted-foreground truncate">{file.url}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {file.uploadType === 'link' ? 'Link' : file.name.split('.').pop()?.toUpperCase()}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => file.id && removeFile(file.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleSaveDraft}>
          Simpan Draft
        </Button>
        <Button onClick={handleSubmitForGrading} disabled={submissionFiles.length === 0}>
          Kumpulkan Tugas
        </Button>
      </div>
    </div>
  )
}
