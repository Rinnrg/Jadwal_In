"use client"

import { useEffect } from "react"
import { useScheduleStore } from "@/stores/schedule.store"
import { useSubjectsStore } from "@/stores/subjects.store"
import { useUsersStore } from "@/stores/users.store"
import { useCountdown } from "@/hooks/useCountdown"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, MapPin, ExternalLink, User } from "lucide-react"
import { fmt24 } from "@/lib/time"

interface NextUpCardProps {
  userId: string
}

const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]

export function NextUpCard({ userId }: NextUpCardProps) {
  const { getNextUpcoming } = useScheduleStore()
  const { subjects, fetchSubjects } = useSubjectsStore()
  const { users, fetchUsers, getUserById } = useUsersStore()

  // Ensure subjects and users data are loaded
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          subjects.length === 0 ? fetchSubjects() : Promise.resolve(),
          users.length === 0 ? fetchUsers() : Promise.resolve()
        ])
      } catch (error) {
        console.error('Failed to load next up data:', error)
      }
    }
    loadData()
  }, []) // Empty dependency array - only run once on mount

  const nextEvent = getNextUpcoming(userId)

  // Calculate next occurrence time
  const getNextOccurrence = (dayOfWeek: number, timeUTC: number) => {
    const now = new Date()
    const currentDay = now.getDay()
    const currentTime = now.getTime() % (24 * 60 * 60 * 1000)

    let daysUntil = dayOfWeek - currentDay
    if (daysUntil < 0 || (daysUntil === 0 && timeUTC <= currentTime)) {
      daysUntil += 7
    }

    const nextDate = new Date(now)
    nextDate.setDate(nextDate.getDate() + daysUntil)
    nextDate.setHours(0, 0, 0, 0)

    return nextDate.getTime() + timeUTC
  }

  const nextOccurrenceTime = nextEvent ? getNextOccurrence(nextEvent.dayOfWeek, nextEvent.startUTC) : 0
  const { days, hours, minutes, seconds } = useCountdown(nextOccurrenceTime)

  if (!nextEvent) {
    return (
      <Card className="w-full">
        <CardHeader className="px-4 md:px-6 py-4 md:py-6">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Clock className="h-4 w-4 md:h-5 md:w-5" />
            Jadwal Berikutnya
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">Tidak ada jadwal mendatang</CardDescription>
        </CardHeader>
        <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
          <p className="text-muted-foreground text-center py-4 text-xs md:text-sm">Anda tidak memiliki jadwal dalam 7 hari ke depan.</p>
        </CardContent>
      </Card>
    )
  }

  const subject = nextEvent.subjectId ? subjects.find((s) => s.id === nextEvent.subjectId) : null
  
  // Get lecturer names from subject's pengampuIds
  let lecturerNames = ""
  if (subject && subject.pengampuIds && subject.pengampuIds.length > 0) {
    const lecturers = subject.pengampuIds
      .map(id => getUserById(id))
      .filter((user): user is NonNullable<typeof user> => Boolean(user))
      .map(user => user.name || "")
      .filter(name => name.length > 0)
    
    if (lecturers.length > 0) {
      lecturerNames = lecturers.join(", ")
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="px-4 md:px-6 py-4 md:py-6">
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <Clock className="h-4 w-4 md:h-5 md:w-5" />
          Jadwal Berikutnya
        </CardTitle>
        <CardDescription className="text-xs md:text-sm">
          {dayNames[nextEvent.dayOfWeek]}, {fmt24(nextEvent.startUTC)} - {fmt24(nextEvent.endUTC)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-4 md:px-6 pb-4 md:pb-6">
        <div className="flex items-start gap-3">
          {subject && (
            <div className="w-3 h-3 md:w-4 md:h-4 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: subject.color }} />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate text-sm md:text-base">{subject ? `${subject.kode} - ${subject.nama}` : "Jadwal Pribadi"}</h3>
            {lecturerNames && (
              <div className="flex items-center gap-1 text-xs md:text-sm text-muted-foreground mt-1">
                <User className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{lecturerNames}</span>
              </div>
            )}
            {nextEvent.location && (
              <div className="flex items-center gap-1 text-xs md:text-sm text-muted-foreground mt-1">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{nextEvent.location}</span>
              </div>
            )}
            {nextEvent.joinUrl && (
              <a
                href={nextEvent.joinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs md:text-sm text-primary hover:underline mt-1"
              >
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
                Join Meeting
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1.5 md:gap-2 text-center">
          <div className="bg-muted rounded-lg p-1.5 md:p-2">
            <div className="text-base md:text-lg font-bold">{days}</div>
            <div className="text-[10px] md:text-xs text-muted-foreground">Hari</div>
          </div>
          <div className="bg-muted rounded-lg p-1.5 md:p-2">
            <div className="text-base md:text-lg font-bold">{hours}</div>
            <div className="text-[10px] md:text-xs text-muted-foreground">Jam</div>
          </div>
          <div className="bg-muted rounded-lg p-1.5 md:p-2">
            <div className="text-base md:text-lg font-bold">{minutes}</div>
            <div className="text-[10px] md:text-xs text-muted-foreground">Menit</div>
          </div>
          <div className="bg-muted rounded-lg p-1.5 md:p-2">
            <div className="text-base md:text-lg font-bold">{seconds}</div>
            <div className="text-[10px] md:text-xs text-muted-foreground">Detik</div>
          </div>
        </div>

        {nextEvent.notes && (
          <div className="p-2.5 md:p-3 bg-muted rounded-lg">
            <p className="text-xs md:text-sm break-words">{nextEvent.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
