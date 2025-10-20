"use client"

import { useState } from "react"
import { useSubjectsStore } from "@/stores/subjects.store"
import { useUsersStore } from "@/stores/users.store"
import type { Subject } from "@/data/schema"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Edit, Trash2, Search } from "lucide-react"
import { confirmAction, showSuccess } from "@/lib/alerts"
import { arr } from "@/lib/utils"

interface SubjectTableProps {
  onEdit?: (subject: Subject) => void
}

export function SubjectTable({ onEdit }: SubjectTableProps) {
  const { subjects, deleteSubject } = useSubjectsStore()
  const { getUserById } = useUsersStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [angkatanFilter, setAngkatanFilter] = useState("")
  const [kelasFilter, setKelasFilter] = useState("")

  const uniqueAngkatan = [...new Set(subjects.map((s) => s.angkatan).filter(Boolean))].sort()
  const uniqueKelas = [...new Set(subjects.map((s) => s.kelas).filter(Boolean))].sort()

  const filteredSubjects = subjects.filter((subject) => {
    const matchesSearch =
      subject.kode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.prodi?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesAngkatan = !angkatanFilter || subject.angkatan?.toString() === angkatanFilter
    const matchesKelas = !kelasFilter || subject.kelas?.toLowerCase() === kelasFilter.toLowerCase()

    return matchesSearch && matchesAngkatan && matchesKelas
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
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Daftar Mata Kuliah</h2>
            <p className="text-muted-foreground">Kelola mata kuliah dalam katalog program studi</p>
          </div>
          
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
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <select
                value={angkatanFilter}
                onChange={(e) => setAngkatanFilter(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm cursor-pointer"
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
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm cursor-pointer"
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

          {filteredSubjects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {searchTerm || angkatanFilter || kelasFilter
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
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubjects.map((subject, index) => (
                  <TableRow
                    key={subject.id}
                    className="hover:bg-muted/50 transition-colors duration-200 animate-slide-in-left"
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
                        <Badge variant="outline">
                          {subject.kelas}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{renderPengampuChips(subject.pengampuIds)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200"
                          onClick={() => onEdit?.(subject)}
                        >
                          <Edit className="h-4 w-4 mr-1.5" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 cursor-pointer hover:bg-destructive/10 text-destructive transition-colors duration-200"
                          onClick={() => handleDelete(subject)}
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
        )}
      </div>
      </CardContent>
    </Card>
  )
}
