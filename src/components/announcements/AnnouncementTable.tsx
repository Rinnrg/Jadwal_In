"use client"

import { useState } from "react"
import { useAnnouncementStore } from "@/stores/announcement.store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Edit, Trash2, Search, Image as ImageIcon, FileText } from "lucide-react"
import { confirmAction, showSuccess, showError } from "@/lib/alerts"
import { formatDistanceToNow } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import type { Announcement } from "@/stores/announcement.store"

interface AnnouncementTableProps {
  announcements?: Announcement[]
  onEdit?: (announcement: Announcement) => void
}

export function AnnouncementTable({ announcements: announcementsProp, onEdit }: AnnouncementTableProps) {
  const { announcements: allAnnouncements, deleteAnnouncement } = useAnnouncementStore()
  const announcements = announcementsProp || allAnnouncements
  const [searchTerm, setSearchTerm] = useState("")

  const filteredAnnouncements = announcements.filter((announcement) => {
    const matchesSearch =
      announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.description.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  const handleDelete = async (announcement: Announcement) => {
    const confirmed = await confirmAction(
      "Hapus Pengumuman",
      `Apakah Anda yakin ingin menghapus pengumuman "${announcement.title}"?`,
      "Ya, Hapus"
    )

    if (confirmed) {
      try {
        await deleteAnnouncement(announcement.id)
        showSuccess("Pengumuman berhasil dihapus")
      } catch (error) {
        showError(error instanceof Error ? error.message : "Gagal menghapus pengumuman")
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Pengumuman</CardTitle>
        <CardDescription>Total {announcements.length} pengumuman</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Cari pengumuman..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {filteredAnnouncements.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? "Tidak ada pengumuman yang sesuai dengan pencarian" : "Belum ada pengumuman"}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Judul</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Media</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dibuat</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAnnouncements.map((announcement) => (
                    <TableRow key={announcement.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <p className="font-medium">{announcement.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {announcement.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {announcement.targetRoles.map((role) => (
                            <Badge key={role} variant="secondary" className="text-xs">
                              {role === "mahasiswa" ? "Mahasiswa" : role === "dosen" ? "Dosen" : "Kaprodi"}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {announcement.imageUrl && (
                            <Badge variant="outline" className="text-xs">
                              <ImageIcon className="h-3 w-3 mr-1" />
                              Gambar
                            </Badge>
                          )}
                          {announcement.fileUrl && (
                            <Badge variant="outline" className="text-xs">
                              <FileText className="h-3 w-3 mr-1" />
                              PDF
                            </Badge>
                          )}
                          {!announcement.imageUrl && !announcement.fileUrl && (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={announcement.isActive ? "default" : "secondary"}>
                          {announcement.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(announcement.createdAt), {
                          addSuffix: true,
                          locale: idLocale,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {onEdit && (
                            <Button size="sm" variant="outline" onClick={() => onEdit(announcement)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(announcement)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {filteredAnnouncements.map((announcement) => (
                <Card key={announcement.id} className="border-2 hover:border-primary/50 transition-colors">
                  <CardContent className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm leading-tight break-words">
                          {announcement.title}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {announcement.description}
                        </p>
                      </div>
                      <Badge variant={announcement.isActive ? "default" : "secondary"} className="text-xs flex-shrink-0">
                        {announcement.isActive ? "Aktif" : "Off"}
                      </Badge>
                    </div>

                    {/* Target Roles */}
                    <div className="flex gap-1 flex-wrap">
                      {announcement.targetRoles.map((role) => (
                        <Badge key={role} variant="secondary" className="text-xs">
                          {role === "mahasiswa" ? "Mahasiswa" : role === "dosen" ? "Dosen" : "Kaprodi"}
                        </Badge>
                      ))}
                    </div>

                    {/* Media */}
                    {(announcement.imageUrl || announcement.fileUrl) && (
                      <div className="flex gap-2">
                        {announcement.imageUrl && (
                          <Badge variant="outline" className="text-xs">
                            <ImageIcon className="h-3 w-3 mr-1" />
                            Gambar
                          </Badge>
                        )}
                        {announcement.fileUrl && (
                          <Badge variant="outline" className="text-xs">
                            <FileText className="h-3 w-3 mr-1" />
                            PDF
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(announcement.createdAt), {
                          addSuffix: true,
                          locale: idLocale,
                        })}
                      </p>
                      <div className="flex gap-2">
                        {onEdit && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs px-2"
                            onClick={() => onEdit(announcement)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDelete(announcement)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
