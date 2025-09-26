"use client"

import { useSessionStore } from "@/stores/session.store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (!session) return null

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
      <div className="animate-slide-up">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-4xl font-bold tracking-tight gradient-primary bg-clip-text text-transparent animate-float">
              Dashboard
            </h1>
            <p className="text-muted-foreground text-lg mt-1 animate-slide-in-left" style={{ animationDelay: "0.1s" }}>
              Selamat datang kembali, {session.name}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5 animate-slide-in-left" style={{ animationDelay: "0.2s" }}>
              {currentTime.toLocaleDateString("id-ID", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}{" "}
              - {currentTime.toLocaleTimeString("id-ID")}
            </p>
          </div>
        </div>
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
