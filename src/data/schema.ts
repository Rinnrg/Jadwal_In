import { z } from "zod"

// User Session Schema
export const UserSessionSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  image: z.string().optional(),
  role: z.enum(["mahasiswa", "dosen", "kaprodi", "super_admin"]),
  prodi: z.string().optional(),
})

export type UserSession = z.infer<typeof UserSessionSchema>

// User Schema for managing users with roles
export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["mahasiswa", "dosen", "kaprodi", "super_admin"]),
  password: z.string().optional(), // For super admin to manage user passwords
  // Academic fields
  nim: z.string().optional().nullable(),
  nip: z.string().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  angkatan: z.number().optional().nullable(),
  prodi: z.string().optional().nullable(),
  fakultas: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  // Profile fields (now in User table)
  jenisKelamin: z.string().optional().nullable(),
  semesterAwal: z.string().optional().nullable(),
})

export type User = z.infer<typeof UserSchema>

// For backward compatibility - Profile is now part of User
export type Profile = {
  userId: string
  jenisKelamin?: string | null
  semesterAwal?: string | null
  nim?: string | null
  nip?: string | null
  angkatan?: number | null
  prodi?: string | null
  avatarUrl?: string | null
  user?: {
    id: string
    name: string
    email: string
    role: "mahasiswa" | "dosen" | "kaprodi" | "super_admin"
    image?: string | null
  }
}

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
