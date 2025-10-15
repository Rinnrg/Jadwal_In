"use client"

import { useSessionStore } from "@/stores/session.store"
import { useProfileStore } from "@/stores/profile.store"
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
} from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"

export default function DashboardPage() {
  const { session } = useSessionStore()
  const { getProfile, profiles } = useProfileStore()
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

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

  if (!session) return null

  const profile = getProfile(session.id)
  const avatarUrl = profile?.avatarUrl || session.image
  const timeColors = getTimeBasedColors()
  const celestialPos = getCelestialPosition()
  const isSunTime = currentTime.getHours() >= 5 && currentTime.getHours() < 18

  const quickActions = [
    { title: "Buat Jadwal", icon: Calendar, href: "/schedule", color: "text-blue-500" },
    { title: "Tambah Mata Kuliah", icon: BookOpen, href: "/subjects", color: "text-green-500" },
    { title: "Lihat KRS", icon: Users, href: "/krs", color: "text-purple-500" },
    { title: "Pengingat", icon: Bell, href: "/reminders", color: "text-orange-500" },
  ]

  const recentActivities = [
    { title: "Jadwal Algoritma ditambahkan", time: "2 jam lalu", icon: CheckCircle, color: "text-green-500" },
    { title: "Reminder tugas diperbarui", time: "4 jam lalu", icon: Bell, color: "text-blue-500" },
    { title: "KRS semester baru dibuka", time: "1 hari lalu", icon: Star, color: "text-yellow-500" },
  ]

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
          <div className="absolute inset-0 bg-gradient-to-r from-background/100 via-background/30 to-transparent dark:from-background/90 dark:via-background/70 dark:to-transparent"></div>
          
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
          
          {/* Celestial body (Sun/Moon) - Positioned in background */}
          <div 
            className="absolute right-8 top-1/2 transition-all duration-500 ease-out z-0"
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
          
          {/* Clouds for daytime - scattered across card */}
          {isSunTime && (
            <div className="absolute inset-0 pointer-events-none z-0">
              <div className="absolute top-12 right-32 w-24 h-10 bg-white/50 dark:bg-gray-400/20 rounded-full blur-sm animate-float"></div>
              <div className="absolute top-24 right-64 w-20 h-8 bg-white/40 dark:bg-gray-400/15 rounded-full blur-sm animate-float" style={{ animationDelay: "0.5s" }}></div>
              <div className="absolute bottom-20 right-48 w-28 h-12 bg-white/45 dark:bg-gray-400/18 rounded-full blur-sm animate-float" style={{ animationDelay: "1s" }}></div>
            </div>
          )}
          
          <CardContent className="pt-6 relative z-10">
            <div className="flex flex-col items-start space-y-3.5">
                {/* Tanggal */}
                <div className="flex items-center space-x-2 text-muted-foreground animate-slide-in-left transition-colors duration-500">
                  <Calendar className="h-4 w-4" />
                  <p className="text-sm md:text-base">
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
                <p className="text-xl md:text-2xl text-muted-foreground transition-colors duration-500">
                  {getGreeting()}
                </p>
                
                {/* Foto Profile - diperbesar */}
                <Avatar className="h-28 w-28 border-4 border-primary/20 shadow-lg animate-scale-in transition-all duration-500">
                  <AvatarImage src={avatarUrl} alt={session.name} />
                  <AvatarFallback className={`text-3xl font-bold bg-gradient-to-br ${timeColors.gradient} text-white transition-all duration-1000`}>
                    {getInitials(session.name)}
                  </AvatarFallback>
                </Avatar>
                
                {/* Nama */}
                <h2 className="text-2xl md:text-3xl font-bold text-foreground animate-slide-in-left transition-colors duration-500">
                  {session.name.split(" (")[0]}
                </h2>
                
                {/* Role & Angkatan Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Role Badge */}
                  <div className={`inline-flex items-center px-3 py-1.5 rounded-full ${timeColors.cardBg} border ${timeColors.cardBorder} animate-slide-in-left transition-all duration-1000`} style={{ animationDelay: "0.1s" }}>
                    <span className={`text-xs font-semibold ${timeColors.text} uppercase tracking-wide transition-colors duration-1000`}>
                      {session.role === "mahasiswa" ? "Mahasiswa" : session.role === "dosen" ? "Dosen" : "Kepala Program Studi"}
                    </span>
                  </div>
                  
                  {/* Angkatan Badge - Only for Mahasiswa */}
                  {session.role === "mahasiswa" && session.name.includes("(Angkatan") && (
                    <div className={`inline-flex items-center px-3 py-1.5 rounded-full ${timeColors.cardBg} border ${timeColors.cardBorder} animate-slide-in-left transition-all duration-1000`} style={{ animationDelay: "0.15s" }}>
                      <span className={`text-xs font-semibold ${timeColors.text} uppercase tracking-wide transition-colors duration-1000`}>
                        {session.name.match(/Angkatan (\d{4})/)?.[0] || ""}
                      </span>
                    </div>
                  )}
                </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className={`grid gap-6 grid-cols-1 sm:grid-cols-2 w-full ${session.role === "mahasiswa" ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
        <Card
          className="card-interactive border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 group w-full min-w-0"
          style={{ animationDelay: "0.1s" }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-bold">Jadwal Hari Ini</CardTitle>
            <Calendar className="h-6 w-6 text-blue-500 group-hover:scale-125 transition-transform duration-300" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-600 mb-2">3</div>
            <p className="text-sm text-muted-foreground">Kelas tersedia</p>
            <div className="mt-3 flex items-center text-xs text-blue-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +2 dari kemarin
            </div>
          </CardContent>
        </Card>

        <Card
          className="card-interactive border-2 border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 group w-full min-w-0"
          style={{ animationDelay: "0.2s" }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-bold">Mata Kuliah</CardTitle>
            <BookOpen className="h-6 w-6 text-green-500 group-hover:scale-125 transition-transform duration-300" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600 mb-2">12</div>
            <p className="text-sm text-muted-foreground">Total mata kuliah</p>
            <div className="mt-3 flex items-center text-xs text-green-600">
              <Target className="h-3 w-3 mr-1" />8 aktif semester ini
            </div>
          </CardContent>
        </Card>

        <Card
          className="card-interactive border-2 border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-600 group w-full min-w-0"
          style={{ animationDelay: "0.3s" }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-bold">Pengingat Aktif</CardTitle>
            <Clock className="h-6 w-6 text-orange-500 group-hover:scale-125 transition-transform duration-300" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-orange-600 mb-2">5</div>
            <p className="text-sm text-muted-foreground">Pengingat mendatang</p>
            <div className="mt-3 flex items-center text-xs text-orange-600">
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
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-bold">IPK</CardTitle>
              <Award className="h-6 w-6 text-purple-500 group-hover:scale-125 transition-transform duration-300" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-purple-600 mb-2">3.85</div>
              <p className="text-sm text-muted-foreground">Indeks Prestasi Kumulatif</p>
              <div className="mt-3 flex items-center text-xs text-purple-600">
                <Activity className="h-3 w-3 mr-1" />
                Excellent performance
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3 w-full">
        <Card className="glass-effect border-2 border-primary/20 card-interactive w-full min-w-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span>Quick Actions</span>
            </CardTitle>
            <CardDescription>Akses cepat ke fitur utama</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action, index) => (
              <Link key={action.href} href={action.href}>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-4 h-auto button-modern border border-primary/10 hover:border-primary/30"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center space-x-3">
                    <action.icon className={`h-5 w-5 ${action.color}`} />
                    <span className="font-medium">{action.title}</span>
                  </div>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-effect border-2 border-primary/20 card-interactive w-full min-w-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-primary" />
              <span>Recent Activities</span>
            </CardTitle>
            <CardDescription>Aktivitas terbaru Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-all duration-200 animate-slide-in-left"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <activity.icon className={`h-5 w-5 mt-0.5 ${activity.color}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-effect border-2 border-primary/20 card-interactive w-full min-w-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span>Today's Schedule</span>
            </CardTitle>
            <CardDescription>Jadwal hari ini</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Algoritma & Struktur Data</p>
                  <p className="text-xs text-muted-foreground">08:00 - 10:00</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Database Systems</p>
                  <p className="text-xs text-muted-foreground">10:30 - 12:30</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Web Development</p>
                  <p className="text-xs text-muted-foreground">14:00 - 16:00</p>
                </div>
              </div>
            </div>
            <Link href="/schedule">
              <Button className="w-full button-modern">
                View Full Schedule
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
