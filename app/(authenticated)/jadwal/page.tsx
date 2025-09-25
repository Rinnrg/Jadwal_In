"use client"

import { useState } from "react"
import { Calendar, Clock, MapPin, User, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ScheduleItem {
  id: string
  subject: string
  lecturer: string
  time: string
  room: string
  day: string
  type: "lecture" | "lab" | "exam"
}

const mockSchedule: ScheduleItem[] = [
  {
    id: "1",
    subject: "Pemrograman Web",
    lecturer: "Dr. Ahmad Fauzi",
    time: "08:00 - 10:00",
    room: "Lab Komputer 1",
    day: "Senin",
    type: "lab",
  },
  {
    id: "2",
    subject: "Basis Data",
    lecturer: "Prof. Siti Nurhaliza",
    time: "10:00 - 12:00",
    room: "Ruang 201",
    day: "Senin",
    type: "lecture",
  },
  {
    id: "3",
    subject: "Algoritma dan Struktur Data",
    lecturer: "Dr. Budi Santoso",
    time: "13:00 - 15:00",
    room: "Ruang 301",
    day: "Selasa",
    type: "lecture",
  },
]

export default function JadwalPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDay, setSelectedDay] = useState("all")

  const days = ["all", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]

  const filteredSchedule = mockSchedule.filter((item) => {
    const matchesSearch =
      item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.lecturer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDay = selectedDay === "all" || item.day === selectedDay
    return matchesSearch && matchesDay
  })

  const getTypeColor = (type: string) => {
    switch (type) {
      case "lecture":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "lab":
        return "bg-green-100 text-green-800 border-green-200"
      case "exam":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "lecture":
        return "Kuliah"
      case "lab":
        return "Praktikum"
      case "exam":
        return "Ujian"
      default:
        return type
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Jadwal Kuliah</h1>
          <p className="text-muted-foreground">Kelola dan lihat jadwal perkuliahan Anda</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Tambah Jadwal
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari mata kuliah atau dosen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {days.map((day) => (
            <Button
              key={day}
              variant={selectedDay === day ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDay(day)}
              className="capitalize"
            >
              {day === "all" ? "Semua" : day}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {filteredSchedule.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Tidak ada jadwal ditemukan</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm || selectedDay !== "all"
                  ? "Coba ubah filter pencarian Anda"
                  : "Belum ada jadwal yang ditambahkan"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredSchedule.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-semibold text-foreground">{item.subject}</h3>
                      <Badge className={getTypeColor(item.type)}>{getTypeLabel(item.type)}</Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{item.lecturer}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>
                          {item.day}, {item.time}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{item.room}</span>
                      </div>
                    </div>
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
