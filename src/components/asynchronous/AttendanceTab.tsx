"use client"

import { useState, useMemo, useEffect } from "react"
import { useCourseworkStore } from "@/stores/coursework.store"
import { useUsersStore } from "@/stores/users.store"
import { useKrsStore } from "@/stores/krs.store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar, Users, Trash2 } from "lucide-react"
import { confirmAction, showSuccess, showError } from "@/lib/alerts"
import { fmtDate } from "@/lib/time"
import { arr } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AttendanceTabProps {
  subjectId: string
  canManage: boolean
  userRole: string
}

export function AttendanceTab({ subjectId, canManage, userRole }: AttendanceTabProps) {
  const {
    getAttendanceBySubject,
    addAttendanceSession,
    setAttendanceRecord,
    removeAttendanceSession,
    initializeAttendanceSessions, // Added new method
  } = useCourseworkStore()
  const { getMahasiswaUsers } = useUsersStore()
  const { getKrsBySubject } = useKrsStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedMeeting, setSelectedMeeting] = useState("") // Added meeting number selection

  const attendanceSessions = arr(getAttendanceBySubject(subjectId)).sort((a, b) => a.meetingNumber - b.meetingNumber) // Sort by meeting number

  const enrolledStudents = useMemo(() => {
    const krsItems = getKrsBySubject(subjectId)
    const mahasiswaUsers = getMahasiswaUsers()

    return arr(krsItems)
      .map((krs) => {
        const student = mahasiswaUsers.find((user) => user.id === krs.userId)
        return student
          ? {
              id: student.id,
              name: student.name,
              nim: `202${Math.floor(Math.random() * 10000)
                .toString()
                .padStart(4, "0")}`, // Mock NIM
            }
          : null
      })
      .filter(Boolean)
  }, [subjectId, getKrsBySubject, getMahasiswaUsers])

  useEffect(() => {
    if (canManage && enrolledStudents.length > 0) {
      const validStudents = enrolledStudents.filter((s): s is { id: string; name: string; nim: string } => s !== null)
      initializeAttendanceSessions(subjectId, validStudents)
    }
  }, [subjectId, enrolledStudents, canManage, initializeAttendanceSessions])

  const handleCreateSession = () => {
    if (!selectedDate || !selectedMeeting) {
      showError("Tanggal dan pertemuan wajib dipilih")
      return
    }

    const meetingNumber = Number.parseInt(selectedMeeting)
    const dateUTC = new Date(selectedDate).getTime()

    // Check if session already exists for this meeting number
    const existingSession = attendanceSessions.find((session) => session.meetingNumber === meetingNumber)

    if (existingSession) {
      showError(`Pertemuan ${meetingNumber} sudah ada`)
      return
    }

    try {
      addAttendanceSession({
        subjectId,
        dateUTC,
        meetingNumber,
        records: enrolledStudents.map((student) => ({
          studentUserId: student!.id,
          status: "alfa" as const, // Default to alfa
        })),
      })
      showSuccess(`Pertemuan ${meetingNumber} berhasil dibuat`)
      setIsDialogOpen(false)
      setSelectedDate("")
      setSelectedMeeting("")
    } catch (error) {
      showError("Terjadi kesalahan saat membuat sesi kehadiran")
    }
  }

  const handleAttendanceChange = (sessionId: string, studentId: string, status: "hadir" | "alfa" | "izin") => {
    // Updated parameter type
    setAttendanceRecord(sessionId, studentId, status)
  }

  const handleDeleteSession = async (session: any) => {
    const confirmed = await confirmAction(
      "Hapus Pertemuan",
      `Apakah Anda yakin ingin menghapus Pertemuan ${session.meetingNumber}?`,
      "Ya, Hapus",
    )

    if (confirmed) {
      removeAttendanceSession(session.id)
      showSuccess("Pertemuan berhasil dihapus")
    }
  }

  const getAttendanceStats = (session: any) => {
    const totalStudents = session.records.length
    const hadirCount = session.records.filter((record: any) => record.status === "hadir").length // Updated to use status
    const alfaCount = session.records.filter((record: any) => record.status === "alfa").length
    const izinCount = session.records.filter((record: any) => record.status === "izin").length

    return { totalStudents, hadirCount, alfaCount, izinCount }
  }

  const availableMeetings = Array.from({ length: 16 }, (_, i) => i + 1).filter(
    (num) => !attendanceSessions.some((session) => session.meetingNumber === num),
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Kehadiran (16 Pertemuan)</h3> {/* Updated title */}
          <p className="text-sm text-muted-foreground">
            {canManage ? "Kelola kehadiran mahasiswa untuk 16 pertemuan" : "Rekap kehadiran Anda"}
          </p>
        </div>
        {canManage &&
          availableMeetings.length > 0 && ( // Only show if there are available meetings
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Buat Pertemuan
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Buat Pertemuan Baru</DialogTitle>
                  <DialogDescription>Pilih pertemuan dan tanggal untuk membuat sesi kehadiran</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="meeting">Pertemuan</Label> {/* Added meeting selection */}
                    <Select value={selectedMeeting} onValueChange={setSelectedMeeting}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih pertemuan" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableMeetings.map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            Pertemuan {num}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Tanggal</Label>
                    <Input
                      id="date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Batal
                    </Button>
                    <Button onClick={handleCreateSession}>Buat Pertemuan</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
      </div>

      {attendanceSessions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Belum Ada Pertemuan</h3>
            <p className="text-muted-foreground">
              {canManage
                ? "Sistem akan otomatis membuat 16 pertemuan ketika ada mahasiswa terdaftar"
                : "Belum ada pertemuan yang dibuat"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {attendanceSessions.map((session) => {
            const stats = getAttendanceStats(session)

            return (
              <Card key={session.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Pertemuan {session.meetingNumber} - {fmtDate(session.dateUTC)}
                        {session.sessionType === "UTS" && (
                          <Badge variant="default" className="bg-blue-600">UTS</Badge>
                        )}
                        {session.sessionType === "UAS" && (
                          <Badge variant="default" className="bg-purple-600">UAS</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {stats.hadirCount} hadir, {stats.alfaCount} alfa, {stats.izinCount} izin dari{" "}
                        {stats.totalStudents} mahasiswa
                        {session.sessionType === "UTS" && " • Ujian Tengah Semester"}
                        {session.sessionType === "UAS" && " • Ujian Akhir Semester"}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {Math.round((stats.hadirCount / stats.totalStudents) * 100)}% hadir
                      </Badge>
                      {canManage && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSession(session)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {enrolledStudents.length === 0 ? (
                    <div className="text-center py-4">
                      <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">Tidak ada mahasiswa yang terdaftar</p>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>NIM</TableHead>
                            <TableHead>Nama Mahasiswa</TableHead>
                            <TableHead>Status Kehadiran</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {enrolledStudents.map((student) => {
                            const record = session.records.find((r: any) => r.studentUserId === student!.id)
                            const status = record?.status || "alfa" // Use status instead of present

                            return (
                              <TableRow key={student!.id}>
                                <TableCell className="font-mono">{student!.nim}</TableCell>
                                <TableCell className="font-medium">{student!.name}</TableCell>
                                <TableCell>
                                  {canManage ? (
                                    <Select // Use Select instead of Checkbox for three options
                                      value={status}
                                      onValueChange={(value: "hadir" | "alfa" | "izin") =>
                                        handleAttendanceChange(session.id, student!.id, value)
                                      }
                                    >
                                      <SelectTrigger className="w-32">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="hadir">Hadir</SelectItem>
                                        <SelectItem value="alfa">Alfa</SelectItem>
                                        <SelectItem value="izin">Izin</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <Badge
                                      variant={
                                        status === "hadir" ? "default" : status === "izin" ? "secondary" : "destructive"
                                      }
                                    >
                                      {status === "hadir" ? "Hadir" : status === "izin" ? "Izin" : "Alfa"}
                                    </Badge>
                                  )}
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
          })}
        </div>
      )}
    </div>
  )
}
