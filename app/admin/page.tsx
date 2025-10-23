import { AdminLoginCard } from "@/src/components/auth/AdminLoginCard"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500/20 via-orange-500/20 to-red-600/30">
      <div className="absolute top-4 left-4 z-20">
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          <Link href="/" className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Beranda
          </Link>
        </Button>
      </div>
      <div className="relative z-10 min-h-screen grid place-items-center p-4">
        <AdminLoginCard />
      </div>
    </div>
  )
}
