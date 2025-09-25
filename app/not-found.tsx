import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileQuestion, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <FileQuestion className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-xl">Halaman Tidak Ditemukan</CardTitle>
          <CardDescription>
            Maaf, halaman yang Anda cari tidak dapat ditemukan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/">
            <Button className="w-full">
              <Home className="mr-2 h-4 w-4" />
              Kembali ke Beranda
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
