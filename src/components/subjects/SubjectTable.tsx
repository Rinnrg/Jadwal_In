"use client"

import { useState } from "react"
import { useSubjectsStore } from "@/stores/subjects.store"
import { useUsersStore } from "@/stores/users.store"
import type { Subject } from "@/data/schema"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MoreHorizontal, Edit, Trash2, Search, Archive, ArchiveRestore } from "lucide-react"
import { confirmAction, showSuccess } from "@/lib/alerts"
import { arr } from "@/lib/utils"

interface SubjectTableProps {
  onEdit?: (subject: Subject) => void
}

export function SubjectTable({ onEdit }: SubjectTableProps) {
  const { subjects, deleteSubject, updateSubject } = useSubjectsStore()
  const { getUserById } = useUsersStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "aktif" | "arsip">("all")
  const [angkatanFilter, setAngkatanFilter] = useState("")
  const [kelasFilter, setKelasFilter] = useState("")

  const uniqueAngkatan = [...new Set(subjects.map((s) => s.angkatan).filter(Boolean))].sort()
  const uniqueKelas = [...new Set(subjects.map((s) => s.kelas).filter(Boolean))].sort()

  const filteredSubjects = subjects.filter((subject) => {
    const matchesSearch =
      subject.kode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.prodi?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || subject.status === statusFilter
    const matchesAngkatan = !angkatanFilter || subject.angkatan?.toString() === angkatanFilter
    const matchesKelas = !kelasFilter || subject.kelas?.toLowerCase() === kelasFilter.toLowerCase()

    return matchesSearch && matchesStatus && matchesAngkatan && matchesKelas
  })

  const handleDelete = async (subject: Subject) => {
    const confirmed = await confirmAction(
      "Hapus Mata Kuliah",
      `Apakah Anda yakin ingin menghapus mata kuliah "${subject.nama}"?`,
      "Ya, Hapus",
    )

    if (confirmed) {
      deleteSubject(subject.id)
      showSuccess("Mata kuliah berhasil dihapus")
    }
  }

  const handleToggleStatus = async (subject: Subject) => {
    const newStatus = subject.status === "aktif" ? "arsip" : "aktif"
    const action = newStatus === "arsip" ? "mengarsipkan" : "mengaktifkan"

    const confirmed = await confirmAction(
      `${action === "mengarsipkan" ? "Arsipkan" : "Aktifkan"} Mata Kuliah`,
      `Apakah Anda yakin ingin ${action} mata kuliah "${subject.nama}"?`,
      `Ya, ${action === "mengarsipkan" ? "Arsipkan" : "Aktifkan"}`,
    )

    if (confirmed) {
      updateSubject(subject.id, { status: newStatus })
      showSuccess(`Mata kuliah berhasil ${action === "mengarsipkan" ? "diarsipkan" : "diaktifkan"}`)
    }
  }

  const getStatusBadge = (status: Subject["status"]) => {
    return status === "aktif" ? <Badge variant="default">Aktif</Badge> : <Badge variant="secondary">Arsip</Badge>
  }

  const renderPengampuChips = (pengampuIds: string[]) => {
    if (!pengampuIds || pengampuIds.length === 0) {
      return <span className="text-muted-foreground">—</span>
    }

    const pengampuNames = arr(pengampuIds)
      .map((id) => getUserById(id))
      .filter(Boolean)
      .map((user) => user!.name)

    if (pengampuNames.length === 0) {
      return <span className="text-muted-foreground">—</span>
    }

    return (
      <div className="flex flex-wrap gap-1">
        {pengampuNames.map((name, index) => (
          <Badge key={index} variant="outline" className="text-xs">
            {name}
          </Badge>
        ))}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Mata Kuliah</CardTitle>
        <CardDescription>Kelola mata kuliah dalam katalog program studi</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Cari mata kuliah..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
                className="hover:scale-105 transition-transform duration-200"
              >
                Semua
              </Button>
              <Button
                variant={statusFilter === "aktif" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("aktif")}
                className="hover:scale-105 transition-transform duration-200"
              >
                Aktif
              </Button>
              <Button
                variant={statusFilter === "arsip" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("arsip")}
                className="hover:scale-105 transition-transform duration-200"
              >
                Arsip
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <select
                value={angkatanFilter}
                onChange={(e) => setAngkatanFilter(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                aria-label="Filter berdasarkan angkatan"
              >
                <option value="">Semua Angkatan</option>
                {uniqueAngkatan.map((angkatan) => (
                  <option key={angkatan} value={angkatan}>
                    Angkatan {angkatan}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <select
                value={kelasFilter}
                onChange={(e) => setKelasFilter(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                aria-label="Filter berdasarkan kelas"
              >
                <option value="">Semua Kelas</option>
                {uniqueKelas.map((kelas) => (
                  <option key={kelas} value={kelas}>
                    Kelas {kelas}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {filteredSubjects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== "all" || angkatanFilter || kelasFilter
                ? "Tidak ada mata kuliah yang sesuai dengan filter"
                : "Belum ada mata kuliah. Tambahkan mata kuliah pertama Anda."}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>SKS</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Angkatan</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Pengampu</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Warna</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubjects.map((subject, index) => (
                  <TableRow
                    key={subject.id}
                    className="hover:bg-muted/50 transition-all duration-300 hover:shadow-md hover:scale-[1.01] animate-slide-in-left group"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <TableCell className="font-medium">{subject.kode}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{subject.nama}</p>
                        {subject.prodi && <p className="text-sm text-muted-foreground">{subject.prodi}</p>}
                      </div>
                    </TableCell>
                    <TableCell>{subject.sks}</TableCell>
                    <TableCell>{subject.semester}</TableCell>
                    <TableCell>{subject.angkatan || "—"}</TableCell>
                    <TableCell>
                      {subject.kelas ? (
                        <Badge variant="outline" className="hover:scale-110 transition-transform duration-200">
                          {subject.kelas}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{renderPengampuChips(subject.pengampuIds)}</TableCell>
                    <TableCell>{getStatusBadge(subject.status)}</TableCell>
                    <TableCell>
                      <div
                        className="w-6 h-6 rounded-full border hover:scale-125 transition-transform duration-200 cursor-pointer shadow-md"
                        style={{ backgroundColor: subject.color }}
                      />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:scale-110 transition-transform duration-200"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit?.(subject)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(subject)}>
                            {subject.status === "aktif" ? (
                              <>
                                <Archive className="mr-2 h-4 w-4" />
                                Arsipkan
                              </>
                            ) : (
                              <>
                                <ArchiveRestore className="mr-2 h-4 w-4" />
                                Aktifkan
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(subject)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
