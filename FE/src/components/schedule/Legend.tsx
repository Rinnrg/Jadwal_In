"use client"

import { useSubjectsStore } from "@/stores/subjects.store"
import { useScheduleStore } from "@/stores/schedule.store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface LegendProps {
  userId: string
}

export function Legend({ userId }: LegendProps) {
  const { subjects } = useSubjectsStore()
  const { getEventsByUser } = useScheduleStore()

  const userEvents = getEventsByUser(userId)
  const usedSubjects = subjects.filter((subject) => userEvents.some((event) => event.subjectId === subject.id))

  // Get unique colors from events without subjects
  const personalEventColors = Array.from(
    new Set(userEvents.filter((event) => !event.subjectId && event.color).map((event) => event.color)),
  )

  if (usedSubjects.length === 0 && personalEventColors.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Legenda</CardTitle>
        <CardDescription>Kode warna jadwal Anda</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {usedSubjects.map((subject) => (
          <div key={subject.id} className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full flex-shrink-0 border border-gray-300" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{subject.kode}</p>
              <p className="text-sm text-muted-foreground truncate">{subject.nama}</p>
            </div>
            <Badge variant="outline" className="text-xs">
              {subject.sks} SKS
            </Badge>
          </div>
        ))}

        {personalEventColors.map((color, index) => (
          <div key={color} className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full flex-shrink-0 bg-gray-400" />
            <div className="flex-1">
              <p className="font-medium">Jadwal Pribadi</p>
              <p className="text-sm text-muted-foreground">Kegiatan non-akademik</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
