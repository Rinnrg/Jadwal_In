export const APP_CONFIG = {
  name: "Jadwal.in",
  description: "Sistem Manajemen Jadwal Akademik",
  version: "1.0.0",
  author: "Tim Pengembang Jadwal.in",
} as const

export const DAYS_OF_WEEK = [
  { value: "monday", label: "Senin" },
  { value: "tuesday", label: "Selasa" },
  { value: "wednesday", label: "Rabu" },
  { value: "thursday", label: "Kamis" },
  { value: "friday", label: "Jumat" },
  { value: "saturday", label: "Sabtu" },
  { value: "sunday", label: "Minggu" },
] as const

export const TIME_SLOTS = [
  "07:00",
  "07:30",
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
] as const

export const ATTENDANCE_STATUS = [
  { value: "hadir", label: "Hadir", color: "green" },
  { value: "alfa", label: "Alfa", color: "red" },
  { value: "izin", label: "Izin", color: "yellow" },
] as const

export const GRADE_TYPES = [
  { value: "tugas", label: "Tugas" },
  { value: "quiz", label: "Quiz" },
  { value: "uts", label: "UTS" },
  { value: "uas", label: "UAS" },
] as const

export const USER_ROLES = [
  { value: "dosen", label: "Dosen" },
  { value: "mahasiswa", label: "Mahasiswa" },
  { value: "admin", label: "Admin" },
] as const

export const PRIORITY_LEVELS = [
  { value: "low", label: "Rendah", color: "gray" },
  { value: "medium", label: "Sedang", color: "yellow" },
  { value: "high", label: "Tinggi", color: "red" },
] as const

export const SEMESTER_OPTIONS = [
  { value: 1, label: "Semester 1" },
  { value: 2, label: "Semester 2" },
  { value: 3, label: "Semester 3" },
  { value: 4, label: "Semester 4" },
  { value: 5, label: "Semester 5" },
  { value: 6, label: "Semester 6" },
  { value: 7, label: "Semester 7" },
  { value: 8, label: "Semester 8" },
] as const

export const MEETING_NUMBERS = Array.from({ length: 16 }, (_, i) => ({
  value: i + 1,
  label: `Pertemuan ${i + 1}`,
}))
