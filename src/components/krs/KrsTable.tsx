"use client"

import { useMemo } from "react"
import { useSubjectsStore } from "@/stores/subjects.store"
import { useOfferingsStore } from "@/stores/offerings.store"
import { useKrsStore } from "@/stores/krs.store"
import type { KrsItem } from "@/data/schema"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Calendar } from "lucide-react"
import { confirmAction, showSuccess } from "@/lib/alerts"
import { fmtDateTime } from "@/lib/time"
import { ActivityLogger } from "@/lib/activity-logger"

interface KrsTableProps {
  userId: string
  term: string
  onScheduleSuggestion?: (subjectId: string) => void
}

export function KrsTable({ userId, term, onScheduleSuggestion }: KrsTableProps) {
  const { getSubjectById } = useSubjectsStore()
  const { getOffering } = useOfferingsStore()
  const { getKrsByUser, removeKrsItem } = useKrsStore()

  const krsItems = getKrsByUser(userId, term)

  const krsWithDetails = useMemo(() => {
    return krsItems
      .map((krsItem) => {
        const subject = getSubjectById(krsItem.subjectId)
        const offering = krsItem.offeringId ? getOffering(krsItem.offeringId) : null
        return subject ? { ...krsItem, subject, offering } : null
      })
      .filter(Boolean)
      .sort((a, b) => a!.subject.semester - b!.subject.semester)
  }, [krsItems, getSubjectById, getOffering])

  // Group KRS by angkatan and kelas
  const groupedKrs = useMemo(() => {
    const groups = krsWithDetails.reduce((acc, item) => {
      if (!item) return acc
      
      const angkatan = item.offering?.angkatan || item.subject.angkatan || "Tidak ada angkatan"
      const kelas = item.offering?.kelas || item.subject.kelas || "Tidak ada kelas"
      const key = `${angkatan}-${kelas}`
      
      if (!acc[key]) {
        acc[key] = {
          angkatan,
          kelas,
          items: []
        }
      }
      
      acc[key].items.push(item)
      return acc
    }, {} as Record<string, { angkatan: string | number; kelas: string; items: typeof krsWithDetails }>)

    // Sort groups by angkatan desc, then kelas asc
    return Object.values(groups).sort((a, b) => {
      const angkatanA = typeof a.angkatan === 'number' ? a.angkatan : 0
      const angkatanB = typeof b.angkatan === 'number' ? b.angkatan : 0
      if (angkatanB !== angkatanA) return angkatanB - angkatanA
      return a.kelas.localeCompare(b.kelas)
    })
  }, [krsWithDetails])

  const handleRemoveSubject = async (krsItem: KrsItem, subjectName: string, kelas?: string) => {
    const displayName = kelas ? `${subjectName} (Kelas ${kelas})` : subjectName
    const confirmed = await confirmAction(
      "Hapus dari KRS",
      `Apakah Anda yakin ingin menghapus "${displayName}" dari KRS?`,
      "Ya, Hapus",
    )

    if (confirmed) {
      removeKrsItem(krsItem.id, userId, displayName)
      showSuccess(`${displayName} berhasil dihapus dari KRS`)
    }
  }

  const getSemesterBadge = (semester: number) => {
    const colors = [
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    ]
    return colors[(semester - 1) % colors.length]
  }

  if (krsWithDetails.length === 0) {
    return (
      <Card>
        <CardHeader className="px-4 md:px-6 pt-4 md:pt-6">
          <CardTitle className="text-xl md:text-2xl">KRS Anda</CardTitle>
          <CardDescription className="text-sm md:text-base">Mata kuliah yang telah Anda ambil</CardDescription>
        </CardHeader>
        <CardContent className="px-4 md:px-6">
          <div className="text-center py-8 md:py-12">
            <p className="text-sm md:text-base text-muted-foreground">Belum ada mata kuliah yang diambil.</p>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">Pilih mata kuliah dari daftar di atas.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="px-4 md:px-6 pt-4 md:pt-6">
        <CardTitle className="text-xl md:text-2xl">KRS Anda</CardTitle>
        <CardDescription className="text-sm md:text-base">{krsWithDetails.length} mata kuliah telah dipilih untuk semester ini</CardDescription>
      </CardHeader>
      <CardContent className="px-4 md:px-6">
        <div className="space-y-4 md:space-y-6">
          {groupedKrs.map((group, groupIndex) => (
            <Card key={`${group.angkatan}-${group.kelas}`} className="animate-slide-in-left" style={{ animationDelay: `${groupIndex * 0.1}s` }}>
              <CardContent className="pt-4 md:pt-6">
                <div className="mb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="default" className="text-xs md:text-sm">
                        Angkatan {group.angkatan}
                      </Badge>
                      <Badge variant="outline" className="text-xs md:text-sm">
                        Kelas {group.kelas}
                      </Badge>
                      <span className="text-xs md:text-sm text-muted-foreground">
                        {group.items.length} mata kuliah
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Desktop Table View */}
                <div className="hidden md:block rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>SKS</TableHead>
                        <TableHead>Ditambahkan</TableHead>
                        <TableHead className="w-[120px]">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.items.map((item) => (
                        <TableRow
                          key={item!.id}
                          className="hover:bg-muted/50 transition-all duration-300 hover:shadow-md hover:scale-[1.01]"
                        >
                          <TableCell>
                            <div>
                              <p className="font-medium">{item!.subject.nama}</p>
                              {item!.subject.prodi && <p className="text-sm text-muted-foreground">{item!.subject.prodi}</p>}
                              {item!.offering?.term && <p className="text-xs text-muted-foreground">{item!.offering.term}</p>}
                            </div>
                          </TableCell>
                          <TableCell>{item!.subject.sks}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{fmtDateTime(item!.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              {((item!.offering?.slotDay && item!.offering?.slotStartUTC) || 
                                (item!.subject.slotDay && item!.subject.slotStartUTC)) && 
                                onScheduleSuggestion && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onScheduleSuggestion(item!.subject.id)}
                                  title="Tambah ke jadwal"
                                  className="hover:scale-110 transition-all duration-200 hover:shadow-md"
                                >
                                  <Calendar className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRemoveSubject(item!, item!.subject.nama, item!.offering?.kelas)}
                                className="text-destructive hover:text-destructive hover:scale-110 transition-all duration-200 hover:shadow-md"
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
                  {group.items.map((item) => (
                    <Card key={item!.id} className="border-2 hover:border-primary/50 transition-colors">
                      <CardContent className="p-3 md:p-4 space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm leading-tight break-words">
                              {item!.subject.nama}
                            </h4>
                            {item!.subject.prodi && (
                              <p className="text-xs text-muted-foreground mt-0.5">{item!.subject.prodi}</p>
                            )}
                            {item!.offering?.term && (
                              <p className="text-xs text-muted-foreground">{item!.offering.term}</p>
                            )}
                          </div>
                          <Badge className="text-xs flex-shrink-0">{item!.subject.sks} SKS</Badge>
                        </div>

                        {/* Details */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>Ditambahkan: {fmtDateTime(item!.createdAt)}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-2 border-t">
                          {((item!.offering?.slotDay && item!.offering?.slotStartUTC) || 
                            (item!.subject.slotDay && item!.subject.slotStartUTC)) && 
                            onScheduleSuggestion && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onScheduleSuggestion(item!.subject.id)}
                              className="flex-1 h-9 text-xs"
                            >
                              <Calendar className="h-3.5 w-3.5 mr-1.5" />
                              Tambah ke Jadwal
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveSubject(item!, item!.subject.nama, item!.offering?.kelas)}
                            className="text-destructive hover:text-destructive h-9 flex-1"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                            Hapus
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
      </CardContent>
    </Card>
  )
}
