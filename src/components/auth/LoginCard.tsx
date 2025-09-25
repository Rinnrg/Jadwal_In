"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSessionStore } from "@/stores/session.store"
import { showError } from "@/lib/alerts"
import { Check, Sparkles, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react"
import { ButtonLoading } from "@/components/ui/loading"

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid. Contoh: nama@univ.ac.id"),
  password: z.string().min(1, "Kata sandi wajib diisi"),
})

type LoginForm = z.infer<typeof loginSchema>

// Mock users for demo
const mockUsers = [
  { id: "1", email: "kaprodi@univ.ac.id", password: "kaprodi123", name: "Dr. Ahmad Kaprodi", role: "kaprodi" as const },
  { id: "2", email: "dosen@univ.ac.id", password: "dosen123", name: "Prof. Budi Dosen", role: "dosen" as const },
  { id: "3", email: "mahasiswa1@univ.ac.id", password: "mhs123", name: "Siti Mahasiswa", role: "mahasiswa" as const },
  { id: "4", email: "mahasiswa2@univ.ac.id", password: "mhs123", name: "Andi Mahasiswa", role: "mahasiswa" as const },
]

export function LoginCard() {
  const router = useRouter()
  const { setSession } = useSessionStore()
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Find user
      const user = mockUsers.find((u) => u.email === data.email && u.password === data.password)

      if (!user) {
        showError("Email atau kata sandi salah")
        return
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
      }, 1000)
    } catch (error) {
      showError("Terjadi kesalahan saat login")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="bg-card border-2 border-primary/20 shadow-2xl">
        <CardHeader className="text-center pb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <div className="absolute inset-0 bg-primary/10 rounded-2xl blur-xl animate-pulse" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-foreground mb-2">Jadwal.in</CardTitle>
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
                  placeholder="nama@univ.ac.id"
                  aria-describedby="email-error"
                  aria-invalid={!!form.formState.errors.email}
                  className="
                    pl-10 h-12 bg-input border-border text-foreground placeholder:text-muted-foreground
                    focus:bg-background focus:border-primary/40 transition-all duration-300
                    rounded-xl
                  "
                  {...form.register("email")}
                  disabled={isLoading}
                />
              </div>
              {form.formState.errors.email && (
                <p id="email-error" className="text-sm text-destructive" role="alert">
                  {form.formState.errors.email.message}
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
                  placeholder="Masukkan kata sandi"
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

          <div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-card text-muted-foreground">Akun Demo</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-muted/50 rounded-xl border border-border">
              <div className="space-y-3 text-sm">
                {mockUsers.slice(0, 3).map((user, index) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      form.setValue("email", user.email)
                      form.setValue("password", user.password)
                    }}
                    className="
                      w-full text-left p-3 rounded-lg bg-background hover:bg-muted
                      border border-border hover:border-primary/20
                      transition-all duration-200 hover:scale-105
                      group focus:outline-none focus:ring-2 focus:ring-primary/20
                    "
                    aria-label={`Gunakan akun demo ${user.role}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground capitalize">{user.role}</p>
                        <p className="text-muted-foreground text-xs">{user.email}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
