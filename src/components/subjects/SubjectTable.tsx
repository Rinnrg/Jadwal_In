"use client"

import { useState } from "react"
import { useSubjectsStore } from "@/stores/subjects.store"
import { useUsersStore } from "@/stores/users.store"
import { useOfferingsStore } from "@/stores/offerings.store"
import type { Subject } from "@/data/schema"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Edit, Trash2, Search } from "lucide-react"
import { confirmAction, showSuccess, showError } from "@/lib/alerts"
import { arr } from "@/lib/utils"

interface SubjectTableProps {
  subjects?: Subject[]
  onEdit?: (subject: Subject) => void
}

export function SubjectTable({ subjects: subjectsProp, onEdit }: SubjectTableProps) {
  const { subjects: allSubjects, deleteSubject, updateSubject } = useSubjectsStore()
  const subjects = subjectsProp || allSubjects
  const { getUserById } = useUsersStore()
  const { getOfferingsBySubject, updateOffering } = useOfferingsStore()
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

  // Group subjects by angkatan and kelas
  const groupedSubjects = filteredSubjects.reduce((acc, subject) => {
    const angkatan = subject.angkatan || "Tidak ada angkatan"
    const kelas = subject.kelas || "Tidak ada kelas"
    const key = `${angkatan}-${kelas}`
    
    if (!acc[key]) {
      acc[key] = {
        angkatan,
        kelas,
        subjects: []
      }
    }
    
    acc[key].subjects.push(subject)
    return acc
  }, {} as Record<string, { angkatan: string | number; kelas: string; subjects: Subject[] }>)

  // Sort groups by angkatan desc, then kelas asc
  const sortedGroups = Object.values(groupedSubjects).sort((a, b) => {
    // Sort by angkatan descending
    const angkatanA = typeof a.angkatan === 'number' ? a.angkatan : 0
    const angkatanB = typeof b.angkatan === 'number' ? b.angkatan : 0
    if (angkatanB !== angkatanA) return angkatanB - angkatanA
    
    // Then by kelas ascending
    return a.kelas.localeCompare(b.kelas)
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

  const handleToggleSubjectStatus = async (subject: Subject) => {
    try {
      const newStatus = subject.status === "aktif" ? "arsip" : "aktif"
      await updateSubject(subject.id, { status: newStatus })
      showSuccess(`Mata kuliah "${subject.nama}" diubah menjadi ${newStatus}`)
    } catch (error) {
      showError("Gagal mengubah status mata kuliah")
    }
  }

  const handleToggleGroupOfferings = async (angkatan: number | string, kelas: string) => {
    try {
      // Get all subjects in this group
      const groupSubjects = subjects.filter(
        (s) => s.angkatan === angkatan && s.kelas === kelas
      )

      if (groupSubjects.length === 0) {
        showError("Tidak ada mata kuliah untuk grup ini")
        return
      }

      // Get all offerings for this angkatan and kelas
      const allOfferings = useOfferingsStore.getState().offerings.filter(
        (o) => o.angkatan === angkatan && o.kelas === kelas
      )

      // If no offerings exist, create them first with status "buka"
      if (allOfferings.length === 0) {
        const currentYear = new Date().getFullYear()
        const currentMonth = new Date().getMonth()
        const isOddSemester = currentMonth >= 8 || currentMonth <= 1
        const currentTerm = `${currentYear}/${currentYear + 1}-${isOddSemester ? "Ganjil" : "Genap"}`

        // Create offerings for all subjects in this group
        await Promise.all(
          groupSubjects.map(async (subject) => {
            try {
              await fetch('/api/offerings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  subjectId: subject.id,
                  semester: subject.semester,
                  status: 'buka',
                  angkatan: subject.angkatan,
                  kelas: subject.kelas,
                  term: currentTerm,
                  capacity: 40,
                }),
              })
            } catch (err) {
              console.error(`Failed to create offering for ${subject.kode}:`, err)
            }
          })
        )

        // Refresh offerings
        await useOfferingsStore.getState().fetchOfferings()
        
        showSuccess(
          `Penawaran untuk Angkatan ${angkatan} Kelas ${kelas} telah dibuat dan dibuka`
        )
        return
      }

      // Check current status - if any is "buka", we'll close all; if all "tutup", we'll open all
      const hasOpenOfferings = allOfferings.some((o) => o.status === "buka")
      const newStatus = hasOpenOfferings ? "tutup" : "buka"

      // Update all offerings
      await Promise.all(
        allOfferings.map((offering) => updateOffering(offering.id, { status: newStatus }))
      )

      showSuccess(
        `Semua penawaran untuk Angkatan ${angkatan} Kelas ${kelas} telah ${newStatus === "buka" ? "dibuka" : "ditutup"}`
      )
    } catch (error) {
      console.error('Error toggling group offerings:', error)
      showError("Gagal mengubah status penawaran")
    }
  }

  const getGroupOfferingsStatus = (angkatan: number | string, kelas: string): "buka" | "tutup" | "mixed" => {
    const allOfferings = useOfferingsStore.getState().offerings.filter(
      (o) => o.angkatan === angkatan && o.kelas === kelas
    )

    if (allOfferings.length === 0) return "tutup"

    const openCount = allOfferings.filter((o) => o.status === "buka").length
    if (openCount === allOfferings.length) return "buka"
    if (openCount === 0) return "tutup"
    return "mixed"
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
      <CardContent className="pt-3 md:pt-6 px-2 md:px-6">
        <div className="space-y-3 md:space-y-6">
          <div>
            <h2 className="text-base md:text-2xl font-bold tracking-tight">Daftar Mata Kuliah</h2>
            <p className="text-xs md:text-base text-muted-foreground">Kelola mata kuliah dalam katalog program studi</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3.5 w-3.5 md:h-4 md:w-4" />
              <Input
                placeholder="Cari mata kuliah..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 md:pl-10 h-9 md:h-11 text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
            <div className="flex-1">
              <select
                value={angkatanFilter}
                onChange={(e) => setAngkatanFilter(e.target.value)}
                className="w-full h-9 md:h-11 px-2 md:px-3 py-1.5 md:py-2 border border-input bg-background rounded-md text-xs md:text-sm cursor-pointer"
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
                className="w-full h-9 md:h-11 px-2 md:px-3 py-1.5 md:py-2 border border-input bg-background rounded-md text-xs md:text-sm cursor-pointer"
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
          <div className="text-center py-6 md:py-8">
            <p className="text-xs md:text-base text-muted-foreground">
              {searchTerm || angkatanFilter || kelasFilter
                ? "Tidak ada mata kuliah yang sesuai dengan filter"
                : "Belum ada mata kuliah. Tambahkan mata kuliah pertama Anda."}
            </p>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-6">
            {sortedGroups.map((group, groupIndex) => (
              <Card key={`${group.angkatan}-${group.kelas}`} className="animate-slide-in-left" style={{ animationDelay: `${groupIndex * 0.1}s` }}>
                <CardContent className="pt-3 md:pt-6 px-2 md:px-6">
                  <div className="mb-3 md:mb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                        <Badge variant="default" className="text-[10px] md:text-sm">
                          Angkatan {group.angkatan}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] md:text-sm">
                          Kelas {group.kelas}
                        </Badge>
                        <span className="text-[10px] md:text-sm text-muted-foreground">
                          {group.subjects.length} MK
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 md:gap-2 sm:ml-auto">
                        <span className="text-[10px] md:text-sm text-muted-foreground">Tampil di KRS:</span>
                        <Switch
                          checked={getGroupOfferingsStatus(group.angkatan, group.kelas) === "buka"}
                          onCheckedChange={() => handleToggleGroupOfferings(group.angkatan, group.kelas)}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Desktop Table View */}
                  <div className="hidden md:block rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Kode</TableHead>
                          <TableHead>Nama</TableHead>
                          <TableHead>SKS</TableHead>
                          <TableHead>Pengampu</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.subjects.map((subject, index) => (
                          <TableRow
                            key={subject.id}
                            className="hover:bg-muted/50 transition-colors duration-200"
                          >
                            <TableCell className="font-medium">{subject.kode}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{subject.nama}</p>
                                {subject.prodi && <p className="text-sm text-muted-foreground">{subject.prodi}</p>}
                              </div>
                            </TableCell>
                            <TableCell>{subject.sks}</TableCell>
                            <TableCell>{renderPengampuChips(subject.pengampuIds)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={subject.status === "aktif"}
                                  onCheckedChange={() => handleToggleSubjectStatus(subject)}
                                />
                                <span className="text-sm">
                                  {subject.status === "aktif" ? "Aktif" : "Arsip"}
                                </span>
                              </div>
                            </TableCell>
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

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-2">
                    {group.subjects.map((subject) => (
                      <Card key={subject.id} className="border-2 hover:border-primary/50 transition-colors">
                        <CardContent className="p-3 space-y-2">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                <Badge variant="outline" className="text-[10px] font-mono">
                                  {subject.kode}
                                </Badge>
                                <Badge variant={subject.status === "aktif" ? "default" : "secondary"} className="text-[10px]">
                                  {subject.status === "aktif" ? "Aktif" : "Arsip"}
                                </Badge>
                              </div>
                              <h4 className="font-semibold text-xs leading-tight break-words">
                                {subject.nama}
                              </h4>
                              {subject.prodi && (
                                <p className="text-[10px] text-muted-foreground mt-0.5">{subject.prodi}</p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              <Badge className="text-[10px]">{subject.sks} SKS</Badge>
                            </div>
                          </div>

                          {/* Pengampu */}
                          {subject.pengampuIds && subject.pengampuIds.length > 0 && (
                            <div className="space-y-0.5">
                              <p className="text-[10px] text-muted-foreground">Pengampu:</p>
                              {renderPengampuChips(subject.pengampuIds)}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-1.5 pt-1.5 border-t">
                            <div className="flex items-center gap-1.5 flex-1">
                              <Switch
                                checked={subject.status === "aktif"}
                                onCheckedChange={() => handleToggleSubjectStatus(subject)}
                                className="scale-90"
                              />
                              <span className="text-[10px] text-muted-foreground">
                                {subject.status === "aktif" ? "Aktif" : "Arsip"}
                              </span>
                            </div>
                            {onEdit && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[10px] px-2"
                                onClick={() => onEdit(subject)}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(subject)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      </CardContent>
    </Card>
  )
}
