"use client"

import { useState } from "react"
import { useScheduleStore } from "@/stores/schedule.store"
import { useSubjectsStore } from "@/stores/subjects.store"
import { useUIStore } from "@/stores/ui.store"
import { useRemindersStore } from "@/stores/reminders.store"
import type { ScheduleEvent } from "@/data/schema"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, Copy, MapPin, ExternalLink, MoveHorizontal, Clock, Calendar, Bell } from "lucide-react"
import { confirmAction, showSuccess, showError } from "@/lib/alerts"
import { fmt24, nowUTC, toUTC } from "@/lib/time"
import { cn } from "@/lib/utils"
import { ActivityLogger } from "@/lib/activity-logger"

interface ScheduleGridProps {
  userId: string
  onEditEvent?: (event: ScheduleEvent) => void
  onAddEvent?: (day: number, hour: number) => void
}

const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
const hours = Array.from({ length: 15 }, (_, i) => i + 7) // 7 AM to 9 PM

export function ScheduleGrid({ userId, onEditEvent, onAddEvent }: ScheduleGridProps) {
  const { getEventsByDay, deleteEvent, duplicateEvent, rescheduleEvent, getConflicts } = useScheduleStore()
  const { subjects } = useSubjectsStore()
  const { showNowLine } = useUIStore()
  const { addReminder } = useRemindersStore()
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay())

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
      
      // Log activity
      ActivityLogger.scheduleDeleted(userId, eventName)
    }
  }

  const handleDuplicateEvent = (event: ScheduleEvent, targetDay: number) => {
    duplicateEvent(event.id, targetDay)
    showSuccess(`Jadwal berhasil diduplikasi ke ${dayNames[targetDay]}`)
  }

  const handleMoveEvent = (event: ScheduleEvent, targetDay: number) => {
    // Check for conflicts at the new day/time
    const conflicts = getConflicts(userId, targetDay, event.startUTC, event.endUTC, event.id)
    
    if (conflicts.length > 0) {
      showError(`Terdapat konflik jadwal di ${dayNames[targetDay]}`)
      return
    }

    rescheduleEvent(event.id, targetDay, event.startUTC, event.endUTC)
    showSuccess(`Jadwal berhasil dipindahkan ke ${dayNames[targetDay]}`)
    
    // Log activity
    const subject = event.subjectId ? subjects.find((s) => s.id === event.subjectId) : null
    const eventName = subject ? `${subject.kode} - ${subject.nama}` : "Jadwal Pribadi"
    ActivityLogger.scheduleUpdated(userId, eventName)
  }

  const handleAddToReminder = (event: ScheduleEvent) => {
    const subject = event.subjectId ? subjects.find((s) => s.id === event.subjectId) : null
    const eventName = subject ? `${subject.kode} - ${subject.nama}` : "Jadwal Pribadi"
    
    // Calculate next occurrence of this day
    const now = new Date()
    const currentDay = now.getDay()
    const targetDay = event.dayOfWeek
    
    let daysUntil = targetDay - currentDay
    if (daysUntil <= 0) daysUntil += 7
    
    const nextDate = new Date(now)
    nextDate.setDate(now.getDate() + daysUntil)
    
    // Set time from event's startUTC (which is milliseconds in day)
    const startHour = Math.floor(event.startUTC / (1000 * 60 * 60)) % 24
    const startMinute = Math.floor((event.startUTC % (1000 * 60 * 60)) / (1000 * 60))
    nextDate.setHours(startHour, startMinute, 0, 0)
    
    // Convert to UTC timestamp
    const dueUTC = toUTC(nextDate)
    
    // Add reminder
    addReminder({
      userId,
      title: eventName,
      dueUTC,
      relatedSubjectId: event.subjectId,
      isActive: true,
      sendEmail: false,
    })
    
    showSuccess(`Pengingat untuk "${eventName}" berhasil ditambahkan`)
    
    // Log activity
    ActivityLogger.reminderCreated(userId, eventName)
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
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation()
                    onEditEvent?.(event)
                  }}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation()
                    handleAddToReminder(event)
                  }}>
                    <Bell className="mr-2 h-4 w-4" />
                    Tambah ke Pengingat
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <MoveHorizontal className="mr-2 h-4 w-4" />
                      Pindahkan ke
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent onClick={(e) => e.stopPropagation()}>
                      {dayNames.map((day, index) => (
                        <DropdownMenuItem
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMoveEvent(event, index)
                          }}
                          disabled={index === event.dayOfWeek}
                        >
                          {day}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      const targetDay = (event.dayOfWeek + 1) % 7
                      handleDuplicateEvent(event, targetDay)
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Duplikasi
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteEvent(event)
                  }} className="text-destructive">
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
    <div className="w-full">
      {/* Mobile: Single day view with tabs */}
      <div className="md:hidden w-full">
        {/* Day selector - Wrap buttons */}
        <div className="sticky top-0 z-10 bg-background border-b border-border">
          <div className="flex gap-1.5 flex-wrap px-3 py-2">
            {dayNames.map((day, index) => (
              <Button
                key={day}
                variant={selectedDay === index ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDay(index)}
                className={cn(
                  "capitalize text-xs h-8 px-2",
                  index === currentDay && selectedDay !== index && "ring-1 ring-primary/30"
                )}
              >
                {day}
              </Button>
            ))}
          </div>
        </div>

        {/* Single day schedule */}
        <div className="w-full">
          {/* Day header */}
          <div className="px-3 py-3 border-b border-border">
            <h3 className="text-base font-bold">{dayNames[selectedDay]}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date().toLocaleDateString('id-ID', { 
                day: 'numeric', 
                month: 'long'
              })}
            </p>
          </div>

          {/* Schedule list */}
          <div className="divide-y divide-border">
            {hours.map((hour) => {
              const hourEvents = getEventsByDay(userId, selectedDay).filter((event) => {
                const eventStartHour = Math.floor(event.startUTC / (1000 * 60 * 60)) % 24
                return eventStartHour === hour
              })

              return (
                <div
                  key={hour}
                  className={cn(
                    "flex min-h-[60px]",
                    hourEvents.length > 0 ? "bg-primary/5" : "hover:bg-muted/30 active:bg-muted/50"
                  )}
                  onClick={() => hourEvents.length === 0 && onAddEvent?.(selectedDay, hour)}
                >
                  {/* Time label */}
                  <div className="flex-shrink-0 w-14 flex items-start justify-end pr-3 pt-3 border-r border-border">
                    <span className="text-xs font-medium text-muted-foreground">
                      {hour.toString().padStart(2, "0")}:00
                    </span>
                  </div>

                  {/* Event or empty slot */}
                  <div className="flex-1 min-w-0 px-3 py-2">
                    {hourEvents.length > 0 ? (
                      <div className="space-y-2">
                        {hourEvents.map((event) => {
                          const subject = event.subjectId ? subjects.find((s) => s.id === event.subjectId) : null
                          const color = subject?.color || event.color || "#3b82f6"

                          return (
                            <div
                              key={event.id}
                              className="rounded-lg p-2.5 border cursor-pointer active:scale-[0.98] transition-transform"
                              style={{
                                backgroundColor: color + "15",
                                borderColor: color + "40",
                              } as React.CSSProperties}
                            >
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <div 
                                  className="flex-1 min-w-0"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onEditEvent?.(event)
                                  }}
                                >
                                  <h4 className="font-semibold text-sm leading-tight truncate" style={{ color } as React.CSSProperties}>
                                    {subject ? subject.nama : "Jadwal Pribadi"}
                                  </h4>
                                  {subject && (
                                    <p className="text-xs text-muted-foreground mt-0.5">{subject.kode}</p>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleAddToReminder(event)
                                  }}
                                >
                                  <Bell className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 flex-shrink-0" />
                                  <span className="text-[11px]">{fmt24(event.startUTC)} - {fmt24(event.endUTC)}</span>
                                </div>
                                {event.location && (
                                  <div className="flex items-center gap-1 min-w-0">
                                    <MapPin className="h-3 w-3 flex-shrink-0" />
                                    <span className="text-[11px] truncate">{event.location}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center h-full min-h-[44px] text-xs text-muted-foreground/40">
                        Kosong
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Empty state */}
          {getEventsByDay(userId, selectedDay).length === 0 && (
            <div className="px-3 py-8 text-center">
              <Calendar className="h-10 w-10 mx-auto text-muted-foreground/20 mb-2" />
              <p className="text-sm text-muted-foreground">Tidak ada jadwal</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Tap slot waktu untuk menambah</p>
            </div>
          )}
        </div>
      </div>

      {/* Desktop: Full week grid */}
      <div className="hidden md:block">
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
      </div>

      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
