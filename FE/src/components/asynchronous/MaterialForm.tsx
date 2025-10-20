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

interface MaterialFile {
  id?: string
  name: string
  url: string
  size: number
  type: string
  uploadType: 'file' | 'link'
  uploadedAt?: number
}

interface MaterialFormProps {
  title: string
  content: string
  attachments: MaterialFile[]
  onTitleChange: (title: string) => void
  onContentChange: (content: string) => void
  onAttachmentsChange: (attachments: MaterialFile[]) => void
}

export function MaterialForm({ 
  title,
  content,
  attachments,
  onTitleChange,
  onContentChange,
  onAttachmentsChange
}: MaterialFormProps) {
  const [activeTab, setActiveTab] = useState("content")
  const [newLinkUrl, setNewLinkUrl] = useState("")
  const [newLinkDescription, setNewLinkDescription] = useState("")

  const handleFilesChange = (files: File[]) => {
    const newFiles: MaterialFile[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      url: URL.createObjectURL(file), // In real app, upload to server
      size: file.size,
      type: file.type,
      uploadType: 'file'
    }))

    onAttachmentsChange([...attachments, ...newFiles])
  }

  const handleAddLink = () => {
    if (!newLinkUrl.trim()) {
      showError("URL link wajib diisi")
      return
    }

    // Basic URL validation
    try {
      new URL(newLinkUrl)
    } catch {
      showError("Format URL tidak valid")
      return
    }

    const linkFile: MaterialFile = {
      id: Math.random().toString(36).substr(2, 9),
      name: newLinkDescription || newLinkUrl,
      url: newLinkUrl,
      size: 0,
      type: 'link',
      uploadType: 'link'
    }

    onAttachmentsChange([...attachments, linkFile])
    setNewLinkUrl("")
    setNewLinkDescription("")
    showSuccess("Link berhasil ditambahkan")
  }

  const removeAttachment = (fileId: string) => {
    onAttachmentsChange(attachments.filter(f => f.id !== fileId))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return ""
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Judul Materi *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Masukkan judul materi"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Deskripsi</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            placeholder="Deskripsi atau penjelasan materi (opsional)"
            rows={3}
          />
        </div>


      </div>

      {/* File Upload and Additional Links */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="content" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload File
          </TabsTrigger>
          <TabsTrigger value="links" className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Link Tambahan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upload File Materi</CardTitle>
              <CardDescription>
                Upload dokumen, presentasi, gambar, atau file lainnya sebagai materi pembelajaran
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload
                onFilesChange={handleFilesChange}
                acceptedTypes={[".pdf", ".doc", ".docx", ".ppt", ".pptx", ".jpg", ".jpeg", ".png", ".txt", ".xlsx", ".xls"]}
                maxFileSize={25 * 1024 * 1024} // 25MB
                maxFiles={10}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tambah Link Tambahan</CardTitle>
              <CardDescription>
                Tambahkan link ke video YouTube, artikel, atau sumber pembelajaran lainnya
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newLinkUrl">URL Link *</Label>
                <Input
                  id="newLinkUrl"
                  type="url"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newLinkDescription">Deskripsi Link</Label>
                <Input
                  id="newLinkDescription"
                  value={newLinkDescription}
                  onChange={(e) => setNewLinkDescription(e.target.value)}
                  placeholder="Video Tutorial, Artikel Referensi, dll."
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

      {/* Attachments List */}
      {attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">File & Link yang ditambahkan ({attachments.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {attachments.map((file) => (
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
                      {file.uploadType === 'link' ? (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={file.url} target="_blank" rel="noopener noreferrer" title="Buka link">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={file.url} download={file.name} title="Download file">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(file.id!)}
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
    </div>
  )
}
