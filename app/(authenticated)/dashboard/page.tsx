"use client"

import { useSessionStore } from "@/stores/session.store"
import { useProfileStore } from "@/stores/profile.store"
import { useActivityStore } from "@/stores/activity.store"
import { useScheduleStore } from "@/stores/schedule.store"
import { useSubjectsStore } from "@/stores/subjects.store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
} from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { id as idLocale } from "date-fns/locale"

export default function DashboardPage() {
  const { session } = useSessionStore()
  const { getProfile, profiles } = useProfileStore()
  const { getActivitiesByUser } = useActivityStore()
  const { getEventsByDay } = useScheduleStore()
  const { getSubjectById } = useSubjectsStore()
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])
  
  // Debug log
  useEffect(() => {
    console.log('[Dashboard] Session state:', session)
  }, [session])

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
  const avatarUrl = profile?.avatarUrl || session.image
  const timeColors = getTimeBasedColors()
  const celestialPos = getCelestialPosition()
  const isSunTime = currentTime.getHours() >= 5 && currentTime.getHours() < 18

  // Get today's schedule
  const currentDayOfWeek = currentTime.getDay()
  const todayEvents = getEventsByDay(session.id, currentDayOfWeek)
  
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

  return (
    <div className="space-y-6 animate-fade-in w-full max-w-none overflow-x-hidden">
      {/* Header Section dengan Ucapan, Profile, Nama, Role, dan Tanggal */}
      <div className="animate-slide-up">
        <Card className={`${timeColors.cardBg} border-2 ${timeColors.cardBorder} transition-all duration-1000 ease-in-out relative overflow-hidden`}>
          {/* Sky Background - Full Card */}
          <div className={`absolute inset-0 bg-gradient-to-b ${
            isSunTime 
              ? 'from-blue-200 via-blue-100 to-blue-50 dark:from-blue-950/40 dark:via-blue-900/30 dark:to-blue-800/20' 
              : 'from-indigo-950 via-indigo-900 to-indigo-800 dark:from-indigo-950/60 dark:via-indigo-900/40 dark:to-indigo-800/30'
          } transition-all duration-1000`}></div>
          
          {/* Fade gradient overlay - gelap di kiri (teks terlihat), terang di kanan (tata surya terlihat) */}
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/40 to-transparent dark:from-background/85 dark:via-background/60 dark:to-transparent md:from-background/100 md:via-background/30 md:dark:from-background/90 md:dark:via-background/70"></div>
          
          {/* Horizon line */}
          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-green-200/40 via-green-100/20 to-transparent dark:from-green-950/30 dark:via-green-900/15 dark:to-transparent"></div>
          
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
          
          {/* Celestial body (Sun/Moon) - Positioned in background, hidden on mobile */}
          <div 
            className="hidden md:block absolute right-8 top-1/2 transition-all duration-500 ease-out z-0"
            style={{
              transform: `translate(${celestialPos.x}%, calc(-50% + ${celestialPos.y}%))`,
            }}
          >
            {isSunTime ? (
              // Sun
              <div className="relative">
                <div 
                  className={`w-32 h-32 lg:w-40 lg:h-40 rounded-full bg-gradient-to-br ${timeColors.gradient} shadow-2xl transition-all duration-1000`}
                  style={{
                    boxShadow: `0 0 60px ${currentTime.getHours() < 11 ? 'rgba(251, 191, 36, 0.7)' : currentTime.getHours() < 15 ? 'rgba(59, 130, 246, 0.6)' : 'rgba(249, 115, 22, 0.8)'}`
                  }}
                ></div>
                {/* Sun rays */}
                <div className="absolute inset-0 animate-spin-slow">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className={`absolute w-2 h-10 lg:w-3 lg:h-12 bg-gradient-to-t ${timeColors.gradient} rounded-full opacity-40`}
                      style={{
                        left: '50%',
                        top: '-2.5rem',
                        transform: `translateX(-50%) rotate(${i * 30}deg)`,
                        transformOrigin: '0.25rem 4rem'
                      }}
                    ></div>
                  ))}
                </div>
              </div>
            ) : (
              // Moon with stars
              <div className="relative">
                <div 
                  className={`w-32 h-32 lg:w-40 lg:h-40 rounded-full bg-gradient-to-br ${timeColors.gradient} shadow-2xl transition-all duration-1000`}
                  style={{
                    boxShadow: '0 0 60px rgba(99, 102, 241, 0.6)'
                  }}
                >
                  {/* Moon craters */}
                  <div className="absolute top-6 left-6 w-5 h-5 rounded-full bg-indigo-600/30"></div>
                  <div className="absolute top-16 left-12 w-6 h-6 rounded-full bg-indigo-600/20"></div>
                  <div className="absolute top-10 right-8 w-4 h-4 rounded-full bg-indigo-600/25"></div>
                  <div className="absolute bottom-8 left-8 w-3 h-3 rounded-full bg-indigo-600/20"></div>
                </div>
                {/* Stars scattered around */}
                <div className="absolute -top-12 -right-16 w-3 h-3 bg-yellow-200 rounded-full animate-twinkle shadow-lg shadow-yellow-200/50"></div>
                <div className="absolute -top-8 -left-20 w-2 h-2 bg-yellow-100 rounded-full animate-twinkle" style={{ animationDelay: "0.3s" }}></div>
                <div className="absolute -bottom-10 -right-20 w-3 h-3 bg-yellow-200 rounded-full animate-twinkle" style={{ animationDelay: "0.6s" }}></div>
                <div className="absolute -bottom-16 left-16 w-2 h-2 bg-yellow-100 rounded-full animate-twinkle" style={{ animationDelay: "0.9s" }}></div>
                <div className="absolute top-20 -left-16 w-2.5 h-2.5 bg-yellow-200 rounded-full animate-twinkle" style={{ animationDelay: "1.2s" }}></div>
                <div className="absolute top-4 right-20 w-2 h-2 bg-yellow-100 rounded-full animate-twinkle" style={{ animationDelay: "1.5s" }}></div>
              </div>
            )}
          </div>
          
          {/* Clouds for daytime - scattered across card, hidden on mobile */}
          {isSunTime && (
            <div className="hidden md:block absolute inset-0 pointer-events-none z-0">
              <div className="absolute top-12 right-32 w-24 h-10 bg-white/50 dark:bg-gray-400/20 rounded-full blur-sm animate-float"></div>
              <div className="absolute top-24 right-64 w-20 h-8 bg-white/40 dark:bg-gray-400/15 rounded-full blur-sm animate-float" style={{ animationDelay: "0.5s" }}></div>
              <div className="absolute bottom-20 right-48 w-28 h-12 bg-white/45 dark:bg-gray-400/18 rounded-full blur-sm animate-float" style={{ animationDelay: "1s" }}></div>
            </div>
          )}
          
          <CardContent className="pt-4 md:pt-6 relative z-10 px-3 md:px-6">
            <div className="flex flex-col items-start space-y-2 md:space-y-3.5 w-full">
                {/* Tanggal */}
                <div className="flex items-center space-x-1.5 md:space-x-2 text-muted-foreground animate-slide-in-left transition-colors duration-500">
                  <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
                  <p className="text-xs md:text-sm break-words">
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
                <p className="text-base md:text-xl lg:text-2xl text-muted-foreground transition-colors duration-500">
                  {getGreeting()}
                </p>
                
                {/* Foto Profile - optimal untuk mobile */}
                <Avatar className="h-16 w-16 md:h-24 md:w-24 lg:h-28 lg:w-28 border-2 md:border-4 border-primary/20 shadow-lg animate-scale-in transition-all duration-500">
                  <AvatarImage src={avatarUrl} alt={session.name} />
                  <AvatarFallback className={`text-lg md:text-2xl lg:text-3xl font-bold bg-gradient-to-br ${timeColors.gradient} text-white transition-all duration-1000`}>
                    {getInitials(session.name)}
                  </AvatarFallback>
                </Avatar>
                
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
          className="card-interactive border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 group w-full min-w-0"
          style={{ animationDelay: "0.1s" }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 md:pb-3 px-4 md:px-6 pt-4 md:pt-6">
            <CardTitle className="text-xs md:text-sm font-bold">Jadwal Hari Ini</CardTitle>
            <Calendar className="h-5 w-5 md:h-6 md:w-6 text-blue-500 group-hover:scale-125 transition-transform duration-300" />
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
            <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-1 md:mb-2">{todayEvents.length}</div>
            <p className="text-xs md:text-sm text-muted-foreground">{todayEvents.length === 1 ? 'Kelas tersedia' : 'Kelas tersedia'}</p>
            <div className="mt-2 md:mt-3 flex items-center text-[10px] md:text-xs text-blue-600">
              <Target className="h-3 w-3 mr-1" />
              {todayEvents.length === 0 ? 'Tidak ada kelas' : `${todayEvents.length} jadwal aktif`}
            </div>
          </CardContent>
        </Card>

        <Card
          className="card-interactive border-2 border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 group w-full min-w-0"
          style={{ animationDelay: "0.2s" }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 md:pb-3 px-4 md:px-6 pt-4 md:pt-6">
            <CardTitle className="text-xs md:text-sm font-bold">Mata Kuliah</CardTitle>
            <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-green-500 group-hover:scale-125 transition-transform duration-300" />
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
            <div className="text-3xl md:text-4xl font-bold text-green-600 mb-1 md:mb-2">12</div>
            <p className="text-xs md:text-sm text-muted-foreground">Total mata kuliah</p>
            <div className="mt-2 md:mt-3 flex items-center text-[10px] md:text-xs text-green-600">
              <Target className="h-3 w-3 mr-1" />8 aktif semester ini
            </div>
          </CardContent>
        </Card>

        <Card
          className="card-interactive border-2 border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-600 group w-full min-w-0"
          style={{ animationDelay: "0.3s" }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 md:pb-3 px-4 md:px-6 pt-4 md:pt-6">
            <CardTitle className="text-xs md:text-sm font-bold">Pengingat Aktif</CardTitle>
            <Clock className="h-5 w-5 md:h-6 md:w-6 text-orange-500 group-hover:scale-125 transition-transform duration-300" />
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
            <div className="text-3xl md:text-4xl font-bold text-orange-600 mb-1 md:mb-2">5</div>
            <p className="text-xs md:text-sm text-muted-foreground">Pengingat mendatang</p>
            <div className="mt-2 md:mt-3 flex items-center text-[10px] md:text-xs text-orange-600">
              <AlertCircle className="h-3 w-3 mr-1" />2 urgent
            </div>
          </CardContent>
        </Card>

        {/* IPK Card - Only show for mahasiswa */}
        {session.role === "mahasiswa" && (
          <Card
            className="card-interactive border-2 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 group w-full min-w-0"
            style={{ animationDelay: "0.4s" }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 md:pb-3 px-4 md:px-6 pt-4 md:pt-6">
              <CardTitle className="text-xs md:text-sm font-bold">IPK</CardTitle>
              <Award className="h-5 w-5 md:h-6 md:w-6 text-purple-500 group-hover:scale-125 transition-transform duration-300" />
            </CardHeader>
            <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
              <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-1 md:mb-2">3.85</div>
              <p className="text-xs md:text-sm text-muted-foreground">Indeks Prestasi Kumulatif</p>
              <div className="mt-2 md:mt-3 flex items-center text-[10px] md:text-xs text-purple-600">
                <Activity className="h-3 w-3 mr-1" />
                Excellent performance
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
          <CardContent className="space-y-1.5 md:space-y-3 px-3 md:px-6 pb-3 md:pb-6 max-h-[280px] md:max-h-none overflow-y-auto">
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
    </div>
  )
}
