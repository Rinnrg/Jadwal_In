"use client"

import { useState } from "react"
import { useSubjectsStore } from "@/stores/subjects.store"
import { useUsersStore } from "@/stores/users.store"
import { useOfferingsStore } from "@/stores/offerings.store"
import { useNotificationStore } from "@/stores/notification.store"
import { useKrsStore } from "@/stores/krs.store"
import type { Subject } from "@/data/schema"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Edit, Trash2, Search, AlertTriangle, Trash } from "lucide-react"
import { confirmAction, showSuccess, showError } from "@/lib/alerts"
import { arr } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"

// Helper function to get current term
const getCurrentTerm = () => {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()
  const isOddSemester = currentMonth >= 8 || currentMonth <= 1
  return `${currentYear}/${currentYear + 1}-${isOddSemester ? "Ganjil" : "Genap"}`
}

// Helper function to notify students about new subject
const notifyStudentsAboutNewSubject = async (subject: Subject) => {
  try {
    const { triggerNotification } = useNotificationStore.getState()
    
    // Fetch all students with the same angkatan
    const usersResponse = await fetch('/api/users')
    if (!usersResponse.ok) return
    
    const allUsers = await usersResponse.json()
    const studentsInAngkatan = allUsers.filter(
      (user: any) => 
        user.role === 'mahasiswa' && 
        user.angkatan === subject.angkatan
    )
    
    const message = `Mata kuliah baru tersedia: "${subject.nama}" (${subject.kode})`
    
    // Notify each student
    studentsInAngkatan.forEach((student: any) => {
      triggerNotification('krs', student.id, message, 1)
    })
    
    console.log('[SubjectTable] Notified', studentsInAngkatan.length, 'students about new subject:', subject.nama)
  } catch (error) {
    console.error('[SubjectTable] Failed to notify students:', error)
  }
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
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set())

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
      try {
        await deleteSubject(subject.id)
        showSuccess("Mata kuliah berhasil dihapus")
      } catch (error) {
        showError(error instanceof Error ? error.message : "Gagal menghapus mata kuliah")
      }
    }
  }

  const handleToggleSelection = (subjectId: string) => {
    setSelectedSubjects(prev => {
      const newSet = new Set(prev)
      if (newSet.has(subjectId)) {
        newSet.delete(subjectId)
      } else {
        newSet.add(subjectId)
      }
      return newSet
    })
  }

  const handleSelectAll = (subjects: Subject[]) => {
    const allIds = subjects.map(s => s.id)
    const allSelected = allIds.every(id => selectedSubjects.has(id))
    
    if (allSelected) {
      // Deselect all
      setSelectedSubjects(prev => {
        const newSet = new Set(prev)
        allIds.forEach(id => newSet.delete(id))
        return newSet
      })
    } else {
      // Select all
      setSelectedSubjects(prev => {
        const newSet = new Set(prev)
        allIds.forEach(id => newSet.add(id))
        return newSet
      })
    }
  }

  const handleForceDelete = async () => {
    if (selectedSubjects.size === 0) return

    const selectedList = subjects.filter(s => selectedSubjects.has(s.id))
    const subjectNames = selectedList.map(s => s.nama).join(', ')
    
    try {
      // Fetch fresh offering data to get accurate student count
      const offeringPromises = selectedList.map(subject => 
        fetch(`/api/offerings?subjectId=${subject.id}`).then(res => res.json())
      )
      const offeringsData = await Promise.all(offeringPromises)
      
      // Calculate total students affected
      let totalStudents = 0
      offeringsData.forEach(offerings => {
        if (Array.isArray(offerings)) {
          offerings.forEach(offering => {
            totalStudents += offering._count?.krsItems || 0
          })
        }
      })

      const confirmed = await confirmAction(
        "⚠️ Force Delete Mata Kuliah",
        `PERINGATAN: Anda akan menghapus ${selectedSubjects.size} mata kuliah secara permanen:\n\n${subjectNames}\n\n${totalStudents > 0 ? `⚠️ ${totalStudents} mahasiswa yang sudah mengambil mata kuliah ini akan otomatis dihapus dari KRS mereka!\n\n` : ''}Tindakan ini TIDAK DAPAT dibatalkan!`,
        "Ya, Force Delete"
      )

      if (!confirmed) return

      // Call API to force delete
      const response = await fetch('/api/subjects/force-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          subjectIds: Array.from(selectedSubjects) 
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to force delete subjects')
      }

      const result = await response.json()
      
      // Clear selection
      setSelectedSubjects(new Set())
      
      // Refresh data
      const { fetchSubjects } = useSubjectsStore.getState()
      const { fetchOfferings } = useOfferingsStore.getState()
      await fetchSubjects()
      await fetchOfferings(undefined, true)
      
      showSuccess(`✅ ${result.deletedSubjects} mata kuliah berhasil dihapus!\n${result.deletedKrsItems > 0 ? `🗑️ ${result.deletedKrsItems} item KRS mahasiswa dihapus\n` : ''}${result.deletedOfferings > 0 ? `📋 ${result.deletedOfferings} penawaran dihapus` : ''}`)
    } catch (error) {
      console.error('Force delete error:', error)
      showError(error instanceof Error ? error.message : 'Gagal menghapus mata kuliah')
    }
  }
  
  const handleAddAllSubjectsToKRS = async (angkatan: number | string, kelas: string) => {
    try {
      // Get all subjects in this group (regardless of status)
      const groupSubjects = subjects.filter(
        (s) => s.angkatan === angkatan && s.kelas === kelas
      )

      if (groupSubjects.length === 0) {
        showError("Tidak ada mata kuliah untuk grup ini")
        return
      }
      
      // Count currently inactive subjects
      const inactiveSubjects = groupSubjects.filter(s => s.status !== 'aktif')
      
      const confirmed = await confirmAction(
        `Tambahkan Semua Mata Kuliah Kelas ${kelas}`,
        `Aksi ini akan:\n\n1. ✅ Mengaktifkan ${inactiveSubjects.length > 0 ? `${inactiveSubjects.length} mata kuliah yang OFF` : 'semua mata kuliah'}\n2. ✅ Membuat penawaran (offerings) untuk semua mata kuliah\n3. ✅ Menambahkan ke halaman KRS\n\nTotal: ${groupSubjects.length} mata kuliah untuk Angkatan ${angkatan} Kelas ${kelas}`,
        "Ya, Tambahkan Semua"
      )
      
      if (!confirmed) return
      
      const { addOffering } = useOfferingsStore.getState()
      const currentTerm = getCurrentTerm()
      
      let activated = 0
      let offeringsCreated = 0
      let errors = 0
      
      for (const subject of groupSubjects) {
        try {
          // Step 1: Activate subject if inactive
          if (subject.status !== 'aktif') {
            await updateSubject(subject.id, { status: 'aktif' })
            activated++
          }
          
          // Step 2: Create or update offering
          const offerings = getOfferingsBySubject(subject.id)
          if (offerings.length === 0) {
            // Create new offering
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
          } else {
            // Update existing offerings to "buka"
            const { updateOffering } = useOfferingsStore.getState()
            for (const offering of offerings) {
              if (offering.status !== 'buka') {
                await updateOffering(offering.id, { status: 'buka' })
              }
            }
          }
        } catch (error) {
          console.error(`[AddAllToKRS] Error processing "${subject.nama}":`, error)
          errors++
        }
      }
      
      // Force refresh offerings
      const { fetchOfferings } = useOfferingsStore.getState()
      await fetchOfferings(undefined, true)
      
      // Show success message
      const messages = []
      if (activated > 0) messages.push(`${activated} mata kuliah diaktifkan`)
      if (offeringsCreated > 0) messages.push(`${offeringsCreated} penawaran dibuat`)
      
      if (messages.length > 0) {
        showSuccess(
          `✅ ${messages.join(', ')}${errors > 0 ? ` (${errors} error)` : ''}.\n\nMata kuliah sekarang tersedia di halaman KRS!`
        )
      } else {
        showSuccess(`✅ Semua mata kuliah sudah aktif dan tersedia di KRS!`)
      }
    } catch (error) {
      console.error('[AddAllToKRS] Error:', error)
      showError("Gagal menambahkan mata kuliah ke KRS")
    }
  }

  const handleToggleOfferingStatus = async (subject: Subject) => {
    try {
      const offerings = getOfferingsBySubject(subject.id)
      
      if (offerings.length === 0) {
        // No offering exists - create one with "buka" status
        const { addOffering } = useOfferingsStore.getState()
        const currentTerm = getCurrentTerm()
        
        try {
          await addOffering({
            subjectId: subject.id,
            angkatan: subject.angkatan,
            kelas: subject.kelas || "A",
            semester: subject.semester,
            term: currentTerm,
            status: "buka",
            capacity: 40,
          })
          
          showSuccess(
            `✅ Penawaran "${subject.nama}" dibuka!\n\nMahasiswa sekarang bisa mengambil mata kuliah ini di KRS.`
          )
        } catch (error) {
          showError(`Gagal membuat penawaran untuk "${subject.nama}"`)
        }
      } else {
        // Check current status
        const { updateOffering } = useOfferingsStore.getState()
        const currentStatus = offerings[0].status
        const newStatus = currentStatus === "buka" ? "tutup" : "buka"
        
        // If trying to close (buka → tutup), check if students have enrolled
        if (newStatus === "tutup") {
          const krsItems = useKrsStore.getState().krsItems.filter(
            (krs: any) => krs.subjectId === subject.id
          )
          
          if (krsItems.length > 0) {
            showError(
              `Tidak bisa menutup mata kuliah "${subject.nama}"!\n\n${krsItems.length} mahasiswa sudah mengambil mata kuliah ini.\n\nGunakan tombol "Force Tutup" untuk menutup paksa dan menghapus dari KRS mahasiswa.`
            )
            return
          }
        }
        
        try {
          // Update all offerings for this subject
          for (const offering of offerings) {
            await updateOffering(offering.id, { status: newStatus })
          }
          
          showSuccess(
            newStatus === "buka"
              ? `✅ Penawaran "${subject.nama}" dibuka!\n\nMahasiswa sekarang bisa mengambil mata kuliah ini di KRS.`
              : `❌ Penawaran "${subject.nama}" ditutup.\n\nMahasiswa tidak bisa mengambil mata kuliah ini untuk sementara.`
          )
        } catch (error) {
          showError(`Gagal mengubah status penawaran "${subject.nama}"`)
        }
      }
      
      // Force refresh offerings
      const { fetchOfferings } = useOfferingsStore.getState()
      setTimeout(() => fetchOfferings(undefined, true), 100)
    } catch (error) {
      showError("Gagal mengubah status penawaran")
    }
  }

  const handleToggleSubjectStatus = async (subject: Subject) => {
    try {
      const newStatus = subject.status === "aktif" ? "arsip" : "aktif"
      
      // If turning OFF (aktif → arsip), check for enrolled students
      if (newStatus === "arsip") {
        // Check if any students have enrolled in this subject
        const krsCheckResponse = await fetch(`/api/krs?subjectId=${subject.id}`)
        if (krsCheckResponse.ok) {
          const enrolledStudents = await krsCheckResponse.json()
          
          if (enrolledStudents.length > 0) {
            // Students enrolled - show options
            const result = await confirmAction(
              "Mahasiswa Terdeteksi",
              `Terdapat ${enrolledStudents.length} mahasiswa yang mengambil mata kuliah "${subject.nama}".\n\nPilih tindakan:`,
              "Force Off & Hapus KRS",
              "Batal",
              "destructive"
            )
            
            if (!result) {
              // User cancelled
              return
            }
            
            // Force off - delete all KRS entries
            try {
              const deletePromises = enrolledStudents.map((krs: any) =>
                fetch(`/api/krs?id=${krs.id}`, { method: 'DELETE' })
              )
              
              await Promise.all(deletePromises)
              
              showSuccess(
                `✅ "${subject.nama}" di-force off!\n\n${enrolledStudents.length} mahasiswa telah dihapus dari KRS.`
              )
            } catch (error) {
              showError("Gagal menghapus KRS mahasiswa")
              return
            }
          }
        }
      }
      
      await updateSubject(subject.id, { status: newStatus })
      
      const offerings = getOfferingsBySubject(subject.id)
      
      if (newStatus === "aktif") {
        // When activating a subject, ALWAYS ensure it has an offering
        const { addOffering, updateOffering } = useOfferingsStore.getState()
        const currentTerm = getCurrentTerm()
        
        if (offerings.length === 0) {
          // No offering exists - create one
          try {
            await addOffering({
              subjectId: subject.id,
              angkatan: subject.angkatan,
              kelas: subject.kelas || "A",
              semester: subject.semester,
              term: currentTerm,
              status: "buka",
              capacity: 40,
            })
            
            showSuccess(
              `✅ "${subject.nama}" diaktifkan!\n\nPenawaran dibuat untuk Angkatan ${subject.angkatan} Kelas ${subject.kelas || "A"}.\nMata kuliah sekarang tersedia di halaman KRS.`
            )
            
            // Notify all students in the same angkatan about new subject
            notifyStudentsAboutNewSubject(subject)
          } catch (error) {
            showError(`Mata kuliah "${subject.nama}" diaktifkan, tapi gagal membuat penawaran.\n\nSilakan gunakan tombol "Tambahkan Semua MK Kelas ${subject.kelas}" untuk membuat penawaran.`)
          }
        } else {
          // Offering exists - make sure it's "buka"
          try {
            for (const offering of offerings) {
              if (offering.status !== 'buka') {
                await updateOffering(offering.id, { status: 'buka' })
              }
            }
            showSuccess(
              `✅ "${subject.nama}" diaktifkan!\n\nMata kuliah sekarang tersedia di halaman KRS.`
            )
            
            // Notify all students in the same angkatan about subject reactivation
            notifyStudentsAboutNewSubject(subject)
          } catch (error) {
            showSuccess(
              `✅ "${subject.nama}" diaktifkan!\n\nMata kuliah sekarang tersedia di halaman KRS.`
            )
            
            // Still notify even if offering update fails
            notifyStudentsAboutNewSubject(subject)
          }
        }
      } else {
        // Archiving subject
        showSuccess(
          `"${subject.nama}" diarsipkan${
            offerings.length > 0 
              ? ` (${offerings.length} penawaran masih ada tapi tidak tampil di KRS)`
              : ''
          }`
        )
      }
      
      // Force refresh offerings
      const { fetchOfferings } = useOfferingsStore.getState()
      setTimeout(() => fetchOfferings(undefined, true), 100)
    } catch (error) {
      showError("Gagal mengubah status mata kuliah")
    }
  }

  const handleForceCloseSubject = async (subject: any) => {
    const confirmed = await confirmAction(
      `Force Tutup Mata Kuliah`,
      `Yakin ingin Force Tutup mata kuliah "${subject.nama}"?\n\nSemua mahasiswa yang sudah mengambil akan dihapus dari KRS mereka.`,
      "Ya, Force Tutup",
      "Batal",
      "destructive"
    )

    if (!confirmed) return

    try {
      // Delete all KRS entries for this subject
      const krsItems = useKrsStore.getState().krsItems.filter(
        (krs: any) => krs.subjectId === subject.id
      )
      
      const { removeKrsItem } = useKrsStore.getState()
      for (const krs of krsItems) {
        await removeKrsItem(krs.id, krs.userId, subject.nama)
      }

      // Update offerings to "tutup"
      const { offerings, updateOffering } = useOfferingsStore.getState()
      const subjectOfferings = offerings.filter((o) => o.subjectId === subject.id)
      
      for (const offering of subjectOfferings) {
        await updateOffering(offering.id, { status: "tutup" })
      }

      // Send notifications to all affected students
      const { triggerNotification } = useNotificationStore.getState()
      const users = useUsersStore.getState().users
      const affectedUserIds = new Set(krsItems.map((krs: any) => krs.userId))
      
      for (const userId of affectedUserIds) {
        const user = users.find(u => u.id === userId)
        if (!user) continue
        
        triggerNotification(
          "krs",
          String(userId),
          `Mata kuliah "${subject.nama}" telah ditutup paksa. KRS Anda telah diperbarui.`,
          1
        )
      }

      showSuccess(
        `✅ "${subject.nama}" berhasil ditutup paksa!\n\n${krsItems.length} mahasiswa telah dihapus dari KRS.`
      )

      // Force refresh all data
      const { fetchOfferings } = useOfferingsStore.getState()
      const { fetchKrsItems } = useKrsStore.getState()
      setTimeout(() => {
        fetchOfferings(undefined, true)
        fetchKrsItems(undefined, undefined, true)
      }, 100)
    } catch (error) {
      showError("Gagal force tutup mata kuliah")
    }
  }

  const handleBulkForceClose = async () => {
    const selectedSubjectsList = subjects.filter(s => selectedSubjects.has(s.id))
    
    const confirmed = await confirmAction(
      `Force Tutup ${selectedSubjects.size} Mata Kuliah`,
      `Yakin ingin Force Tutup ${selectedSubjects.size} mata kuliah yang dipilih?\n\nSemua mahasiswa yang sudah mengambil mata kuliah ini akan dihapus dari KRS mereka.`,
      "Ya, Force Tutup",
      "Batal",
      "destructive"
    )

    if (!confirmed) return

    try {
      let totalKrsDeleted = 0
      const affectedUserIds = new Set<string>()

      for (const subject of selectedSubjectsList) {
        // Delete all KRS entries for this subject
        const krsItems = useKrsStore.getState().krsItems.filter(
          (krs: any) => krs.subjectId === subject.id
        )
        
        totalKrsDeleted += krsItems.length
        krsItems.forEach((krs: any) => affectedUserIds.add(krs.userId))
        
        const { removeKrsItem } = useKrsStore.getState()
        for (const krs of krsItems) {
          await removeKrsItem(krs.id, krs.userId, subject.nama)
        }

        // Update offerings to "tutup"
        const { offerings, updateOffering } = useOfferingsStore.getState()
        const subjectOfferings = offerings.filter((o) => o.subjectId === subject.id)
        
        for (const offering of subjectOfferings) {
          await updateOffering(offering.id, { status: "tutup" })
        }
      }

      // Send notifications to all affected students
      const { triggerNotification } = useNotificationStore.getState()
      const users = useUsersStore.getState().users
      
      for (const userId of affectedUserIds) {
        const user = users.find(u => u.id === userId)
        if (!user) continue
        
        triggerNotification(
          "krs",
          String(userId),
          `${selectedSubjects.size} mata kuliah telah ditutup paksa. KRS Anda telah diperbarui.`,
          selectedSubjects.size
        )
      }

      showSuccess(
        `✅ ${selectedSubjects.size} mata kuliah berhasil ditutup paksa!\n\n${totalKrsDeleted} KRS mahasiswa telah dihapus.`
      )

      // Clear selection
      setSelectedSubjects(new Set())

      // Force refresh all data
      const { fetchOfferings } = useOfferingsStore.getState()
      const { fetchKrsItems } = useKrsStore.getState()
      setTimeout(() => {
        fetchOfferings(undefined, true)
        fetchKrsItems(undefined, undefined, true)
      }, 100)
    } catch (error) {
      showError("Gagal force tutup mata kuliah")
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

  const getOfferingStatus = (subjectId: string): "buka" | "tutup" => {
    const offerings = getOfferingsBySubject(subjectId)
    
    // If no offerings exist, consider it "tutup"
    if (!offerings || offerings.length === 0) return "tutup"
    
    // Check if any offering is open
    const hasOpenOffering = offerings.some((o) => o.status === "buka")
    return hasOpenOffering ? "buka" : "tutup"
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
          
          {/* Bulk Actions - Muncul saat ada yang dipilih */}
          {selectedSubjects.size > 0 && (
            <div className="flex items-center gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">
                  {selectedSubjects.size} mata kuliah dipilih
                </p>
                <p className="text-xs text-muted-foreground">
                  Force delete untuk menghapus mata kuliah dan semua KRS mahasiswa terkait, atau force tutup untuk menutup paksa dan menghapus dari KRS mahasiswa
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSubjects(new Set())}
                >
                  Batal
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkForceClose}
                  className="gap-2 text-orange-600 hover:bg-orange-50 border-orange-300 dark:hover:bg-orange-900/20"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Force Tutup
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleForceDelete}
                  className="gap-2"
                >
                  <Trash className="h-4 w-4" />
                  Force Delete
                </Button>
              </div>
            </div>
          )}
          
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
                          variant="default"
                          onClick={() => handleAddAllSubjectsToKRS(group.angkatan, group.kelas)}
                          className="text-xs md:text-sm h-8 md:h-9 bg-green-600 hover:bg-green-700 text-white"
                          title="Aktifkan semua mata kuliah dan tambahkan ke KRS"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M5 12h14M12 5v14"/></svg>
                          Tambahkan Semua MK Kelas {group.kelas}
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
                          <TableHead className="w-[50px]">
                            <Checkbox
                              checked={group.subjects.every(s => selectedSubjects.has(s.id))}
                              onCheckedChange={() => handleSelectAll(group.subjects)}
                              aria-label="Select all"
                            />
                          </TableHead>
                          <TableHead>Kode</TableHead>
                          <TableHead>Nama</TableHead>
                          <TableHead>SKS</TableHead>
                          <TableHead>Pengampu</TableHead>
                          <TableHead>Penawaran</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.subjects.map((subject, index) => (
                          <TableRow
                            key={subject.id}
                            className={`hover:bg-muted/50 transition-colors duration-200 ${selectedSubjects.has(subject.id) ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedSubjects.has(subject.id)}
                                onCheckedChange={() => handleToggleSelection(subject.id)}
                                aria-label={`Select ${subject.nama}`}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{subject.kode}</TableCell>
                            <TableCell>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{subject.nama}</p>
                                  <Badge variant={subject.status === "aktif" ? "default" : "secondary"} className="text-xs">
                                    {subject.status === "aktif" ? "Aktif" : "Arsip"}
                                  </Badge>
                                </div>
                                {subject.prodi && <p className="text-sm text-muted-foreground">{subject.prodi}</p>}
                              </div>
                            </TableCell>
                            <TableCell>{subject.sks}</TableCell>
                            <TableCell>{renderPengampuChips(subject.pengampuIds)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={getOfferingStatus(subject.id) === "buka"}
                                  onCheckedChange={() => handleToggleOfferingStatus(subject)}
                                />
                                <span className="text-sm">
                                  {getOfferingStatus(subject.id) === "buka" ? "Buka" : "Tutup"}
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
                      <Card 
                        key={subject.id} 
                        className={`border-2 hover:border-primary/50 transition-colors ${selectedSubjects.has(subject.id) ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : ''}`}
                      >
                        <CardContent className="p-3 space-y-2">
                          {/* Header with Checkbox */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              <Checkbox
                                checked={selectedSubjects.has(subject.id)}
                                onCheckedChange={() => handleToggleSelection(subject.id)}
                                aria-label={`Select ${subject.nama}`}
                                className="mt-1"
                              />
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
                                checked={getOfferingStatus(subject.id) === "buka"}
                                onCheckedChange={() => handleToggleOfferingStatus(subject)}
                                className="scale-90"
                              />
                              <span className="text-[10px] text-muted-foreground">
                                {getOfferingStatus(subject.id) === "buka" ? "Buka" : "Tutup"}
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
