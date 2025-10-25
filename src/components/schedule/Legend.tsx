"use client"

import { useEffect } from "react"
import { useSubjectsStore } from "@/stores/subjects.store"
import { useUsersStore } from "@/stores/users.store"
import { useScheduleStore } from "@/stores/schedule.store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface LegendProps {
  userId: string
}

export function Legend({ userId }: LegendProps) {
  const { subjects, fetchSubjects } = useSubjectsStore()
  const { users, fetchUsers, getUserById } = useUsersStore()
  const { getEventsByUser } = useScheduleStore()

  // Ensure subjects and users data are loaded
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          subjects.length === 0 ? fetchSubjects() : Promise.resolve(),
          users.length === 0 ? fetchUsers() : Promise.resolve()
        ])
      } catch (error) {
        console.error('Failed to load legend data:', error)
      }
    }
    loadData()
  }, []) // Empty dependency array - only run once on mount

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
        {usedSubjects.map((subject) => {
          // Get lecturer names from subject's pengampuIds
          let lecturerNames = ""
          if (subject.pengampuIds && subject.pengampuIds.length > 0) {
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
            <div key={subject.id} className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full flex-shrink-0 border border-gray-300" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{subject.kode}</p>
                <p className="text-sm text-muted-foreground truncate">{subject.nama}</p>
                {lecturerNames && (
                  <p className="text-xs text-muted-foreground truncate">{lecturerNames}</p>
                )}
              </div>
              <Badge variant="outline" className="text-xs">
                {subject.sks} SKS
              </Badge>
            </div>
          )
        })}

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
