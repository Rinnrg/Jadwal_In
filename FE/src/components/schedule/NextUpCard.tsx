"use client"

import { useScheduleStore } from "@/stores/schedule.store"
import { useSubjectsStore } from "@/stores/subjects.store"
import { useCountdown } from "@/hooks/useCountdown"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, MapPin, ExternalLink } from "lucide-react"
import { fmt24 } from "@/lib/time"

interface NextUpCardProps {
  userId: string
}

const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]

export function NextUpCard({ userId }: NextUpCardProps) {
  const { getNextUpcoming } = useScheduleStore()
  const { subjects } = useSubjectsStore()

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Jadwal Berikutnya
          </CardTitle>
          <CardDescription>Tidak ada jadwal mendatang</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">Anda tidak memiliki jadwal dalam 7 hari ke depan.</p>
        </CardContent>
      </Card>
    )
  }

  const subject = nextEvent.subjectId ? subjects.find((s) => s.id === nextEvent.subjectId) : null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Jadwal Berikutnya
        </CardTitle>
        <CardDescription>
          {dayNames[nextEvent.dayOfWeek]}, {fmt24(nextEvent.startUTC)} - {fmt24(nextEvent.endUTC)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          {subject && (
            <div className="w-4 h-4 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: subject.color }} />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{subject ? `${subject.kode} - ${subject.nama}` : "Jadwal Pribadi"}</h3>
            {nextEvent.location && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <MapPin className="h-3 w-3" />
                {nextEvent.location}
              </div>
            )}
            {nextEvent.joinUrl && (
              <a
                href={nextEvent.joinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-1"
              >
                <ExternalLink className="h-3 w-3" />
                Join Meeting
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-muted rounded-lg p-2">
            <div className="text-lg font-bold">{days}</div>
            <div className="text-xs text-muted-foreground">Hari</div>
          </div>
          <div className="bg-muted rounded-lg p-2">
            <div className="text-lg font-bold">{hours}</div>
            <div className="text-xs text-muted-foreground">Jam</div>
          </div>
          <div className="bg-muted rounded-lg p-2">
            <div className="text-lg font-bold">{minutes}</div>
            <div className="text-xs text-muted-foreground">Menit</div>
          </div>
          <div className="bg-muted rounded-lg p-2">
            <div className="text-lg font-bold">{seconds}</div>
            <div className="text-xs text-muted-foreground">Detik</div>
          </div>
        </div>

        {nextEvent.notes && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm">{nextEvent.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
