"use client"

import { useState } from "react"
import { Users, CheckCircle, XCircle, Clock, Search, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useSessionStore } from "@/stores/session.store"
import { canAccessAttendance } from "@/lib/rbac"
import { redirect } from "next/navigation"

interface AttendanceRecord {
  id: string
  studentName: string
  studentId: string
  subject: string
  date: string
  status: "present" | "absent" | "late" | "excused"
  time?: string
}

const mockAttendance: AttendanceRecord[] = [
  {
    id: "1",
    studentName: "Ahmad Rizki",
    studentId: "2021001",
    subject: "Pemrograman Web",
    date: "2024-01-15",
    status: "present",
    time: "08:05",
  },
  {
    id: "2",
    studentName: "Siti Aminah",
    studentId: "2021002",
    subject: "Pemrograman Web",
    date: "2024-01-15",
    status: "late",
    time: "08:15",
  },
  {
    id: "3",
    studentName: "Budi Santoso",
    studentId: "2021003",
    subject: "Pemrograman Web",
    date: "2024-01-15",
    status: "absent",
  },
  {
    id: "4",
    studentName: "Dewi Sartika",
    studentId: "2021004",
    subject: "Basis Data",
    date: "2024-01-16",
    status: "present",
    time: "10:02",
  },
]

export default function KehadiranPage() {
  const { session } = useSessionStore()
  
  // Guard: Only dosen and kaprodi can access attendance page
  if (!session || !canAccessAttendance(session.role)) {
    redirect("/dashboard")
    return null
  }
  
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedSubject, setSelectedSubject] = useState("all")

  const statuses = [
    { value: "all", label: "Semua Status" },
    { value: "present", label: "Hadir" },
    { value: "late", label: "Terlambat" },
    { value: "absent", label: "Tidak Hadir" },
    { value: "excused", label: "Izin" },
  ]

  const subjects = ["all", "Pemrograman Web", "Basis Data", "Algoritma dan Struktur Data"]

  const filteredAttendance = mockAttendance.filter((record) => {
    const matchesSearch =
      record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || record.studentId.includes(searchTerm)
    const matchesStatus = selectedStatus === "all" || record.status === selectedStatus
    const matchesSubject = selectedSubject === "all" || record.subject === selectedSubject
    return matchesSearch && matchesStatus && matchesSubject
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-800 border-green-200"
      case "late":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "absent":
        return "bg-red-100 text-red-800 border-red-200"
      case "excused":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle className="h-4 w-4" />
      case "late":
        return <Clock className="h-4 w-4" />
      case "absent":
        return <XCircle className="h-4 w-4" />
      case "excused":
        return <CheckCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "present":
        return "Hadir"
      case "late":
        return "Terlambat"
      case "absent":
        return "Tidak Hadir"
      case "excused":
        return "Izin"
      default:
        return status
    }
  }

  // Calculate attendance statistics
  const totalRecords = mockAttendance.length
  const presentCount = mockAttendance.filter((r) => r.status === "present").length
  const lateCount = mockAttendance.filter((r) => r.status === "late").length
  const absentCount = mockAttendance.filter((r) => r.status === "absent").length
  const attendanceRate = totalRecords > 0 ? ((presentCount + lateCount) / totalRecords) * 100 : 0

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Data Kehadiran</h1>
          <p className="text-muted-foreground">Pantau dan kelola kehadiran mahasiswa</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Rekap Kehadiran
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Kehadiran</p>
                <p className="text-2xl font-bold">{totalRecords}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hadir</p>
                <p className="text-2xl font-bold text-green-600">{presentCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Terlambat</p>
                <p className="text-2xl font-bold text-yellow-600">{lateCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tidak Hadir</p>
                <p className="text-2xl font-bold text-red-600">{absentCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Rate */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Tingkat Kehadiran</h3>
              <span className="text-2xl font-bold">{attendanceRate.toFixed(1)}%</span>
            </div>
            <Progress value={attendanceRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama atau NIM mahasiswa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 border border-input bg-background rounded-md text-sm"
        >
          {statuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>

        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="px-3 py-2 border border-input bg-background rounded-md text-sm"
        >
          <option value="all">Semua Mata Kuliah</option>
          {subjects.slice(1).map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>
      </div>

      {/* Attendance Records */}
      <div className="grid gap-4">
        {filteredAttendance.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Tidak ada data kehadiran</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm || selectedStatus !== "all" || selectedSubject !== "all"
                  ? "Coba ubah filter pencarian Anda"
                  : "Belum ada data kehadiran yang tercatat"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAttendance.map((record) => (
            <Card key={record.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-foreground">{record.studentName}</h3>
                      <Badge className={getStatusColor(record.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(record.status)}
                          {getStatusLabel(record.status)}
                        </div>
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">NIM: </span>
                        {record.studentId}
                      </div>
                      <div>
                        <span className="font-medium">Mata Kuliah: </span>
                        {record.subject}
                      </div>
                      <div>
                        <span className="font-medium">Tanggal: </span>
                        {new Date(record.date).toLocaleDateString("id-ID")}
                      </div>
                    </div>

                    {record.time && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">Waktu Kehadiran: </span>
                        {record.time}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      Detail
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
