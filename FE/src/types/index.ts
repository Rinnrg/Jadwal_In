export interface User {
  id: string
  name: string
  email: string
  role: "dosen" | "mahasiswa" | "admin"
  avatar?: string
  nip?: string
  nim?: string
}

export interface Subject {
  id: string
  code: string
  name: string
  credits: number
  semester: number
  description?: string
  lecturerId: string
}

export interface Schedule {
  id: string
  subjectId: string
  day: string
  startTime: string
  endTime: string
  room: string
  type: "lecture" | "lab" | "seminar"
}

export interface Attendance {
  id: string
  studentId: string
  subjectId: string
  meetingNumber: number
  status: "hadir" | "alfa" | "izin"
  date: string
  notes?: string
}

export interface Grade {
  id: string
  studentId: string
  subjectId: string
  type: "tugas" | "quiz" | "uts" | "uas"
  score: number
  maxScore: number
  date: string
}

export interface Assignment {
  id: string
  subjectId: string
  title: string
  description: string
  dueDate: string
  type: "individual" | "group"
  status: "draft" | "published" | "closed"
}

export interface Reminder {
  id: string
  title: string
  description: string
  date: string
  type: "assignment" | "exam" | "meeting" | "other"
  priority: "low" | "medium" | "high"
  completed: boolean
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Form types
export interface LoginForm {
  email: string
  password: string
}

export interface SubjectForm {
  code: string
  name: string
  credits: number
  semester: number
  description?: string
}

export interface ScheduleForm {
  subjectId: string
  day: string
  startTime: string
  endTime: string
  room: string
  type: "lecture" | "lab" | "seminar"
}
