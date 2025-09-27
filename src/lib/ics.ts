import type { ScheduleEvent } from "@/data/schema"

// Generate ICS content for calendar export
export function generateICS(events: ScheduleEvent[], subjects: any[]): string {
  const now = new Date()
  const timestamp = now.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"

  let icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//jadwal_in//Schedule//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ].join("\r\n")

  events.forEach((event) => {
    const subject = event.subjectId ? subjects.find((s) => s.id === event.subjectId) : null
    const title = subject ? `${subject.kode} - ${subject.nama}` : "Jadwal Pribadi"

    // Generate recurring events for the next 16 weeks (one semester)
    for (let week = 0; week < 16; week++) {
      const eventDate = new Date()
      const daysUntilEvent = (event.dayOfWeek - eventDate.getDay() + 7) % 7
      eventDate.setDate(eventDate.getDate() + daysUntilEvent + week * 7)

      const startDateTime = new Date(eventDate)
      startDateTime.setHours(0, 0, 0, 0)
      startDateTime.setTime(startDateTime.getTime() + event.startUTC)

      const endDateTime = new Date(eventDate)
      endDateTime.setHours(0, 0, 0, 0)
      endDateTime.setTime(endDateTime.getTime() + event.endUTC)

      const formatDateTime = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
      }

      icsContent +=
        "\r\n" +
        [
          "BEGIN:VEVENT",
          `UID:${event.id}-${week}@jadwal_in`,
          `DTSTAMP:${timestamp}`,
          `DTSTART:${formatDateTime(startDateTime)}`,
          `DTEND:${formatDateTime(endDateTime)}`,
          `SUMMARY:${title}`,
          event.location ? `LOCATION:${event.location}` : "",
          event.notes ? `DESCRIPTION:${event.notes}` : "",
          event.joinUrl ? `URL:${event.joinUrl}` : "",
          // Add alarms
          "BEGIN:VALARM",
          "TRIGGER:-PT10M",
          "ACTION:DISPLAY",
          `DESCRIPTION:${title} dimulai dalam 10 menit`,
          "END:VALARM",
          "BEGIN:VALARM",
          "TRIGGER:-PT5M",
          "ACTION:DISPLAY",
          `DESCRIPTION:${title} dimulai dalam 5 menit`,
          "END:VALARM",
          "BEGIN:VALARM",
          "TRIGGER:-PT1M",
          "ACTION:DISPLAY",
          `DESCRIPTION:${title} dimulai dalam 1 menit`,
          "END:VALARM",
          "END:VEVENT",
        ]
          .filter(Boolean)
          .join("\r\n")
    }
  })

  icsContent += "\r\nEND:VCALENDAR"
  return icsContent
}

// Export ICS file
export function exportICS(events: ScheduleEvent[], subjects: any[], filename = "jadwal.ics") {
  const icsContent = generateICS(events, subjects)
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" })
  const url = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()

  URL.revokeObjectURL(url)
}

// Simple ICS parser for import
export function parseICS(icsContent: string): Partial<ScheduleEvent>[] {
  const events: Partial<ScheduleEvent>[] = []
  const lines = icsContent.split(/\r?\n/)

  let currentEvent: Partial<ScheduleEvent> | null = null

  for (const line of lines) {
    const [key, ...valueParts] = line.split(":")
    const value = valueParts.join(":")

    switch (key) {
      case "BEGIN":
        if (value === "VEVENT") {
          currentEvent = {}
        }
        break

      case "END":
        if (value === "VEVENT" && currentEvent) {
          events.push(currentEvent)
          currentEvent = null
        }
        break

      case "SUMMARY":
        if (currentEvent) {
          // Try to parse subject code from summary
          const match = value.match(/^([A-Z]{2}\d{3})\s*-\s*(.+)$/)
          if (match) {
            currentEvent.notes = `${match[1]} - ${match[2]}`
          } else {
            currentEvent.notes = value
          }
        }
        break

      case "DTSTART":
        if (currentEvent && value) {
          const date = new Date(value.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?/, "$1-$2-$3T$4:$5:$6Z"))
          currentEvent.dayOfWeek = date.getDay()
          currentEvent.startUTC = (date.getHours() * 60 + date.getMinutes()) * 60 * 1000
        }
        break

      case "DTEND":
        if (currentEvent && value) {
          const date = new Date(value.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?/, "$1-$2-$3T$4:$5:$6Z"))
          currentEvent.endUTC = (date.getHours() * 60 + date.getMinutes()) * 60 * 1000
        }
        break

      case "LOCATION":
        if (currentEvent) {
          currentEvent.location = value
        }
        break

      case "URL":
        if (currentEvent) {
          currentEvent.joinUrl = value
        }
        break

      case "DESCRIPTION":
        if (currentEvent) {
          currentEvent.notes = currentEvent.notes ? `${currentEvent.notes}\n${value}` : value
        }
        break
    }
  }

  return events.filter(
    (event) => event.dayOfWeek !== undefined && event.startUTC !== undefined && event.endUTC !== undefined,
  )
}
