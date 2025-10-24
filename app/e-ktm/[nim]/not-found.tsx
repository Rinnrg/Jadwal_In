import Link from "next/link"
import { AlertCircle, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          E-KTM Tidak Ditemukan
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Mohon maaf, E-KTM dengan NIM yang Anda scan tidak ditemukan dalam sistem.
        </p>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2 text-sm">
            Kemungkinan Penyebab:
          </h3>
          <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1 list-disc list-inside">
            <li>NIM belum terdaftar di sistem</li>
            <li>Profil mahasiswa belum lengkap</li>
            <li>QR Code sudah kadaluarsa atau tidak valid</li>
            <li>Data sedang dalam proses sinkronisasi</li>
          </ul>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Silakan hubungi admin atau lengkapi profil Anda terlebih dahulu.
          </p>
          
          <Button asChild className="w-full">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Kembali ke Beranda
            </Link>
          </Button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Universitas Negeri Surabaya
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
            Sistem E-KTM Digital
          </p>
        </div>
      </Card>
    </div>
  )
}
