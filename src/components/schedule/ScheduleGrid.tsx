"use client"

import { useState } from "react"
import { useScheduleStore } from "@/stores/schedule.store"
import { useSubjectsStore } from "@/stores/subjects.store"
import { useUIStore } from "@/stores/ui.store"
import type { ScheduleEvent } from "@/data/schema"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, Copy, MapPin, ExternalLink } from "lucide-react"
import { confirmAction, showSuccess } from "@/lib/alerts"
import { fmt24, nowUTC } from "@/lib/time"
import { cn } from "@/lib/utils"

interface ScheduleGridProps {
  userId: string
  onEditEvent?: (event: ScheduleEvent) => void
  onAddEvent?: (day: number, hour: number) => void
}

const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
const hours = Array.from({ length: 15 }, (_, i) => i + 7) // 7 AM to 9 PM

export function ScheduleGrid({ userId, onEditEvent, onAddEvent }: ScheduleGridProps) {
  const { getEventsByDay, deleteEvent, duplicateEvent } = useScheduleStore()
  const { subjects } = useSubjectsStore()
  const { showNowLine } = useUIStore()
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const currentTime = nowUTC()
  const currentDay = new Date().getDay()
  const currentHour = new Date().getHours()
  const currentMinute = new Date().getMinutes()

  const handleDeleteEvent = async (event: ScheduleEvent) => {
    const subject = event.subjectId ? subjects.find((s) => s.id === event.subjectId) : null
    const eventName = subject ? `${subject.kode} - ${subject.nama}` : "Jadwal Pribadi"

    const confirmed = await confirmAction(
      "Hapus Jadwal",
      `Apakah Anda yakin ingin menghapus "${eventName}"?`,
      "Ya, Hapus",
    )

    if (confirmed) {
      deleteEvent(event.id)
      showSuccess("Jadwal berhasil dihapus")
    }
  }

  const handleDuplicateEvent = (event: ScheduleEvent, targetDay: number) => {
    duplicateEvent(event.id, targetDay)
    showSuccess(`Jadwal berhasil diduplikasi ke ${dayNames[targetDay]}`)
  }

  const getEventPosition = (event: ScheduleEvent) => {
    const startHour = Math.floor(event.startUTC / (1000 * 60 * 60)) % 24
    const startMinute = Math.floor((event.startUTC % (1000 * 60 * 60)) / (1000 * 60))
    const endHour = Math.floor(event.endUTC / (1000 * 60 * 60)) % 24
    const endMinute = Math.floor((event.endUTC % (1000 * 60 * 60)) / (1000 * 60))

    const top = ((startHour - 7) * 60 + startMinute) * (60 / 60) // 60px per hour
    const height = ((endHour - startHour) * 60 + (endMinute - startMinute)) * (60 / 60)

    return { top, height }
  }

  const renderEvent = (event: ScheduleEvent) => {
    const subject = event.subjectId ? subjects.find((s) => s.id === event.subjectId) : null
    const { top, height } = getEventPosition(event)
    const color = subject?.color || event.color || "#3b82f6"

    return (
      <div
        key={event.id}
        className="absolute left-1 right-1 rounded-md border shadow-sm overflow-hidden group hover:shadow-md transition-shadow"
        style={{
          top: `${top}px`,
          height: `${Math.max(height, 30)}px`,
          backgroundColor: color + "20",
          borderColor: color,
        } as React.CSSProperties}
      >
        <div className="p-2 h-full flex flex-col justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-1">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate" style={{ color } as React.CSSProperties}>
                  {subject ? subject.kode : "Pribadi"}
                </p>
                {height > 40 && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {subject ? subject.nama : "Jadwal Pribadi"}
                  </p>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEditEvent?.(event)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      const targetDay = (event.dayOfWeek + 1) % 7
                      handleDuplicateEvent(event, targetDay)
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Duplikasi
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDeleteEvent(event)} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Hapus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="font-medium" style={{ color } as React.CSSProperties}>
              {fmt24(event.startUTC)} - {fmt24(event.endUTC)}
            </span>
            <div className="flex items-center gap-1">
              {event.location && <MapPin className="h-3 w-3 text-muted-foreground" />}
              {event.joinUrl && <ExternalLink className="h-3 w-3 text-muted-foreground" />}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderNowLine = (dayIndex: number) => {
    if (!showNowLine || dayIndex !== currentDay) return null

    const nowPosition = (currentHour - 7) * 60 + currentMinute
    if (nowPosition < 0 || nowPosition > 14 * 60) return null

    return (
      <div className="absolute left-0 right-0 border-t-2 border-red-500 z-10" style={{ top: `${nowPosition}px` } as React.CSSProperties}>
        <div className="absolute -left-2 -top-1 w-4 h-2 bg-red-500 rounded-full" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Jadwal Mingguan</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-8 gap-1 mb-4">
          <div className="text-sm font-medium text-center py-2">Jam</div>
          {dayNames.map((day, index) => (
            <div
              key={day}
              className={cn(
                "text-sm font-medium text-center py-2 rounded-md transition-colors",
                index === currentDay && "bg-primary text-primary-foreground",
              )}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-8 gap-1">
          {/* Time column */}
          <div className="space-y-0">
            {hours.map((hour) => (
              <div key={hour} className="h-[60px] flex items-start justify-center text-xs text-muted-foreground pt-1">
                {hour.toString().padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          {dayNames.map((day, dayIndex) => {
            const dayEvents = getEventsByDay(userId, dayIndex)
            return (
              <div key={dayIndex} className="relative">
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="h-[60px] border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => onAddEvent?.(dayIndex, hour)}
                  />
                ))}
                {dayEvents.map(renderEvent)}
                {renderNowLine(dayIndex)}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
