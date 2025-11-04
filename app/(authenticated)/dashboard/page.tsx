"use client"

import { useSessionStore } from "@/stores/session.store"
import { useProfileStore } from "@/stores/profile.store"
import { useActivityStore } from "@/stores/activity.store"
import { useScheduleStore } from "@/stores/schedule.store"
import { useSubjectsStore } from "@/stores/subjects.store"
import { useKrsStore } from "@/stores/krs.store"
import { useCourseworkStore } from "@/stores/coursework.store"
import { useRemindersStore } from "@/stores/reminders.store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  BookOpen,
  Users,
  Clock,
  TrendingUp,
  Award,
  Bell,
  Plus,
  ArrowRight,
  Sparkles,
  Target,
  Activity,
  CheckCircle,
  AlertCircle,
  Star,
  Edit,
  Trash2,
  Upload,
  Download,
  User,
  FileText,
  ClipboardList,
  FileText as FilesIcon,
} from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { formatDistanceToNow, format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { useRealtimeSync } from "@/hooks/use-realtime-sync"

export default function DashboardPage() {
  const { session } = useSessionStore()
  const { getProfile, profiles } = useProfileStore()
  const { getActivitiesByUser } = useActivityStore()
  const { getEventsByDay } = useScheduleStore()
  const { getSubjectById, subjects, fetchSubjects } = useSubjectsStore()
  const { getKrsByUser, krsItems } = useKrsStore()
  const { assignments, materials } = useCourseworkStore()
  const { getActiveReminders, reminders } = useRemindersStore()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showAssignments, setShowAssignments] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<"schedule" | "subjects" | "reminders" | "coursework">("schedule")
  const [dialogData, setDialogData] = useState<any[]>([])
  
  // Force re-render trigger for reactive updates
  const [, setForceUpdate] = useState(0)

  // Enable real-time sync for this page
  const { isPolling } = useRealtimeSync({
    enabled: true,
    pollingInterval: 2000, // Poll every 2 seconds for realtime updates (faster response)
    // Removed onSubjectAdded callback to prevent spam logs
  })

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])
  
  // Fetch subjects on mount to ensure data is available
  useEffect(() => {
    if (subjects.length === 0) {
      fetchSubjects()
    }
  }, [])
  
  // Force update when store data changes (for real-time updates)
  useEffect(() => {
    setForceUpdate(prev => prev + 1)
  }, [subjects.length, krsItems.length, assignments.length, materials.length, reminders.length])
  
  // Debug log
  useEffect(() => {
    console.log('[Dashboard] Session state:', session)
    console.log('[Dashboard] Subjects count:', subjects.length)
    console.log('[Dashboard] Reminders count:', reminders.length)
  }, [session, subjects, reminders])

  // Fungsi untuk menentukan ucapan berdasarkan waktu
  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour >= 5 && hour < 11) return "Selamat Pagi"
    if (hour >= 11 && hour < 15) return "Selamat Siang"
    if (hour >= 15 && hour < 18) return "Selamat Sore"
    return "Selamat Malam"
  }

  // Fungsi untuk mendapatkan warna berdasarkan waktu
  const getTimeBasedColors = () => {
    const hour = currentTime.getHours()
    if (hour >= 5 && hour < 11) {
      return {
        text: "text-yellow-600 dark:text-yellow-400",
        gradient: "from-yellow-400 to-orange-500",
        cardBg: "bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20",
        cardBorder: "border-yellow-200 dark:border-yellow-800",
        icon: "sun"
      }
    }
    if (hour >= 11 && hour < 15) {
      return {
        text: "text-blue-600 dark:text-blue-400",
        gradient: "from-blue-400 to-cyan-500",
        cardBg: "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20",
        cardBorder: "border-blue-200 dark:border-blue-800",
        icon: "noon"
      }
    }
    if (hour >= 15 && hour < 18) {
      return {
        text: "text-orange-600 dark:text-orange-400",
        gradient: "from-orange-400 to-red-500",
        cardBg: "bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20",
        cardBorder: "border-orange-200 dark:border-orange-800",
        icon: "sunset"
      }
    }
    return {
      text: "text-indigo-600 dark:text-indigo-400",
      gradient: "from-indigo-400 to-purple-500",
      cardBg: "bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20",
      cardBorder: "border-indigo-200 dark:border-indigo-800",
      icon: "night"
    }
  }

  // Fungsi untuk menghitung posisi celestial body (matahari/bulan)
  const getCelestialPosition = () => {
    const hour = currentTime.getHours()
    const minute = currentTime.getMinutes()
    const totalMinutes = hour * 60 + minute
    
    // Siang (matahari): 05:00 (300 menit) sampai 18:00 (1080 menit) = 780 menit range
    // Malam (bulan): 18:00 (1080 menit) sampai 05:00 next day (300 menit) = 660 menit range
    
    let position = { x: 0, y: 0, rotation: 0 }
    
    if (hour >= 5 && hour < 18) {
      // Matahari (05:00 - 18:00)
      const sunStart = 5 * 60 // 05:00
      const sunEnd = 18 * 60 // 18:00
      const sunDuration = sunEnd - sunStart // 780 menit
      const elapsed = totalMinutes - sunStart
      const progress = elapsed / sunDuration // 0 to 1
      
      // Gerakan seperti busur: mulai dari kiri bawah, naik ke tengah, turun ke kanan bawah
      const angle = Math.PI * progress // 0 to π (180 derajat)
      position.x = Math.sin(angle) * 50 // Horizontal movement (-50 to 50)
      position.y = -Math.sin(angle) * 40 // Vertical movement (0 to -40 to 0)
      position.rotation = progress * 360
    } else {
      // Bulan (18:00 - 05:00)
      let moonMinutes = totalMinutes
      if (hour < 5) {
        moonMinutes = totalMinutes + 24 * 60 // Tambah 24 jam untuk hari berikutnya
      }
      
      const moonStart = 18 * 60 // 18:00
      const moonEnd = 29 * 60 // 05:00 next day (24 + 5)
      const moonDuration = moonEnd - moonStart // 660 menit
      const elapsed = moonMinutes - moonStart
      const progress = elapsed / moonDuration // 0 to 1
      
      // Gerakan seperti busur: mulai dari kiri bawah, naik ke tengah, turun ke kanan bawah
      const angle = Math.PI * progress // 0 to π (180 derajat)
      position.x = Math.sin(angle) * 50
      position.y = -Math.sin(angle) * 40
      position.rotation = progress * 360
    }
    
    return position
  }

  // Fungsi untuk mendapatkan inisial nama
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (!session) {
    console.log('[Dashboard] No session, rendering loading state')
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
          <div>
            <p className="text-lg font-medium text-foreground">Memuat Dashboard</p>
            <p className="text-sm text-muted-foreground mt-1">Mohon tunggu sebentar...</p>
          </div>
        </div>
      </div>
    )
  }

  const profile = getProfile(session.id)
  // avatarUrl is now directly in User model, accessible via session
  const avatarUrl = session.image || ""
  const timeColors = getTimeBasedColors()
  const celestialPos = getCelestialPosition()
  const isSunTime = currentTime.getHours() >= 5 && currentTime.getHours() < 18

  // Get today's schedule
  const currentDayOfWeek = currentTime.getDay()
  const todayEvents = getEventsByDay(session.id, currentDayOfWeek)
  
  // Get current term for KRS
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()
  const isOddSemester = currentMonth >= 8 || currentMonth <= 1
  const currentTerm = `${currentYear}/${currentYear + 1}-${isOddSemester ? "Ganjil" : "Genap"}`
  
  // Get KRS items for current user and term (for mahasiswa)
  // Get taught subjects for dosen/kaprodi
  const userKrsItems = session ? getKrsByUser(session.id, currentTerm) : []
  const taughtSubjects = session && (session.role === "dosen" || session.role === "kaprodi")
    ? subjects.filter(s => s.pengampuIds?.includes(session.id))
    : []
  
  // Debug logging for subject count
  useEffect(() => {
    if (session?.role === "mahasiswa") {
      console.log('[Dashboard] Current term:', currentTerm)
      console.log('[Dashboard] User KRS items for term:', userKrsItems.length)
      console.log('[Dashboard] User KRS items:', userKrsItems)
      console.log('[Dashboard] All subjects:', subjects.length)
    }
  }, [session, userKrsItems.length, subjects.length])
  
  // Format time helper
  const formatTime = (utcMinutes: number) => {
    const hours = Math.floor(utcMinutes / 60)
    const minutes = utcMinutes % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }
  
  // Get color classes for event
  const getEventColorClasses = (color?: string) => {
    const colorMap: Record<string, { bg: string; border: string; dot: string }> = {
      blue: { 
        bg: "bg-blue-50 dark:bg-blue-950/20", 
        border: "border-blue-200 dark:border-blue-800",
        dot: "bg-blue-500"
      },
      green: { 
        bg: "bg-green-50 dark:bg-green-950/20", 
        border: "border-green-200 dark:border-green-800",
        dot: "bg-green-500"
      },
      purple: { 
        bg: "bg-purple-50 dark:bg-purple-950/20", 
        border: "border-purple-200 dark:border-purple-800",
        dot: "bg-purple-500"
      },
      orange: { 
        bg: "bg-orange-50 dark:bg-orange-950/20", 
        border: "border-orange-200 dark:border-orange-800",
        dot: "bg-orange-500"
      },
      red: { 
        bg: "bg-red-50 dark:bg-red-950/20", 
        border: "border-red-200 dark:border-red-800",
        dot: "bg-red-500"
      },
      yellow: { 
        bg: "bg-yellow-50 dark:bg-yellow-950/20", 
        border: "border-yellow-200 dark:border-yellow-800",
        dot: "bg-yellow-500"
      },
    }
    return colorMap[color || "blue"] || colorMap.blue
  }

  // Quick actions based on user role
  const quickActions = session.role === "mahasiswa" 
    ? [
        { title: "Lihat Jadwal", icon: Calendar, href: "/jadwal", color: "text-blue-500" },
        { title: "Lihat KRS", icon: Users, href: "/krs", color: "text-purple-500" },
        { title: "Kehadiran", icon: CheckCircle, href: "/kehadiran", color: "text-green-500" },
        { title: "Pengingat", icon: Bell, href: "/reminders", color: "text-orange-500" },
      ]
    : [
        { title: "Buat Jadwal", icon: Calendar, href: "/jadwal", color: "text-blue-500" },
        { title: "Tambah Mata Kuliah", icon: BookOpen, href: "/subjects", color: "text-green-500" },
        { title: "Kelola KRS", icon: Users, href: "/krs", color: "text-purple-500" },
        { title: "Pengingat", icon: Bell, href: "/reminders", color: "text-orange-500" },
      ]

  // Get icon component from icon name string
  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      Calendar,
      BookOpen,
      Users,
      Clock,
      CheckCircle,
      Bell,
      Star,
      Plus,
      Edit,
      Trash2,
      Upload,
      Download,
      User,
      FileText,
      AlertCircle,
      Activity,
    }
    return icons[iconName] || Star
  }

  // Get user activities from store
  const userActivities = session ? getActivitiesByUser(session.id, 5) : []
  
  // Format activities for display
  const recentActivities = userActivities.map((activity: any) => ({
    title: activity.title,
    time: formatDistanceToNow(activity.timestamp, { addSuffix: true, locale: idLocale }),
    icon: getIconComponent(activity.icon),
    color: activity.color,
  }))

  // Get active reminders count (all future reminders, not just urgent ones)
  const activeReminders = session ? getActiveReminders(session.id).filter(r => r.dueUTC > Date.now()) : []
  const urgentReminders = activeReminders.filter(r => r.dueUTC < Date.now() + 24 * 60 * 60 * 1000) // within 24 hours
  
  // Debug log for reminders (real-time updates)
  useEffect(() => {
    if (session) {
      console.log('[Dashboard] Total Reminders in Store:', reminders.length)
      console.log('[Dashboard] Active Reminders (future):', activeReminders.length)
      console.log('[Dashboard] Urgent Reminders (24h):', urgentReminders.length)
      console.log('[Dashboard] All Reminders:', reminders)
    }
  }, [reminders.length, activeReminders.length, urgentReminders.length])

  // Get assignments and materials
  // For dosen/kaprodi: only show from their taught subjects
  // For mahasiswa: show from their KRS subjects
  const relevantSubjectIds = session?.role === "mahasiswa" 
    ? userKrsItems.map(item => item.subjectId)
    : taughtSubjects.map(s => s.id)
    
  const allAssignments = assignments.filter(a => {
    if (!a.dueUTC) return false
    if (!relevantSubjectIds.includes(a.subjectId)) return false
    return a.dueUTC > Date.now() // Only show upcoming assignments
  }).sort((a, b) => (a.dueUTC || 0) - (b.dueUTC || 0))

  const allMaterials = materials
    .filter(m => relevantSubjectIds.includes(m.subjectId))
    .sort((a, b) => b.createdAt - a.createdAt)

  const handleOpenDialog = (type: "schedule" | "subjects" | "reminders" | "coursework") => {
    setDialogType(type)
    
    console.log('[Dashboard Dialog] Opening dialog:', type)
    console.log('[Dashboard Dialog] Session:', session)
    console.log('[Dashboard Dialog] Subjects available:', subjects.length)
    console.log('[Dashboard Dialog] User KRS items:', userKrsItems.length)
    console.log('[Dashboard Dialog] Taught subjects:', taughtSubjects.length)
    
    switch (type) {
      case "schedule":
        const scheduleData = todayEvents.map(event => ({
          ...event,
          subject: event.subjectId ? getSubjectById(event.subjectId) : null
        }))
        console.log('[Dashboard Dialog] Schedule data:', scheduleData)
        setDialogData(scheduleData)
        break
      case "subjects":
        // Get subjects from user's KRS (mahasiswa) or taught subjects (dosen/kaprodi)
        if (session?.role === "mahasiswa") {
          console.log('[Dashboard Dialog] User KRS Items:', userKrsItems)
          const krsSubjects = userKrsItems
            .map(krsItem => {
              const subject = getSubjectById(krsItem.subjectId)
              console.log(`[Dashboard Dialog] KRS Item ${krsItem.id} - Subject ID: ${krsItem.subjectId}, Found:`, subject)
              if (!subject) return null
              return {
                ...subject,
                krsId: krsItem.id,
                term: krsItem.term,
                offeringId: krsItem.offeringId
              }
            })
            .filter(Boolean)
          console.log('[Dashboard Dialog] KRS Subjects data:', krsSubjects)
          setDialogData(krsSubjects)
        } else {
          console.log('[Dashboard Dialog] Taught Subjects data:', taughtSubjects)
          setDialogData(taughtSubjects)
        }
        break
      case "reminders":
        const remindersData = activeReminders.map(r => ({
          ...r,
          subject: r.relatedSubjectId ? getSubjectById(r.relatedSubjectId) : null
        }))
        console.log('[Dashboard Dialog] Reminders data:', remindersData)
        setDialogData(remindersData)
        break
      case "coursework":
        if (showAssignments) {
          const assignmentsData = allAssignments.map(a => ({
            ...a,
            subject: getSubjectById(a.subjectId)
          }))
          console.log('[Dashboard Dialog] Assignments data:', assignmentsData)
          setDialogData(assignmentsData)
        } else {
          const materialsData = allMaterials.map(m => ({
            ...m,
            subject: getSubjectById(m.subjectId)
          }))
          console.log('[Dashboard Dialog] Materials data:', materialsData)
          setDialogData(materialsData)
        }
        break
    }
    
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6 animate-fade-in w-full max-w-none overflow-x-hidden">
      {/* Header Section dengan Ucapan, Profile, Nama, Role, dan Tanggal */}
      <div className="animate-slide-up">
        <Card className={`${timeColors.cardBg} border-2 ${timeColors.cardBorder} transition-all duration-1000 ease-in-out relative overflow-hidden`}>
          {/* Sky Background - Full Card with realistic colors */}
          <div className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
            isSunTime 
              ? currentTime.getHours() < 11
                ? 'bg-gradient-to-b from-yellow-100 via-orange-50 to-yellow-50 dark:from-yellow-900/30 dark:via-orange-900/20 dark:to-yellow-800/20' // Pagi - Kuning
                : currentTime.getHours() < 15
                ? 'bg-gradient-to-b from-sky-400 via-blue-300 to-cyan-200 dark:from-sky-900/40 dark:via-blue-800/30 dark:to-cyan-700/20' // Siang - Biru
                : 'bg-gradient-to-b from-orange-400 via-orange-300 to-yellow-200 dark:from-orange-900/40 dark:via-orange-800/30 dark:to-yellow-700/20' // Sore - Oren
              : 'bg-gradient-to-b from-slate-900 via-indigo-950 to-blue-950 dark:from-slate-950/60 dark:via-indigo-950/50 dark:to-blue-950/40' // Malam - Biru Kehitaman
          }`}></div>
          
          {/* Fade gradient overlay - gelap di kiri (teks terlihat), terang di kanan (tata surya terlihat) */}
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/50 to-transparent dark:from-background/90 dark:via-background/70 dark:to-transparent md:from-background/100 md:via-background/40 md:to-transparent md:dark:from-background/95 md:dark:via-background/75 md:dark:to-transparent transition-all duration-1000 ease-in-out"></div>
          
          {/* Horizon line with dynamic colors */}
          <div className={`absolute bottom-0 left-0 right-0 h-1/3 transition-all duration-1000 ease-in-out ${
            isSunTime
              ? currentTime.getHours() < 11
                ? 'bg-gradient-to-t from-green-300/50 via-green-200/30 to-transparent dark:from-green-900/40 dark:via-green-800/20 dark:to-transparent' // Pagi
                : currentTime.getHours() < 15
                ? 'bg-gradient-to-t from-emerald-200/40 via-green-100/20 to-transparent dark:from-emerald-900/30 dark:via-green-800/15 dark:to-transparent' // Siang
                : 'bg-gradient-to-t from-amber-300/50 via-orange-200/30 to-transparent dark:from-amber-900/40 dark:via-orange-800/20 dark:to-transparent' // Sore
              : 'bg-gradient-to-t from-slate-800/50 via-slate-700/30 to-transparent dark:from-slate-950/50 dark:via-slate-900/30 dark:to-transparent' // Malam
          }`}></div>
          
          {/* Decorative Background Pattern */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <circle cx="20" cy="20" r="1.5" fill="currentColor" className={timeColors.text} />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          
          {/* Celestial body (Sun/Moon) - Positioned in background, scaled for mobile, realistic design */}
          <div 
            className="absolute right-4 md:right-8 top-1/2 transition-all duration-1000 ease-in-out z-0"
            style={{
              transform: `translate(${celestialPos.x}%, calc(-50% + ${celestialPos.y}%))`,
            }}
          >
            {isSunTime ? (
              // Realistic Sun
              <div className="relative transition-all duration-1000 ease-in-out">
                {/* Sun core with realistic gradient */}
                <div 
                  className={`w-20 h-20 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-full transition-all duration-1000 ease-in-out ${
                    currentTime.getHours() < 11
                      ? 'bg-gradient-radial from-yellow-200 via-yellow-400 to-orange-500' // Pagi - Kuning lembut
                      : currentTime.getHours() < 15
                      ? 'bg-gradient-radial from-white via-yellow-100 to-yellow-400' // Siang - Putih terang
                      : 'bg-gradient-radial from-orange-300 via-orange-500 to-red-500' // Sore - Oren kemerahan
                  }`}
                  style={{
                    boxShadow: `
                      0 0 20px ${currentTime.getHours() < 11 ? 'rgba(251, 191, 36, 0.8)' : currentTime.getHours() < 15 ? 'rgba(255, 255, 255, 1)' : 'rgba(249, 115, 22, 0.9)'},
                      0 0 40px ${currentTime.getHours() < 11 ? 'rgba(251, 191, 36, 0.6)' : currentTime.getHours() < 15 ? 'rgba(251, 191, 36, 0.7)' : 'rgba(249, 115, 22, 0.7)'},
                      0 0 60px ${currentTime.getHours() < 11 ? 'rgba(251, 191, 36, 0.4)' : currentTime.getHours() < 15 ? 'rgba(251, 191, 36, 0.5)' : 'rgba(249, 115, 22, 0.5)'},
                      inset 0 -5px 15px rgba(0, 0, 0, 0.1)
                    `,
                    transition: 'all 1s ease-in-out'
                  }}
                >
                  {/* Sun surface texture */}
                  <div className="absolute inset-0 rounded-full overflow-hidden opacity-20">
                    <div className="absolute top-2 left-3 w-4 h-4 md:w-6 md:h-6 bg-yellow-600/30 rounded-full blur-sm"></div>
                    <div className="absolute top-8 right-5 w-3 h-3 md:w-5 md:h-5 bg-orange-600/30 rounded-full blur-sm"></div>
                    <div className="absolute bottom-5 left-6 w-5 h-5 md:w-7 md:h-7 bg-orange-700/30 rounded-full blur-sm"></div>
                  </div>
                </div>
                
                {/* Glow effect */}
                <div 
                  className={`absolute inset-0 rounded-full transition-all duration-1000 ease-in-out ${
                    currentTime.getHours() < 11
                      ? 'bg-yellow-300/20' // Pagi
                      : currentTime.getHours() < 15
                      ? 'bg-yellow-200/30' // Siang
                      : 'bg-orange-400/25' // Sore
                  }`}
                  style={{
                    filter: 'blur(15px)',
                    transform: 'scale(1.3)',
                    transition: 'all 1s ease-in-out'
                  }}
                ></div>
              </div>
            ) : (
              // Realistic Moon with stars
              <div className="relative transition-all duration-1000 ease-in-out">
                {/* Moon with realistic texture */}
                <div 
                  className="w-20 h-20 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-full bg-gradient-radial from-gray-100 via-gray-200 to-gray-300 dark:from-gray-300 dark:via-gray-400 dark:to-gray-500 transition-all duration-1000 ease-in-out relative overflow-hidden"
                  style={{
                    boxShadow: `
                      0 0 30px rgba(203, 213, 225, 0.6),
                      0 0 60px rgba(203, 213, 225, 0.4),
                      inset -8px -8px 20px rgba(0, 0, 0, 0.3),
                      inset 5px 5px 15px rgba(255, 255, 255, 0.2)
                    `,
                    transition: 'all 1s ease-in-out'
                  }}
                >
                  {/* Moon craters - more realistic */}
                  <div className="absolute top-3 left-3 md:top-6 md:left-6 w-3 h-3 md:w-5 md:h-5 rounded-full bg-gray-400/50 dark:bg-gray-600/50 transition-all duration-1000 ease-in-out" style={{ boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.3)' }}></div>
                  <div className="absolute top-8 left-6 md:top-16 md:left-12 w-4 h-4 md:w-6 md:h-6 rounded-full bg-gray-400/40 dark:bg-gray-600/40 transition-all duration-1000 ease-in-out" style={{ boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.3)' }}></div>
                  <div className="absolute top-5 right-4 md:top-10 md:right-8 w-2.5 h-2.5 md:w-4 md:h-4 rounded-full bg-gray-400/45 dark:bg-gray-600/45 transition-all duration-1000 ease-in-out" style={{ boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.3)' }}></div>
                  <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 w-2 h-2 md:w-3 md:h-3 rounded-full bg-gray-400/40 dark:bg-gray-600/40 transition-all duration-1000 ease-in-out" style={{ boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.3)' }}></div>
                  <div className="absolute top-12 right-6 w-2.5 h-2.5 md:w-4 md:h-4 rounded-full bg-gray-400/35 dark:bg-gray-600/35 transition-all duration-1000 ease-in-out" style={{ boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.3)' }}></div>
                  
                  {/* Moon surface texture overlay */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-transparent via-gray-300/10 to-gray-500/20 transition-all duration-1000 ease-in-out"></div>
                </div>
                
                {/* Moon glow */}
                <div 
                  className="absolute inset-0 rounded-full bg-slate-300/15 dark:bg-slate-200/20 transition-all duration-1000 ease-in-out"
                  style={{
                    filter: 'blur(20px)',
                    transform: 'scale(1.4)',
                    transition: 'all 1s ease-in-out'
                  }}
                ></div>
                
                {/* Stars scattered around - twinkling effect */}
                <div className="absolute -top-6 -right-4 md:-top-10 md:-right-8 w-2 h-2 md:w-3 md:h-3 bg-white rounded-full animate-twinkle transition-all duration-1000 ease-in-out" style={{ boxShadow: '0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 255, 255, 0.4)' }}></div>
                <div className="absolute -top-4 -left-6 md:-top-6 md:-left-10 w-1.5 h-1.5 md:w-2 md:h-2 bg-yellow-100 rounded-full animate-twinkle transition-all duration-1000 ease-in-out" style={{ animationDelay: "0.3s", boxShadow: '0 0 8px rgba(254, 243, 199, 0.7)' }}></div>
                <div className="absolute -bottom-5 -right-6 md:-bottom-8 md:-right-10 w-2 h-2 md:w-3 md:h-3 bg-white rounded-full animate-twinkle transition-all duration-1000 ease-in-out" style={{ animationDelay: "0.6s", boxShadow: '0 0 10px rgba(255, 255, 255, 0.8)' }}></div>
                <div className="absolute -bottom-6 left-4 md:-bottom-10 md:left-8 w-1.5 h-1.5 md:w-2 md:h-2 bg-blue-100 rounded-full animate-twinkle transition-all duration-1000 ease-in-out" style={{ animationDelay: "0.9s", boxShadow: '0 0 8px rgba(219, 234, 254, 0.7)' }}></div>
                <div className="absolute top-10 -left-4 md:top-16 md:-left-8 w-2 h-2 md:w-2.5 md:h-2.5 bg-white rounded-full animate-twinkle transition-all duration-1000 ease-in-out" style={{ animationDelay: "1.2s", boxShadow: '0 0 9px rgba(255, 255, 255, 0.75)' }}></div>
                <div className="absolute top-1 right-6 md:top-2 md:right-12 w-1.5 h-1.5 md:w-2 md:h-2 bg-yellow-50 rounded-full animate-twinkle transition-all duration-1000 ease-in-out" style={{ animationDelay: "1.5s", boxShadow: '0 0 7px rgba(254, 252, 232, 0.6)' }}></div>
              </div>
            )}
          </div>
          
          {/* Clouds for daytime - scattered across card, visible on mobile, adjusted to prevent overflow, realistic colors, static */}
          {isSunTime && (
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden transition-all duration-1000 ease-in-out">
              <div 
                className={`absolute top-8 right-8 md:top-12 md:right-16 w-16 h-6 md:w-24 md:h-10 rounded-full blur-md transition-all duration-1000 ease-in-out ${
                  currentTime.getHours() < 11
                    ? 'bg-white/60 dark:bg-gray-300/30' // Pagi - putih lembut
                    : currentTime.getHours() < 15
                    ? 'bg-white/70 dark:bg-gray-200/40' // Siang - putih cerah
                    : 'bg-orange-100/60 dark:bg-orange-300/30' // Sore - oren lembut
                }`}
                style={{ transition: 'all 1s ease-in-out' }}
              ></div>
              <div 
                className={`absolute top-16 right-16 md:top-24 md:right-32 w-12 h-5 md:w-20 md:h-8 rounded-full blur-md transition-all duration-1000 ease-in-out ${
                  currentTime.getHours() < 11
                    ? 'bg-white/50 dark:bg-gray-300/25' // Pagi
                    : currentTime.getHours() < 15
                    ? 'bg-white/65 dark:bg-gray-200/35' // Siang
                    : 'bg-orange-100/50 dark:bg-orange-300/25' // Sore
                }`}
                style={{ transition: 'all 1s ease-in-out' }}
              ></div>
              <div 
                className={`absolute bottom-12 right-12 md:bottom-20 md:right-24 w-18 h-7 md:w-28 md:h-12 rounded-full blur-md transition-all duration-1000 ease-in-out ${
                  currentTime.getHours() < 11
                    ? 'bg-white/55 dark:bg-gray-300/28' // Pagi
                    : currentTime.getHours() < 15
                    ? 'bg-white/68 dark:bg-gray-200/38' // Siang
                    : 'bg-orange-100/55 dark:bg-orange-300/28' // Sore
                }`}
                style={{ transition: 'all 1s ease-in-out' }}
              ></div>
            </div>
          )}
          
          <CardContent className="pt-4 md:pt-6 relative z-10 px-3 md:px-6">
            <div className="flex flex-col items-start space-y-2 md:space-y-3.5 w-full">
                {/* Tanggal */}
                <div className="flex items-center space-x-1.5 md:space-x-2 text-foreground animate-slide-in-left transition-colors duration-500">
                  <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
                  <p className="text-xs md:text-sm break-words font-medium">
                    {currentTime.toLocaleDateString("id-ID", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}{" "}
                    - {currentTime.toLocaleTimeString("id-ID")}
                  </p>
                </div>
                
                {/* Ucapan Selamat */}
                <p className="text-base md:text-xl lg:text-2xl text-foreground font-semibold transition-colors duration-500">
                  {getGreeting()}
                </p>
                
                {/* Foto Profile dengan Live Indicator - optimal untuk mobile */}
                <div className="relative">
                  <Avatar className="h-16 w-16 md:h-24 md:w-24 lg:h-28 lg:w-28 border-2 md:border-4 border-primary/20 shadow-lg animate-scale-in transition-all duration-500">
                    <AvatarImage src={avatarUrl} alt={session.name} />
                    <AvatarFallback className={`text-lg md:text-2xl lg:text-3xl font-bold bg-gradient-to-br ${timeColors.gradient} text-white transition-all duration-1000`}>
                      {getInitials(session.name)}
                    </AvatarFallback>
                  </Avatar>
                  {/* Live Indicator - positioned at bottom right of avatar */}
                  <div 
                    className={`absolute bottom-0 right-0 w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 bg-green-500 rounded-full border-2 border-background shadow-lg ${
                      isPolling 
                        ? 'opacity-100 scale-100 animate-pulse' 
                        : 'opacity-0 scale-0'
                    }`}
                    style={{
                      transition: 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out'
                    }}
                    title="Live"
                  >
                    {/* Ripple effect for live indicator */}
                    {isPolling && (
                      <>
                        <span className="absolute inset-0 rounded-full bg-green-500 opacity-75 animate-ping" />
                        <span className="absolute inset-0 rounded-full bg-green-400/50 animate-pulse" style={{ animationDelay: '0.15s' }} />
                      </>
                    )}
                  </div>
                </div>
                
                {/* Nama */}
                <h2 className="text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-foreground animate-slide-in-left transition-colors duration-500 break-words max-w-full">
                  {session.name.split(" (")[0]}
                </h2>
                
                {/* Role & Angkatan Badges */}
                <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                  {/* Role Badge */}
                  <div className={`inline-flex items-center px-2 py-1 md:px-3 md:py-1.5 rounded-full ${timeColors.cardBg} border ${timeColors.cardBorder} animate-slide-in-left transition-all duration-1000`} style={{ animationDelay: "0.1s" }}>
                    <span className={`text-[10px] md:text-xs font-semibold ${timeColors.text} uppercase tracking-wide transition-colors duration-1000`}>
                      {session.role === "mahasiswa" ? "Mahasiswa" : session.role === "dosen" ? "Dosen" : "Kepala Program Studi"}
                    </span>
                  </div>
                  
                  {/* Angkatan Badge - Only for Mahasiswa */}
                  {session.role === "mahasiswa" && session.name.includes("(Angkatan") && (
                    <div className={`inline-flex items-center px-2 py-1 md:px-3 md:py-1.5 rounded-full ${timeColors.cardBg} border ${timeColors.cardBorder} animate-slide-in-left transition-all duration-1000`} style={{ animationDelay: "0.15s" }}>
                      <span className={`text-[10px] md:text-xs font-semibold ${timeColors.text} uppercase tracking-wide transition-colors duration-1000`}>
                        {session.name.match(/Angkatan (\d{4})/)?.[0] || ""}
                      </span>
                    </div>
                  )}
                </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className={`grid gap-4 md:gap-6 grid-cols-2 w-full ${session.role === "mahasiswa" ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
        <Card
          className="card-interactive border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 group w-full min-w-0 cursor-pointer select-none transition-all duration-200"
          style={{ animationDelay: "0.1s" }}
          onClick={() => handleOpenDialog("schedule")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 md:pb-3 px-4 md:px-6 pt-4 md:pt-6">
            <CardTitle className="text-xs md:text-sm font-bold">
              {session.role === "mahasiswa" ? "Jadwal Hari Ini" : "Jadwal Mengajar"}
            </CardTitle>
            <Calendar className="h-5 w-5 md:h-6 md:w-6 text-blue-500 group-hover:scale-125 transition-transform duration-300" />
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
            <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-1 md:mb-2">{todayEvents.length}</div>
            <p className="text-xs md:text-sm text-muted-foreground">
              {session.role === "mahasiswa" ? 'Kelas tersedia' : 'Kelas hari ini'}
            </p>
            <div className="mt-2 md:mt-3 flex items-center text-[10px] md:text-xs text-blue-600">
              <Target className="h-3 w-3 mr-1" />
              {todayEvents.length === 0 
                ? (session.role === "mahasiswa" ? 'Tidak ada kelas' : 'Tidak ada mengajar')
                : `${todayEvents.length} jadwal aktif`}
            </div>
          </CardContent>
        </Card>

        <Card
          className="card-interactive border-2 border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 group w-full min-w-0 cursor-pointer select-none transition-all duration-200"
          style={{ animationDelay: "0.2s" }}
          onClick={() => handleOpenDialog("subjects")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 md:pb-3 px-4 md:px-6 pt-4 md:pt-6">
            <CardTitle className="text-xs md:text-sm font-bold">
              {session.role === "mahasiswa" ? "Mata Kuliah" : "Mata Kuliah Diampu"}
            </CardTitle>
            <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-green-500 group-hover:scale-125 transition-transform duration-300" />
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
            <div className="text-3xl md:text-4xl font-bold text-green-600 mb-1 md:mb-2">
              {session.role === "mahasiswa" ? userKrsItems.length : taughtSubjects.length}
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">
              {session.role === "mahasiswa" ? 'Mata kuliah diambil' : 'Mata kuliah diampu'}
            </p>
            <div className="mt-2 md:mt-3 flex items-center justify-between gap-2">
              <div className="flex items-center text-[10px] md:text-xs text-green-600">
                <Target className="h-3 w-3 mr-1" />
                {session.role === "mahasiswa" 
                  ? (userKrsItems.length === 0 ? 'Belum ada KRS' : `${userKrsItems.length} mata kuliah`)
                  : (taughtSubjects.length === 0 ? 'Belum mengampu' : `${taughtSubjects.length} mata kuliah aktif`)}
              </div>
              {session.role === "mahasiswa" && userKrsItems.length > 0 && (
                <div className="flex items-center text-[10px] md:text-xs font-semibold text-green-600 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded-full">
                  {userKrsItems.reduce((total, item) => {
                    const subject = getSubjectById(item.subjectId)
                    return total + (subject?.sks || 0)
                  }, 0)} SKS
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card
          className="card-interactive border-2 border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-600 group w-full min-w-0 cursor-pointer select-none transition-all duration-200"
          style={{ animationDelay: "0.3s" }}
          onClick={() => handleOpenDialog("reminders")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 md:pb-3 px-4 md:px-6 pt-4 md:pt-6">
            <CardTitle className="text-xs md:text-sm font-bold">Pengingat Aktif</CardTitle>
            <Clock className="h-5 w-5 md:h-6 md:w-6 text-orange-500 group-hover:scale-125 transition-transform duration-300" />
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
            <div className="text-3xl md:text-4xl font-bold text-orange-600 mb-1 md:mb-2">{activeReminders.length}</div>
            <p className="text-xs md:text-sm text-muted-foreground">Pengingat mendatang</p>
            <div className="mt-2 md:mt-3 flex items-center text-[10px] md:text-xs text-orange-600">
              <AlertCircle className="h-3 w-3 mr-1" />{urgentReminders.length} urgent
            </div>
          </CardContent>
        </Card>

        {/* Tugas/Materi Card - Only show for mahasiswa */}
        {session.role === "mahasiswa" && (
          <Card
            className="card-interactive border-2 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 group w-full min-w-0 cursor-pointer select-none transition-all duration-200"
            style={{ animationDelay: "0.4s" }}
            onClick={() => handleOpenDialog("coursework")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 md:pb-3 px-4 md:px-6 pt-4 md:pt-6">
              <CardTitle className="text-xs md:text-sm font-bold">
                {showAssignments ? "Tugas" : "Materi"}
              </CardTitle>
              {showAssignments ? (
                <ClipboardList className="h-5 w-5 md:h-6 md:w-6 text-purple-500 group-hover:scale-125 transition-transform duration-300" />
              ) : (
                <FilesIcon className="h-5 w-5 md:h-6 md:w-6 text-purple-500 group-hover:scale-125 transition-transform duration-300" />
              )}
            </CardHeader>
            <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
              <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-1 md:mb-2">
                {showAssignments ? allAssignments.length : allMaterials.length}
              </div>
              <p className="text-xs md:text-sm text-muted-foreground">
                {showAssignments ? "Tugas mendatang" : "Materi tersedia"}
              </p>
              <div className="mt-2 md:mt-3 flex items-center justify-between">
                <div className="flex items-center text-[10px] md:text-xs text-purple-600">
                  <Activity className="h-3 w-3 mr-1" />
                  {showAssignments 
                    ? allAssignments.length === 0 ? "Tidak ada tugas" : `${allAssignments.length} belum selesai`
                    : allMaterials.length === 0 ? "Tidak ada materi" : `${allMaterials.length} total materi`
                  }
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-[10px] md:text-xs border-purple-300 text-purple-700 dark:text-purple-300 hover:bg-purple-50 hover:text-purple-900 dark:hover:bg-purple-900/20 dark:hover:text-purple-100 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowAssignments(!showAssignments)
                  }}
                >
                  {showAssignments ? (
                    <>
                      <FilesIcon className="h-3 w-3 mr-1" />
                      Materi
                    </>
                  ) : (
                    <>
                      <ClipboardList className="h-3 w-3 mr-1" />
                      Tugas
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-3 w-full">
        <Card className="glass-effect border-2 border-primary/20 card-interactive w-full min-w-0">
          <CardHeader className="px-3 md:px-6 pt-3 md:pt-6 pb-2 md:pb-4">
            <CardTitle className="flex items-center space-x-2 text-sm md:text-base lg:text-lg">
              <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              <span>Quick Actions</span>
            </CardTitle>
            <CardDescription className="text-[10px] md:text-xs lg:text-sm">Akses cepat ke fitur utama</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5 md:space-y-3 px-3 md:px-6 pb-3 md:pb-6 max-h-[280px] md:max-h-none overflow-y-auto">
            <div className="space-y-1.5 md:space-y-2">
              {quickActions.map((action, index) => (
                <Link key={action.href} href={action.href}>
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-2 md:p-3 lg:p-4 h-auto button-modern border border-primary/10 hover:border-primary/30"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center space-x-2 md:space-x-3">
                      <action.icon className={`h-3.5 w-3.5 md:h-4 md:w-4 lg:h-5 lg:w-5 ${action.color}`} />
                      <span className="font-medium text-xs md:text-sm lg:text-base">{action.title}</span>
                    </div>
                    <ArrowRight className="h-3 w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4" />
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-2 border-primary/20 card-interactive w-full min-w-0">
          <CardHeader className="px-3 md:px-6 pt-3 md:pt-6 pb-2 md:pb-4">
            <CardTitle className="flex items-center space-x-2 text-sm md:text-base lg:text-lg">
              <Activity className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              <span>Recent Activities</span>
            </CardTitle>
            <CardDescription className="text-[10px] md:text-xs lg:text-sm">Aktivitas terbaru Anda</CardDescription>
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
            <div className="space-y-1.5 md:space-y-3 max-h-[280px] overflow-y-auto scrollbar-hide">
              {recentActivities.length === 0 ? (
                <div className="text-center py-4 md:py-6">
                  <p className="text-xs md:text-sm text-muted-foreground">Belum ada aktivitas.</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                    Mulai menambahkan jadwal, KRS, atau pengingat untuk melihat aktivitas Anda di sini.
                  </p>
                </div>
              ) : (
                recentActivities.slice(0, 5).map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-2 md:space-x-3 p-1.5 md:p-2 lg:p-3 rounded-lg hover:bg-muted/50 transition-all duration-200 animate-slide-in-left"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <activity.icon className={`h-3.5 w-3.5 md:h-4 md:w-4 lg:h-5 lg:w-5 mt-0.5 flex-shrink-0 ${activity.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs md:text-sm font-medium truncate">{activity.title}</p>
                      <p className="text-[10px] md:text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-2 border-primary/20 card-interactive w-full min-w-0">
          <CardHeader className="px-3 md:px-6 pt-3 md:pt-6 pb-2 md:pb-4">
            <CardTitle className="flex items-center space-x-2 text-sm md:text-base lg:text-lg">
              <Calendar className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              <span>Today's Schedule</span>
            </CardTitle>
            <CardDescription className="text-[10px] md:text-xs lg:text-sm">Jadwal hari ini</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5 md:space-y-3 px-3 md:px-6 pb-3 md:pb-6 max-h-[280px] md:max-h-none overflow-y-auto">
            {todayEvents.length === 0 ? (
              <div className="text-center py-4 md:py-6">
                <p className="text-xs md:text-sm text-muted-foreground">Tidak ada jadwal hari ini.</p>
                <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                  Tambahkan jadwal kuliah Anda di halaman Jadwal.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 md:space-y-2">
                {todayEvents.slice(0, 5).map((event) => {
                  const subject = event.subjectId ? getSubjectById(event.subjectId) : null
                  const eventColors = getEventColorClasses(event.color || subject?.color)
                  const title = subject?.nama || "Event"
                  
                  return (
                    <div 
                      key={event.id}
                      className={`flex items-center space-x-2 md:space-x-3 p-1.5 md:p-2 lg:p-3 rounded-lg ${eventColors.bg} border ${eventColors.border}`}
                    >
                      <div className={`w-2 h-2 md:w-2.5 md:h-2.5 lg:w-3 lg:h-3 rounded-full flex-shrink-0 ${eventColors.dot} animate-pulse`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs md:text-sm font-medium truncate">{title}</p>
                        <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                          {formatTime(event.startUTC)} - {formatTime(event.endUTC)}
                          {event.location && ` • ${event.location}`}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <Link href="/jadwal">
              <Button className="w-full button-modern text-xs md:text-sm mt-2">
                View Full Schedule
                <ArrowRight className="h-3 w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[calc(100vh-4rem)] animate-dialog-in data-[state=closed]:animate-dialog-out">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 animate-fade-in">
              {dialogType === "schedule" && <Calendar className="h-5 w-5 text-blue-500 animate-scale-in" />}
              {dialogType === "subjects" && <BookOpen className="h-5 w-5 text-green-500 animate-scale-in" />}
              {dialogType === "reminders" && <Clock className="h-5 w-5 text-orange-500 animate-scale-in" />}
              {dialogType === "coursework" && (showAssignments ? 
                <ClipboardList className="h-5 w-5 text-purple-500 animate-scale-in" /> : 
                <FilesIcon className="h-5 w-5 text-purple-500 animate-scale-in" />
              )}
              <span>
                {dialogType === "schedule" && "Jadwal Hari Ini"}
                {dialogType === "subjects" && "Daftar Mata Kuliah"}
                {dialogType === "reminders" && "Daftar Pengingat"}
                {dialogType === "coursework" && (showAssignments ? "Daftar Tugas" : "Daftar Materi")}
              </span>
            </DialogTitle>
            <DialogDescription>
              {dialogType === "schedule" && `${dialogData.length} jadwal tersedia hari ini`}
              {dialogType === "subjects" && session?.role === "mahasiswa" && `${dialogData.length} mata kuliah di KRS Anda`}
              {dialogType === "subjects" && (session?.role === "dosen" || session?.role === "kaprodi") && `${dialogData.length} mata kuliah yang diampu`}
              {dialogType === "reminders" && `${dialogData.length} pengingat aktif`}
              {dialogType === "coursework" && showAssignments && `${dialogData.length} tugas mendatang`}
              {dialogType === "coursework" && !showAssignments && `${dialogData.length} materi tersedia`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            {dialogData.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  {dialogType === "schedule" && "Tidak ada jadwal hari ini"}
                  {dialogType === "subjects" && session?.role === "mahasiswa" && "Belum ada mata kuliah di KRS"}
                  {dialogType === "subjects" && (session?.role === "dosen" || session?.role === "kaprodi") && "Belum mengampu mata kuliah"}
                  {dialogType === "reminders" && "Tidak ada pengingat aktif"}
                  {dialogType === "coursework" && showAssignments && "Tidak ada tugas"}
                  {dialogType === "coursework" && !showAssignments && "Tidak ada materi"}
                </p>
              </div>
            ) : (
              dialogData.map((item, index) => {
                if (dialogType === "schedule") {
                  const eventColors = getEventColorClasses(item.color || item.subject?.color)
                  return (
                    <Link key={item.id} href="/jadwal">
                      <div className={`p-4 rounded-lg border ${eventColors.border} ${eventColors.bg} hover:shadow-md transition-all cursor-pointer`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm mb-1">{item.subject?.nama || "Event"}</h4>
                            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTime(item.startUTC)} - {formatTime(item.endUTC)}
                              </span>
                              {item.location && (
                                <span className="flex items-center gap-1">
                                  <Target className="h-3 w-3" />
                                  {item.location}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className={`w-3 h-3 rounded-full ${eventColors.dot}`} />
                        </div>
                      </div>
                    </Link>
                  )
                }

                if (dialogType === "subjects") {
                  const colorClass = item.color ? `bg-${item.color}-50 border-${item.color}-200 dark:bg-${item.color}-950/20 dark:border-${item.color}-800` : ""
                  return (
                    <Link key={item.krsId || item.id} href="/krs">
                      <div className={`p-4 rounded-lg border hover:shadow-md transition-all cursor-pointer ${colorClass || "bg-muted/50"}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-sm">{item.nama}</h4>
                              <Badge variant="outline" className="text-xs">{item.kode}</Badge>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                              <span>{item.sks} SKS</span>
                              {item.semester && (
                                <>
                                  <span>•</span>
                                  <span>Semester {item.semester}</span>
                                </>
                              )}
                              {item.term && (
                                <>
                                  <span>•</span>
                                  <span>{item.term}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                }

                if (dialogType === "reminders") {
                  const dueDate = new Date(item.dueUTC)
                  const isUrgent = item.dueUTC < Date.now() + 24 * 60 * 60 * 1000
                  return (
                    <Link key={item.id} href="/reminders">
                      <div className={`p-4 rounded-lg border hover:shadow-md transition-all cursor-pointer ${
                        isUrgent 
                          ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800" 
                          : "bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800"
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-sm">{item.title}</h4>
                              {isUrgent && (
                                <Badge variant="destructive" className="text-xs">Urgent</Badge>
                              )}
                            </div>
                            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(dueDate, "dd MMM yyyy HH:mm", { locale: idLocale })}
                              </span>
                              {item.subject && (
                                <span className="flex items-center gap-1">
                                  <BookOpen className="h-3 w-3" />
                                  {item.subject.nama}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                }

                if (dialogType === "coursework") {
                  if (showAssignments) {
                    const dueDate = item.dueUTC ? new Date(item.dueUTC) : null
                    const isUrgent = dueDate && item.dueUTC < Date.now() + 3 * 24 * 60 * 60 * 1000 // 3 days
                    return (
                      <Link key={item.id} href="/asynchronous">
                        <div className={`p-4 rounded-lg border hover:shadow-md transition-all cursor-pointer ${
                          isUrgent 
                            ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800" 
                            : "bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-800"
                        }`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-sm">{item.title}</h4>
                                {isUrgent && (
                                  <Badge variant="destructive" className="text-xs">Deadline Soon</Badge>
                                )}
                              </div>
                              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                {item.subject && (
                                  <span className="flex items-center gap-1">
                                    <BookOpen className="h-3 w-3" />
                                    {item.subject.nama}
                                  </span>
                                )}
                                {dueDate && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Deadline: {format(dueDate, "dd MMM yyyy HH:mm", { locale: idLocale })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  } else {
                    const createdDate = new Date(item.createdAt)
                    return (
                      <Link key={item.id} href="/asynchronous">
                        <div className="p-4 rounded-lg border bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-800 hover:shadow-md transition-all cursor-pointer">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-sm">{item.title}</h4>
                                {item.createdAt > Date.now() - 7 * 24 * 60 * 60 * 1000 && (
                                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">Baru</Badge>
                                )}
                              </div>
                              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                {item.subject && (
                                  <span className="flex items-center gap-1">
                                    <BookOpen className="h-3 w-3" />
                                    {item.subject.nama}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {format(createdDate, "dd MMM yyyy", { locale: idLocale })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  }
                }

                return null
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
