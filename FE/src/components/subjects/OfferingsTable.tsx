"use client"

import { useState } from "react"
import { useOfferingsStore } from "@/stores/offerings.store"
import { useSubjectsStore } from "@/stores/subjects.store"
import { useUsersStore } from "@/stores/users.store"
import { useKrsStore } from "@/stores/krs.store"
import type { CourseOffering } from "@/data/schema"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MoreHorizontal, Edit, Trash2, Search, Plus, Users, ArrowLeft } from "lucide-react"
import { confirmAction, showSuccess } from "@/lib/alerts"
import { arr } from "@/lib/utils"
import { OfferingForm } from "@/components/subjects/OfferingForm"

export function OfferingsTable() {
  const { offerings, removeOffering } = useOfferingsStore()
  const { getSubjectById } = useSubjectsStore()
  const { getUserById } = useUsersStore()
  const { getKrsByOffering } = useKrsStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "buka" | "tutup">("all")
  const [showForm, setShowForm] = useState(false)
  const [editingOffering, setEditingOffering] = useState<CourseOffering | null>(null)

  const filteredOfferings = offerings.filter((offering) => {
    const subject = getSubjectById(offering.subjectId)
    const matchesSearch =
      subject?.kode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject?.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offering.kelas.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offering.angkatan.toString().includes(searchTerm)

    const matchesStatus = statusFilter === "all" || offering.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleEdit = (offering: CourseOffering) => {
    setEditingOffering(offering)
    setShowForm(true)
  }

  const handleDelete = async (offering: CourseOffering) => {
    const subject = getSubjectById(offering.subjectId)
    const confirmed = await confirmAction(
      "Hapus Penawaran",
      `Apakah Anda yakin ingin menghapus penawaran "${subject?.nama}" untuk kelas ${offering.kelas} angkatan ${offering.angkatan}?`,
      "Ya, Hapus",
    )

    if (confirmed) {
      removeOffering(offering.id)
      showSuccess("Penawaran berhasil dihapus")
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingOffering(null)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingOffering(null)
  }

  const getStatusBadge = (status: CourseOffering["status"]) => {
    return status === "buka" ? (
      <Badge variant="default" className="bg-green-500">
        Buka
      </Badge>
    ) : (
      <Badge variant="secondary">Tutup</Badge>
    )
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

  const getEnrollmentCount = (offeringId: string) => {
    return getKrsByOffering(offeringId).length
  }

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {editingOffering ? "Edit Penawaran" : "Tambah Penawaran"}
            </h2>
            <p className="text-muted-foreground">
              {editingOffering ? "Perbarui informasi penawaran mata kuliah" : "Buat penawaran mata kuliah baru"}
            </p>
          </div>
        </div>

        <OfferingForm offering={editingOffering || undefined} onSuccess={handleFormSuccess} onCancel={handleCancel} />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Penawaran Mata Kuliah</CardTitle>
            <CardDescription>Kelola penawaran mata kuliah per angkatan dan kelas</CardDescription>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Penawaran
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Cari penawaran..."
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
            >
              Semua
            </Button>
            <Button
              variant={statusFilter === "buka" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("buka")}
            >
              Buka
            </Button>
            <Button
              variant={statusFilter === "tutup" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("tutup")}
            >
              Tutup
            </Button>
          </div>
        </div>

        {filteredOfferings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== "all"
                ? "Tidak ada penawaran yang sesuai dengan filter"
                : "Belum ada penawaran mata kuliah. Tambahkan penawaran pertama Anda."}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mata Kuliah</TableHead>
                  <TableHead>Angkatan</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Pengampu</TableHead>
                  <TableHead>Kapasitas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOfferings.map((offering) => {
                  const subject = getSubjectById(offering.subjectId)
                  const enrollmentCount = getEnrollmentCount(offering.id)

                  return (
                    <TableRow key={offering.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{subject?.kode}</p>
                          <p className="text-sm text-muted-foreground">{subject?.nama}</p>
                        </div>
                      </TableCell>
                      <TableCell>{offering.angkatan}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{offering.kelas}</Badge>
                      </TableCell>
                      <TableCell>{offering.semester}</TableCell>
                      <TableCell>{offering.term || "—"}</TableCell>
                      <TableCell>{renderPengampuChips(offering.pengampuIds || [])}</TableCell>
                      <TableCell>
                        {offering.capacity ? (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className={enrollmentCount >= offering.capacity ? "text-red-500 font-medium" : ""}>
                              {enrollmentCount}/{offering.capacity}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(offering.status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(offering)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(offering)} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
