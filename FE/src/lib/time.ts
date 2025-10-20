import { format, toZonedTime, fromZonedTime } from "date-fns-tz"
import { id } from "date-fns/locale"

const TIMEZONE = "Asia/Jakarta"

// Convert local time to UTC timestamp
export function toUTC(date: Date): number {
  return fromZonedTime(date, TIMEZONE).getTime()
}

// Convert UTC timestamp to Jakarta timezone
export function toZoned(timestamp: number): Date {
  return toZonedTime(new Date(timestamp), TIMEZONE)
}

// Format time in 24h format
export function fmt24(timestamp: number): string {
  return format(toZoned(timestamp), "HH:mm", { locale: id })
}

// Format date
export function fmtDate(timestamp: number): string {
  return format(toZoned(timestamp), "dd/MM/yyyy", { locale: id })
}

// Format datetime
export function fmtDateTime(timestamp: number): string {
  return format(toZoned(timestamp), "dd/MM/yyyy HH:mm", { locale: id })
}

// Check if two time slots overlap
export function isOverlap(start1: number, end1: number, start2: number, end2: number): boolean {
  return start1 < end2 && start2 < end1
}

// Get current time in Jakarta timezone as UTC timestamp
export function nowUTC(): number {
  return toUTC(new Date())
}

// Parse time string (HH:mm) to minutes from midnight
export function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number)
  return hours * 60 + minutes
}

// Convert minutes from midnight to time string
export function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
}
