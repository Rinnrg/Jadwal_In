"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useCourseworkStore } from "@/stores/coursework.store"
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
import { Plus, Edit, Trash2, ExternalLink, FileText, Calendar, Download, Link2 } from "lucide-react"
import { confirmAction, showSuccess, showError } from "@/lib/alerts"
import { fmtDate } from "@/lib/time"
import { arr } from "@/lib/utils"
import { MaterialForm } from "./MaterialForm"

interface MaterialTabProps {
  subjectId: string
  canManage: boolean
  userRole: string
}

export function MaterialTab({ subjectId, canManage, userRole }: MaterialTabProps) {
  const { getMaterialsBySubject, addMaterial, updateMaterial, removeMaterial, fetchMaterials, isFetching } = useCourseworkStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    attachments: [] as any[],
  })

  const materials = arr(getMaterialsBySubject(subjectId)).sort((a, b) => b.createdAt - a.createdAt)

  // Fetch materials on mount and when subjectId changes
  useEffect(() => {
    console.log('[MaterialTab] Fetching materials for subject:', subjectId)
    fetchMaterials(subjectId)
  }, [subjectId, fetchMaterials])

  // Log materials count for debugging
  useEffect(() => {
    console.log('[MaterialTab] Materials count for subject', subjectId, ':', materials.length)
  }, [materials.length, subjectId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      showError("Judul materi wajib diisi")
      return
    }

    try {
      const materialData = {
        title: formData.title,
        content: formData.content || undefined,
        attachments: formData.attachments || [],
      }

      if (editingMaterial) {
        await updateMaterial(editingMaterial.id, materialData)
        showSuccess("Materi berhasil diperbarui")
      } else {
        await addMaterial({
          subjectId,
          ...materialData,
        })
        showSuccess("Materi berhasil ditambahkan")
      }

      setIsDialogOpen(false)
      setEditingMaterial(null)
      setFormData({ title: "", content: "", attachments: [] })
    } catch (error) {
      showError("Terjadi kesalahan saat menyimpan materi")
      console.error(error)
    }
  }

  const handleEdit = (material: any) => {
    setEditingMaterial(material)
    setFormData({
      title: material.title,
      content: material.content || "",
      attachments: material.attachments || [],
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (material: any) => {
    const confirmed = await confirmAction(
      "Hapus Materi",
      `Apakah Anda yakin ingin menghapus materi "${material.title}"?`,
      "Ya, Hapus",
    )

    if (confirmed) {
      try {
        await removeMaterial(material.id)
        showSuccess("Materi berhasil dihapus")
      } catch (error) {
        showError("Gagal menghapus materi")
        console.error(error)
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Materi</h3>
          <p className="text-sm text-muted-foreground">
            {canManage ? "Kelola materi pembelajaran untuk mata kuliah ini" : "Materi pembelajaran yang tersedia"}
          </p>
        </div>
        {canManage && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 hover:scale-105 transition-transform duration-200">
                <Plus className="h-4 w-4" />
                Tambah Materi
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[calc(100vh-4rem)] w-[calc(100vw-2rem)] sm:w-full">
              <DialogHeader>
                <DialogTitle>{editingMaterial ? "Edit Materi" : "Tambah Materi Baru"}</DialogTitle>
                <DialogDescription>
                  {editingMaterial ? "Perbarui informasi materi" : "Buat materi pembelajaran baru dengan file dan link"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <MaterialForm
                  title={formData.title}
                  content={formData.content}
                  attachments={formData.attachments}
                  onTitleChange={(title) => setFormData(prev => ({ ...prev, title }))}
                  onContentChange={(content) => setFormData(prev => ({ ...prev, content }))}
                  onAttachmentsChange={(attachments) => setFormData(prev => ({ ...prev, attachments }))}
                />
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit">{editingMaterial ? "Perbarui" : "Tambah"} Materi</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {materials.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Belum Ada Materi</h3>
            <p className="text-muted-foreground">
              {canManage ? "Tambahkan materi pertama untuk mata kuliah ini" : "Belum ada materi yang tersedia"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {materials.map((material, index) => (
            <Card
              key={material.id}
              className="hover:shadow-lg hover:scale-[1.02] transition-all duration-300 card-interactive animate-slide-in-left"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{material.title}</CardTitle>
                    {material.content && (
                      <CardDescription className="whitespace-pre-wrap">{material.content}</CardDescription>
                    )}
                  </div>
                  {canManage && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(material)}
                        className="hover:scale-110 transition-transform duration-200"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(material)}
                        className="text-destructive hover:text-destructive hover:scale-110 transition-transform duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Attachments */}
                {material.attachments && material.attachments.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">File & Link:</h4>
                    <div className="grid gap-2">
                      {material.attachments.map((attachment: any, attachIndex: number) => (
                        <div
                          key={attachIndex}
                          className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                        >
                          {attachment.uploadType === 'link' ? (
                            <Link2 className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{attachment.name}</p>
                            {attachment.uploadType === 'file' && attachment.size > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {Math.round(attachment.size / 1024)} KB
                              </p>
                            )}
                          </div>
                          {attachment.uploadType === 'link' ? (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={attachment.url} target="_blank" rel="noopener noreferrer" title="Buka link">
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={attachment.url} download={attachment.name} title="Download file">
                                <Download className="h-3 w-3" />
                              </a>
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Dibuat: {fmtDate(material.createdAt)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
