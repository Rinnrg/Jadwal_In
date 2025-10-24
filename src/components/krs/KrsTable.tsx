"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { useSubjectsStore } from "@/stores/subjects.store"
import { useOfferingsStore } from "@/stores/offerings.store"
import { useKrsStore } from "@/stores/krs.store"
import { useScheduleStore } from "@/stores/schedule.store"
import type { KrsItem } from "@/data/schema"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Calendar } from "lucide-react"
import { confirmAction, showSuccess, showError } from "@/lib/alerts"
import { fmtDateTime } from "@/lib/time"
import { ActivityLogger } from "@/lib/activity-logger"

interface KrsTableProps {
  userId: string
  term: string
  onScheduleSuggestion?: (subjectId: string) => void
}

export function KrsTable({ userId, term, onScheduleSuggestion }: KrsTableProps) {
  const router = useRouter()
  const { getSubjectById } = useSubjectsStore()
  const { getOffering } = useOfferingsStore()
  const { getKrsByUser, removeKrsItem } = useKrsStore()
  const { addEvent, getEventsByUser } = useScheduleStore()

  const krsItems = getKrsByUser(userId, term)
  const userSchedule = getEventsByUser(userId)

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

  const handleAddToSchedule = (krsItem: KrsItem, subject: any, offering: any) => {
    // Check if subject already has a schedule
    const hasSchedule = userSchedule.some(event => event.subjectId === krsItem.subjectId)
    if (hasSchedule) {
      showError(`${subject.nama} sudah ada di jadwal`)
      return
    }

    // Get schedule info from offering or subject
    const slotDay = offering?.slotDay ?? subject?.slotDay
    const slotStartUTC = offering?.slotStartUTC ?? subject?.slotStartUTC
    const slotEndUTC = offering?.slotEndUTC ?? subject?.slotEndUTC
    const location = offering?.location ?? subject?.location

    if (slotDay === undefined || !slotStartUTC || !slotEndUTC) {
      showError("Data jadwal tidak tersedia untuk mata kuliah ini")
      return
    }

    // Add to schedule
    addEvent({
      userId,
      subjectId: krsItem.subjectId,
      dayOfWeek: slotDay,
      startUTC: slotStartUTC,
      endUTC: slotEndUTC,
      location: location || undefined,
      color: subject?.color,
    })

    showSuccess(`${subject.nama} berhasil ditambahkan ke jadwal`)
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
      <div className="md:bg-card md:border md:rounded-lg px-3 md:px-6 py-6">
        <div className="mb-3 md:mb-4">
          <h2 className="text-base md:text-xl font-bold">KRS Anda</h2>
          <p className="text-xs md:text-sm text-muted-foreground">Mata kuliah yang telah Anda ambil</p>
        </div>
        <div className="text-center py-8 md:py-12">
          <p className="text-sm md:text-base text-muted-foreground">Belum ada mata kuliah yang diambil.</p>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">Pilih mata kuliah dari daftar di atas.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Header */}
      <div className="px-3 md:px-0">
        <div className="md:bg-card md:border md:rounded-lg md:p-6 md:pb-4">
          <h2 className="text-base md:text-xl font-bold">KRS Anda</h2>
          <p className="text-xs md:text-sm text-muted-foreground">{krsWithDetails.length} mata kuliah telah dipilih</p>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3 md:space-y-4">
        {groupedKrs.map((group, groupIndex) => (
          <div key={`${group.angkatan}-${group.kelas}`} className="animate-slide-in-left" style={{ animationDelay: `${groupIndex * 0.1}s` }}>
            {/* Group Header - Sticky di mobile */}
            <div className="sticky top-[72px] md:static z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-y md:border-0 px-3 md:px-0 py-2 md:py-0 md:mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="default" className="text-xs">
                  Angkatan {group.angkatan}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Kelas {group.kelas}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {group.items.length} matkul
                </span>
              </div>
            </div>
            
            {/* Desktop Table View */}
            <div className="hidden md:block bg-card border rounded-lg">
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
                          {((item!.offering?.slotDay !== undefined && item!.offering?.slotStartUTC) || 
                            (item!.subject.slotDay !== undefined && item!.subject.slotStartUTC)) && (
                            <Button
                              size="sm"
                              variant={userSchedule.some(e => e.subjectId === item!.subject.id) ? "outline" : "default"}
                              onClick={() => handleAddToSchedule(item!, item!.subject, item!.offering)}
                              title="Tambah ke jadwal"
                              className="hover:scale-110 transition-all duration-200 hover:shadow-md"
                              disabled={userSchedule.some(e => e.subjectId === item!.subject.id)}
                            >
                              <Calendar className="h-4 w-4 mr-1" />
                              {userSchedule.some(e => e.subjectId === item!.subject.id) ? "Terjadwal" : "Jadwalkan"}
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

            {/* Mobile List View - Lebih kompak */}
            <div className="md:hidden space-y-2 px-3">
              {group.items.map((item) => (
                <div 
                  key={item!.id} 
                  className="border rounded-lg p-3 bg-card hover:border-primary/50 transition-colors space-y-2"
                >
                  {/* Header Row */}
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm leading-tight line-clamp-2">
                        {item!.subject.nama}
                      </h4>
                      {item!.subject.prodi && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{item!.subject.prodi}</p>
                      )}
                    </div>
                    <Badge className="text-xs flex-shrink-0">{item!.subject.sks}</Badge>
                  </div>

                  {/* Date Info */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{fmtDateTime(item!.createdAt)}</span>
                  </div>

                  {/* Actions - Horizontal layout */}
                  <div className="flex items-center gap-2 pt-1">
                    {((item!.offering?.slotDay !== undefined && item!.offering?.slotStartUTC) || 
                      (item!.subject.slotDay !== undefined && item!.subject.slotStartUTC)) && (
                      <Button
                        size="sm"
                        variant={userSchedule.some(e => e.subjectId === item!.subject.id) ? "outline" : "default"}
                        onClick={() => handleAddToSchedule(item!, item!.subject, item!.offering)}
                        className="flex-1 h-8 text-xs"
                        disabled={userSchedule.some(e => e.subjectId === item!.subject.id)}
                      >
                        <Calendar className="h-3 w-3 mr-1" />
                        {userSchedule.some(e => e.subjectId === item!.subject.id) ? "OK" : "Jadwal"}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveSubject(item!, item!.subject.nama, item!.offering?.kelas)}
                      className="text-destructive hover:text-destructive h-8 px-3"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
