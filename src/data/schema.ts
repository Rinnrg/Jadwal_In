import { z } from "zod"

// User Session Schema
export const UserSessionSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  image: z.string().optional(),
  role: z.enum(["mahasiswa", "dosen", "kaprodi", "super_admin"]),
})

export type UserSession = z.infer<typeof UserSessionSchema>

// User Schema for managing users with roles
export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["mahasiswa", "dosen", "kaprodi", "super_admin"]),
  password: z.string().optional(), // For super admin to manage user passwords
  profile: z.object({
    userId: z.string(),
    nim: z.string().optional(),
    angkatan: z.number(),
    kelas: z.string(),
    prodi: z.string().optional(),
    bio: z.string().optional(),
    website: z.string().optional(),
    avatarUrl: z.string().optional(),
  }).optional(),
})

export type User = z.infer<typeof UserSchema>

// Profile Schema
export const ProfileSchema = z.object({
  userId: z.string(),
  nim: z.string().optional(),
  angkatan: z.number(),
  kelas: z.string(), // Added required kelas field
  prodi: z.string().optional(),
  bio: z.string().optional(),
  website: z.string().url().optional(),
  avatarUrl: z.string().optional(),
})

export type Profile = z.infer<typeof ProfileSchema>

// Subject Schema
export const SubjectSchema = z.object({
  id: z.string(),
  kode: z.string(),
  nama: z.string(),
  sks: z.number().min(1).max(6),
  semester: z.number().min(1).max(8),
  prodi: z.string().optional(),
  status: z.enum(["aktif", "arsip"]),
  angkatan: z.number(), // Changed from angkatanMin/angkatanMax to single angkatan field
  kelas: z.string(), // Added kelas field for mata kuliah
  color: z.string(),
  pengampuIds: z.array(z.string()).default([]),
  // Schedule default fields (matching Prisma schema)
  slotDay: z.number().min(0).max(6).optional().nullable(),
  slotStartUTC: z.number().optional().nullable(),
  slotEndUTC: z.number().optional().nullable(),
  slotRuang: z.string().optional().nullable(),
})

export type Subject = z.infer<typeof SubjectSchema>

// File Attachment Schema
export const FileAttachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  size: z.number(),
  type: z.string(),
  uploadType: z.enum(["file", "link"]).default("file"),
  uploadedAt: z.number(),
})

export type FileAttachment = z.infer<typeof FileAttachmentSchema>

// Assignment Schema for asynchronous content
export const AssignmentSchema = z.object({
  id: z.string(),
  subjectId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  dueUTC: z.number().optional(),
  createdAt: z.number(),
  attachments: z.array(FileAttachmentSchema).default([]),
  allowedFileTypes: z.array(z.string()).default([".pdf", ".doc", ".docx"]),
  maxFileSize: z.number().default(10 * 1024 * 1024), // 10MB default
  maxFiles: z.number().default(3),
})

export type Assignment = z.infer<typeof AssignmentSchema>

// Submission Schema for student submissions
export const SubmissionSchema = z.object({
  id: z.string(),
  assignmentId: z.string(),
  studentId: z.string(),
  files: z.array(FileAttachmentSchema).default([]),
  note: z.string().optional(),
  submittedAt: z.number(),
  status: z.enum(["draft", "submitted", "graded"]).default("draft"),
  grade: z.number().min(0).max(100).optional(),
  feedback: z.string().optional(),
  gradedAt: z.number().optional(),
  gradedBy: z.string().optional(),
})

export type Submission = z.infer<typeof SubmissionSchema>

// Material Schema for asynchronous content
export const MaterialSchema = z.object({
  id: z.string(),
  subjectId: z.string(),
  title: z.string(),
  content: z.string().optional(),
  attachments: z.array(FileAttachmentSchema).default([]),
  createdAt: z.number(),
})

export type Material = z.infer<typeof MaterialSchema>

// AttendanceSession Schema for asynchronous content
export const AttendanceSessionSchema = z.object({
  id: z.string(),
  subjectId: z.string(),
  dateUTC: z.number(),
  meetingNumber: z.number().min(1).max(16), // Added meeting number field
  sessionType: z.enum(["regular", "UTS", "UAS"]).default("regular").optional(), // Added session type
  records: z.array(
    z.object({
      studentId: z.string(),
      status: z.enum(["hadir", "alfa", "izin", "sakit"]).default("alfa"), // Added sakit status
    }),
  ),
})

export type AttendanceSession = z.infer<typeof AttendanceSessionSchema>

// KRS Item Schema
export const KrsItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  subjectId: z.string(),
  offeringId: z.string().optional(), // Added offeringId for new system
  term: z.string(),
  createdAt: z.number(),
})

export type KrsItem = z.infer<typeof KrsItemSchema>

// Grade Schema
export const GradeSchema = z.object({
  id: z.string(),
  userId: z.string(),
  subjectId: z.string(),
  offeringId: z.string().optional(), // Added offeringId for per-class grading
  term: z.string(),
  nilaiAngka: z.number().min(0).max(100).optional(),
  nilaiHuruf: z.enum(["A", "B+", "B", "C+", "C", "D", "E"]).optional(),
})

export type Grade = z.infer<typeof GradeSchema>

// Schedule Event Schema
export const ScheduleEventSchema = z.object({
  id: z.string(),
  userId: z.string(),
  subjectId: z.string().optional(),
  dayOfWeek: z.number().min(0).max(6),
  startUTC: z.number(),
  endUTC: z.number(),
  location: z.string().optional(),
  joinUrl: z.string().url().optional(),
  notes: z.string().optional(),
  color: z.string().optional(),
})

export type ScheduleEvent = z.infer<typeof ScheduleEventSchema>

// Reminder Schema
export const ReminderSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  dueUTC: z.number(),
  relatedSubjectId: z.string().optional(),
  isActive: z.boolean(),
  sendEmail: z.boolean().optional(),
})

export type Reminder = z.infer<typeof ReminderSchema>

// UI Preferences Schema
export const UIPreferencesSchema = z.object({
  theme: z.enum(["system", "light", "dark"]),
  language: z.enum(["id", "en"]),
  format24h: z.boolean(),
  showNowLine: z.boolean(),
  showLegend: z.boolean(),
  snapInterval: z.number(),
})

export type UIPreferences = z.infer<typeof UIPreferencesSchema>

// CourseOffering schema for KRS system
export const CourseOfferingSchema = z.object({
  id: z.string(),
  subjectId: z.string(),
  angkatan: z.number(),
  kelas: z.string(),
  semester: z.number(),
  term: z.string().optional().nullable(),
  capacity: z.number().optional().nullable(),
  // Schedule default fields (matching Prisma schema)
  slotDay: z.number().min(0).max(6).optional().nullable(),
  slotStartUTC: z.number().optional().nullable(),
  slotEndUTC: z.number().optional().nullable(),
  slotRuang: z.string().optional().nullable(),
  status: z.enum(["buka", "tutup"]).default("buka"),
  // Optional fields from API response
  subject: z.object({
    id: z.string(),
    kode: z.string(),
    nama: z.string(),
    sks: z.number(),
    semester: z.number(),
    color: z.string(),
  }).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

export type CourseOffering = z.infer<typeof CourseOfferingSchema>
