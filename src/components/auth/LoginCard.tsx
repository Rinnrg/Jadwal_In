"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSessionStore } from "@/stores/session.store"
import { useUsersStore } from "@/stores/users.store"
import { showError } from "@/lib/alerts"
import { Check, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle } from "lucide-react"
import { ButtonLoading } from "@/components/ui/loading"

const loginSchema = z.object({
  email: z.string()
    .email("Format email tidak valid")
    .refine((email) => {
      // Allow super admin email
      if (email === "gacor@unesa.ac.id") return true
      // Check regular format for other users
      return /^[a-zA-Z]+\.\d{5}@(mhs|dsn|kpd)\.[a-zA-Z]+\.ac\.id$/.test(email)
    }, "Email harus dari instansi anda"),
  password: z.string().min(1, "Kata sandi wajib diisi"),
})

type LoginForm = z.infer<typeof loginSchema>

// Function to determine role from email
const getRoleFromEmail = (email: string): "kaprodi" | "dosen" | "mahasiswa" | "super_admin" | null => {
  // Check for super admin email
  if (email === "gacor@unesa.ac.id") {
    return "super_admin"
  }
  
  const emailParts = email.split('@')
  if (emailParts.length < 2) return null
  
  const domain = emailParts[1].toLowerCase()
  const roleCode = domain.split('.')[0]
  
  switch (roleCode) {
    case 'mhs':
      return 'mahasiswa'
    case 'dsn':
      return 'dosen'
    case 'kpd':
      return 'kaprodi'
    default:
      return null
  }
}

// Function to generate user name from email
const generateNameFromEmail = (email: string, role: string): string => {
  // Super admin has a special name
  if (role === 'super_admin') {
    return 'Super Administrator'
  }
  
  const emailParts = email.split('@')[0]
  const [nama, nim] = emailParts.split('.')
  
  // Capitalize first letter of each word in nama
  const formattedNama = nama.split(/(?=[A-Z])/).map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ')
  
  // Extract angkatan from first 2 digits of NIM for mahasiswa
  if (role === 'mahasiswa' && nim && nim.length >= 2) {
    const yearPrefix = nim.substring(0, 2)
    const angkatan = 2000 + parseInt(yearPrefix)
    return `${formattedNama} (Angkatan ${angkatan})`
  }
  
  // For dosen and kaprodi, just return the name
  return formattedNama
}

export function LoginCard() {
  const router = useRouter()
  const { setSession } = useSessionStore()
  const { users } = useUsersStore()
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  })

  // Check if email is valid
  const isEmailValid = form.watch("email") && !form.formState.errors.email && form.formState.touchedFields.email

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Check if user exists in users store
      const existingUser = users.find(u => u.email === data.email)
      
      let user
      
      if (existingUser) {
        // User exists in store - use stored data
        // For super admin, validate password
        if (existingUser.role === 'super_admin') {
          if (data.password !== 'gacorkang') {
            setIsLoading(false)
            showError("Password super admin salah.")
            return
          }
        }
        // For other users, validate password if stored
        else if (existingUser.password && existingUser.password !== data.password) {
          setIsLoading(false)
          showError("Password salah.")
          return
        }
        
        user = {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role,
        }
      } else {
        // User doesn't exist - auto-register from email
        const role = getRoleFromEmail(data.email)
        
        if (!role) {
          setIsLoading(false)
          showError("Format email tidak dikenali.")
          return
        }

        user = {
          id: Date.now().toString(),
          email: data.email,
          name: generateNameFromEmail(data.email, role),
          role: role,
        }
      }

      // Show success animation
      setShowSuccess(true)

      // Set session after animation
      setTimeout(() => {
        // Set auth cookie for middleware
        document.cookie = "jadwalin-auth=true; path=/; max-age=86400" // 24 hours
        
        setSession({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        })
        router.push("/dashboard")
        setIsLoading(false)
      }, 1000)
    } catch (error) {
      showError("Terjadi kesalahan saat login")
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="bg-card border-2 border-primary/20 shadow-2xl">
        <CardHeader className="text-center pb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
                <Image 
                  src="/logo jadwal in.svg" 
                  alt="jadwal_in Logo" 
                  width={40} 
                  height={40}
                  className="w-10 h-10 object-contain animate-pulse"
                />
              <div className="absolute inset-0 bg-primary/10 rounded-2xl blur-xl animate-pulse" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-foreground mb-2">Jadwal_in</CardTitle>
          <CardDescription className="text-muted-foreground text-lg">Sistem Manajemen Jadwal Akademik</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium">
                Alamat Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="masukkan email anda"
                  aria-describedby="email-error"
                  aria-invalid={!!form.formState.errors.email}
                  className={`
                    pl-10 pr-12 h-12 bg-input border-border text-foreground placeholder:text-muted-foreground
                    focus:bg-background transition-all duration-300 rounded-xl
                    ${isEmailValid 
                      ? 'border-green-500 focus:border-green-500 bg-green-50 dark:bg-green-950/20' 
                      : form.formState.errors.email 
                        ? 'border-destructive focus:border-destructive' 
                        : 'focus:border-primary/40'
                    }
                  `}
                  {...form.register("email")}
                  disabled={isLoading}
                />
                {isEmailValid && (
                  <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                )}
              </div>
              {form.formState.errors.email && (
                <p id="email-error" className="text-sm text-destructive" role="alert">
                  {form.formState.errors.email.message}
                </p>
              )}
              {isEmailValid && (
                <p className="text-sm text-green-600 dark:text-green-400 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Format email valid
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">
                Kata Sandi
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  aria-describedby="password-error"
                  aria-invalid={!!form.formState.errors.password}
                  className="
                    pl-10 pr-12 h-12 bg-input border-border text-foreground placeholder:text-muted-foreground
                    focus:bg-background focus:border-primary/40 transition-all duration-300
                    rounded-xl
                  "
                  {...form.register("password")}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p id="password-error" className="text-sm text-destructive" role="alert">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="
                w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90
                font-semibold rounded-xl transition-all duration-300
                hover:scale-105 hover:shadow-xl transform
              "
              disabled={isLoading}
              aria-busy={isLoading}
            >
              {showSuccess ? (
                <div className="flex items-center">
                  <Check className="h-5 w-5 mr-2" />
                  Berhasil Masuk!
                </div>
              ) : (
                <ButtonLoading isLoading={isLoading} loadingText="Memverifikasi...">
                  <div className="flex items-center">
                    Masuk ke Dashboard
                    <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </ButtonLoading>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
