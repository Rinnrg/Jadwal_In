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

// Helper function to get current term
const getCurrentTerm = () => {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()
  const isOddSemester = currentMonth >= 8 || currentMonth <= 1
  return `${currentYear}/${currentYear + 1}-${isOddSemester ? "Ganjil" : "Genap"}`
}

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
  const [kelasFilter, setKelasFilter] = useState("")

  const uniqueKelas = [...new Set(subjects.map((s) => s.kelas).filter(Boolean))].sort()

  const filteredSubjects = subjects.filter((subject) => {
    const matchesSearch =
      subject.kode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.prodi?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesKelas = !kelasFilter || subject.kelas?.toLowerCase() === kelasFilter.toLowerCase()

    return matchesSearch && matchesKelas
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
  
  const handleFixMissingOfferings = async (angkatan: number | string, kelas: string) => {
    try {
      const activeSubjects = subjects.filter(
        (s) => s.angkatan === angkatan && s.kelas === kelas && s.status === "aktif"
      )
      
      // Find subjects without offerings
      const subjectsWithoutOfferings = activeSubjects.filter(subject => {
        const offerings = getOfferingsBySubject(subject.id)
        return offerings.length === 0
      })
      
      if (subjectsWithoutOfferings.length === 0) {
        showSuccess("Semua mata kuliah aktif sudah memiliki penawaran!")
        return
      }
      
      const confirmed = await confirmAction(
        "Buat Penawaran yang Hilang",
        `Ditemukan ${subjectsWithoutOfferings.length} mata kuliah aktif tanpa penawaran:\n\n${subjectsWithoutOfferings.map(s => `• ${s.nama}`).join('\n')}\n\nBuat penawaran untuk semua mata kuliah ini?`,
        "Ya, Buat Penawaran"
      )
      
      if (!confirmed) return
      
      const { addOffering } = useOfferingsStore.getState()
      const currentTerm = getCurrentTerm()
      
      let created = 0
      let failed = 0
      
      for (const subject of subjectsWithoutOfferings) {
        try {
          console.log(`[FixOfferings] Creating offering for "${subject.nama}"`)
          await addOffering({
            subjectId: subject.id,
            angkatan: subject.angkatan,
            kelas: subject.kelas || kelas,
            semester: subject.semester,
            term: currentTerm,
            status: "buka",
            capacity: 40,
          })
          created++
        } catch (error) {
          console.error(`[FixOfferings] Failed for "${subject.nama}":`, error)
          failed++
        }
      }
      
      if (created > 0) {
        showSuccess(`✅ Berhasil membuat ${created} penawaran${failed > 0 ? `, ${failed} gagal` : ''}. Silakan cek halaman KRS!`)
        // Force refresh
        setTimeout(() => {
          const { fetchOfferings } = useOfferingsStore.getState()
          fetchOfferings(undefined, true)
        }, 100)
      } else {
        showError("Gagal membuat penawaran. Silakan coba lagi.")
      }
    } catch (error) {
      console.error('[FixOfferings] Error:', error)
      showError("Terjadi kesalahan saat membuat penawaran")
    }
  }

  const handleToggleSubjectStatus = async (subject: Subject) => {
    try {
      const newStatus = subject.status === "aktif" ? "arsip" : "aktif"
      await updateSubject(subject.id, { status: newStatus })
      
      // CRITICAL: When activating subject, also open all offerings for this subject
      // When archiving subject, close all offerings for this subject
      const offerings = getOfferingsBySubject(subject.id)
      const newOfferingStatus = newStatus === "aktif" ? "buka" : "tutup"
      
      console.log(`[SubjectTable] Toggling subject "${subject.nama}" to ${newStatus}`)
      console.log(`[SubjectTable] Found ${offerings.length} offerings for subject`)
      
      if (newStatus === "aktif" && offerings.length === 0) {
        // Auto-create offering if subject is activated but has no offerings
        console.log(`[SubjectTable] Auto-creating offering for subject "${subject.nama}"`)
        
        const { addOffering } = useOfferingsStore.getState()
        const currentTerm = getCurrentTerm()
        
        // Create offering for this subject's angkatan and kelas
        try {
          await addOffering({
            subjectId: subject.id,
            angkatan: subject.angkatan,
            kelas: subject.kelas || "A", // Default to A if no kelas
            semester: subject.semester,
            term: currentTerm,
            status: "buka",
            capacity: 40, // Default capacity
          })
          
          showSuccess(
            `Mata kuliah "${subject.nama}" diaktifkan dan penawaran dibuat untuk Angkatan ${subject.angkatan} Kelas ${subject.kelas || "A"}`
          )
        } catch (error) {
          console.error('[SubjectTable] Error creating offering:', error)
          showSuccess(`Mata kuliah "${subject.nama}" diaktifkan, tapi gagal membuat penawaran otomatis`)
        }
      } else if (offerings.length > 0) {
        // Update all existing offerings for this subject
        console.log(`[SubjectTable] Updating ${offerings.length} offerings to ${newOfferingStatus}`)
        
        await Promise.all(
          offerings.map(offering => 
            updateOffering(offering.id, { status: newOfferingStatus })
          )
        )
        
        showSuccess(
          `Mata kuliah "${subject.nama}" diubah menjadi ${newStatus} dan ${offerings.length} penawaran diubah menjadi ${newOfferingStatus}`
        )
      } else {
        // Just update subject status (archiving with no offerings)
        showSuccess(`Mata kuliah "${subject.nama}" diubah menjadi ${newStatus}`)
      }
      
      // Force refresh offerings and KRS
      const { fetchOfferings } = useOfferingsStore.getState()
      setTimeout(() => fetchOfferings(undefined, true), 100)
    } catch (error) {
      console.error('[SubjectTable] Error toggling subject status:', error)
      showError("Gagal mengubah status mata kuliah")
    }
  }

  const handleRefreshKRS = async (angkatan: number | string, kelas: string) => {
    try {
      // Get all ACTIVE subjects in this group
      const activeSubjects = subjects.filter(
        (s) => s.angkatan === angkatan && s.kelas === kelas && s.status === "aktif"
      )

      if (activeSubjects.length === 0) {
        showError("Tidak ada mata kuliah aktif untuk grup ini. Pastikan mata kuliah sudah diaktifkan terlebih dahulu.")
        return
      }
      
      // CRITICAL: Check for subjects without offerings and auto-create them
      const { addOffering } = useOfferingsStore.getState()
      const currentTerm = getCurrentTerm()
      
      let offeringsCreated = 0
      for (const subject of activeSubjects) {
        const subjectOfferings = getOfferingsBySubject(subject.id)
        if (subjectOfferings.length === 0) {
          console.log(`[RefreshKRS] Creating missing offering for "${subject.nama}"`)
          try {
            await addOffering({
              subjectId: subject.id,
              angkatan: subject.angkatan,
              kelas: subject.kelas || kelas,
              semester: subject.semester,
              term: currentTerm,
              status: "buka",
              capacity: 40,
            })
            offeringsCreated++
          } catch (error) {
            console.error(`[RefreshKRS] Failed to create offering for "${subject.nama}":`, error)
          }
        }
      }
      
      if (offeringsCreated > 0) {
        showSuccess(`Dibuat ${offeringsCreated} penawaran yang hilang. Silakan refresh halaman.`)
        // Wait a bit for offerings to be created
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      const confirmed = await confirmAction(
        "Refresh KRS Mahasiswa",
        `Refresh akan menambahkan ${activeSubjects.length} mata kuliah AKTIF ke KRS mahasiswa Angkatan ${angkatan} Kelas ${kelas}.\n\nHanya mata kuliah dengan status AKTIF yang akan ditambahkan.`,
        "Ya, Refresh KRS"
      )
      
      if (!confirmed) {
        return
      }

      // Import users store to get mahasiswa
      const { useUsersStore } = await import('@/stores/users.store')
      const { useKrsStore } = await import('@/stores/krs.store')
      
      const users = useUsersStore.getState().users
      const { addKrsItem } = useKrsStore.getState()
      
      // Get ALL mahasiswa users (no filter by angkatan/kelas)
      // Refresh KRS will add ALL active subjects to ALL mahasiswa
      const allMahasiswa = users.filter(u => u.role === 'mahasiswa')
      
      console.log(`[RefreshKRS] Found ${allMahasiswa.length} total mahasiswa`)

      if (allMahasiswa.length === 0) {
        showError("Tidak ada mahasiswa ditemukan")
        return
      }

      let addedCount = 0
      
      // Add each ACTIVE subject to EVERY mahasiswa's KRS
      for (const mahasiswa of allMahasiswa) {
        for (const subject of activeSubjects) {
          // Check if already in KRS
          const { isSubjectInKrs } = useKrsStore.getState()
          if (!isSubjectInKrs(mahasiswa.id, subject.id, currentTerm)) {
            addKrsItem(mahasiswa.id, subject.id, currentTerm, undefined, subject.nama, subject.sks)
            addedCount++
            console.log(`[RefreshKRS] Added "${subject.nama}" to ${mahasiswa.name}'s KRS`)
          }
        }
      }

      showSuccess(
        `Berhasil menambahkan ${addedCount} mata kuliah AKTIF ke KRS ${allMahasiswa.length} mahasiswa`
      )
    } catch (error) {
      console.error('Error refreshing KRS:', error)
      showError("Gagal refresh KRS mahasiswa")
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
              {searchTerm || kelasFilter
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
                      <div className="flex items-center gap-1.5 md:gap-2 sm:ml-auto flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleFixMissingOfferings(group.angkatan, group.kelas)}
                          className="text-xs md:text-sm h-8 md:h-9 border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                          title="Buat penawaran untuk mata kuliah yang belum punya offering"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                          Fix Offerings
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleRefreshKRS(group.angkatan, group.kelas)}
                          className="text-xs md:text-sm h-8 md:h-9"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
                          Refresh KRS
                        </Button>
                        <span className="text-[10px] md:text-xs text-muted-foreground">
                          {getGroupOfferingsStatus(group.angkatan, group.kelas) === "buka" ? "Buka" : 
                           getGroupOfferingsStatus(group.angkatan, group.kelas) === "mixed" ? "Sebagian" : "Tutup"}
                        </span>
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
                                  className="h-8 px-3 cursor-pointer text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-300 transition-colors duration-200"
                                  onClick={() => onEdit?.(subject)}
                                >
                                  <Edit className="h-4 w-4 mr-1.5" />
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 cursor-pointer hover:bg-destructive/10 text-destructive hover:text-destructive transition-colors duration-200"
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
                              className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
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
