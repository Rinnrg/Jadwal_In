import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Syarat dan Ketentuan - Jadwal_In',
  description: 'Syarat dan ketentuan penggunaan aplikasi Jadwal_In',
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/login">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke Login
            </Button>
          </Link>
          
          <div className="flex items-center gap-3 mb-4">
            <Image 
              src="/logo jadwal in.svg" 
              alt="Jadwal-In Logo" 
              width={48} 
              height={48}
              className="w-12 h-12"
            />
            <h1 className="text-3xl font-bold text-blue-600">Jadwal_In</h1>
          </div>
        </div>

        {/* Content */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Syarat dan Ketentuan Layanan</CardTitle>
            <p className="text-sm text-muted-foreground">Terakhir diperbarui: 24 Oktober 2025</p>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Penerimaan Ketentuan</h2>
              <p className="text-muted-foreground">
                Dengan mengakses dan menggunakan aplikasi Jadwal_In ("Layanan"), Anda menyetujui untuk terikat oleh 
                Syarat dan Ketentuan ini. Jika Anda tidak setuju dengan ketentuan ini, mohon untuk tidak menggunakan layanan kami.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Deskripsi Layanan</h2>
              <p className="text-muted-foreground">
                Jadwal_In adalah aplikasi manajemen akademik yang menyediakan fitur-fitur berikut:
              </p>
              <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
                <li>Manajemen jadwal perkuliahan</li>
                <li>Kartu Rencana Studi (KRS)</li>
                <li>Kartu Hasil Studi (KHS)</li>
                <li>Entry nilai dan kehadiran</li>
                <li>Pengelolaan tugas dan pengumpulan</li>
                <li>E-KTM (Kartu Tanda Mahasiswa Digital)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Akun Pengguna</h2>
              <p className="text-muted-foreground mb-2">
                Untuk menggunakan layanan kami, Anda perlu:
              </p>
              <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
                <li>Memberikan informasi yang akurat dan lengkap saat pendaftaran</li>
                <li>Menjaga kerahasiaan kredensial akun Anda</li>
                <li>Bertanggung jawab atas semua aktivitas yang terjadi di akun Anda</li>
                <li>Segera memberi tahu kami jika terjadi penggunaan tidak sah atas akun Anda</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Penggunaan yang Diizinkan</h2>
              <p className="text-muted-foreground mb-2">
                Anda setuju untuk menggunakan layanan kami hanya untuk tujuan yang sah dan akademik. Anda dilarang:
              </p>
              <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
                <li>Menggunakan layanan untuk tujuan ilegal atau tidak sah</li>
                <li>Mengganggu atau merusak layanan atau server</li>
                <li>Mengakses data atau akun pengguna lain tanpa izin</li>
                <li>Mengirim spam, malware, atau konten berbahaya lainnya</li>
                <li>Menyalahgunakan atau memanipulasi data akademik</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Hak Kekayaan Intelektual</h2>
              <p className="text-muted-foreground">
                Semua konten, fitur, dan fungsi layanan (termasuk tetapi tidak terbatas pada teks, grafik, logo, 
                ikon, gambar, klip audio, unduhan digital, kompilasi data, dan perangkat lunak) adalah milik eksklusif 
                Jadwal_In dan dilindungi oleh hukum hak cipta, merek dagang, dan hukum kekayaan intelektual lainnya.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Privasi Data</h2>
              <p className="text-muted-foreground">
                Penggunaan layanan kami juga diatur oleh{' '}
                <Link href="/privacy" className="text-primary hover:underline">
                  Kebijakan Privasi
                </Link>{' '}
                kami. Dengan menggunakan layanan, Anda menyetujui pengumpulan dan penggunaan informasi sesuai dengan kebijakan tersebut.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Batasan Tanggung Jawab</h2>
              <p className="text-muted-foreground">
                Layanan disediakan "sebagaimana adanya" tanpa jaminan apa pun. Kami tidak bertanggung jawab atas:
              </p>
              <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
                <li>Gangguan atau kesalahan dalam layanan</li>
                <li>Kehilangan data atau informasi</li>
                <li>Kerusakan yang timbul dari penggunaan atau ketidakmampuan menggunakan layanan</li>
                <li>Keputusan akademik yang dibuat berdasarkan informasi dari layanan</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Perubahan Layanan</h2>
              <p className="text-muted-foreground">
                Kami berhak untuk mengubah, menangguhkan, atau menghentikan layanan (atau bagian mana pun dari layanan) 
                kapan saja tanpa pemberitahuan sebelumnya. Kami tidak akan bertanggung jawab kepada Anda atau pihak ketiga 
                mana pun atas modifikasi, penundaan, atau penghentian layanan.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Perubahan Ketentuan</h2>
              <p className="text-muted-foreground">
                Kami dapat memperbarui Syarat dan Ketentuan ini dari waktu ke waktu. Kami akan memberi tahu Anda tentang 
                perubahan apa pun dengan memposting Syarat dan Ketentuan baru di halaman ini dan memperbarui tanggal 
                "Terakhir diperbarui" di bagian atas dokumen ini.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Hukum yang Berlaku</h2>
              <p className="text-muted-foreground">
                Syarat dan Ketentuan ini diatur dan ditafsirkan sesuai dengan hukum Republik Indonesia. Setiap perselisihan 
                yang timbul dari ketentuan ini akan diselesaikan di pengadilan yang berwenang di Indonesia.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Hubungi Kami</h2>
              <p className="text-muted-foreground">
                Jika Anda memiliki pertanyaan tentang Syarat dan Ketentuan ini, silakan hubungi kami melalui:
              </p>
              <ul className="list-none text-muted-foreground ml-4 space-y-1">
                <li>Email: support@jadwalin.id</li>
                <li>Website: https://jadwalin.id</li>
              </ul>
            </section>

            <div className="mt-8 pt-6 border-t">
              <p className="text-sm text-muted-foreground text-center">
                Dengan menggunakan Jadwal_In, Anda mengakui bahwa Anda telah membaca, memahami, 
                dan menyetujui untuk terikat oleh Syarat dan Ketentuan ini.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
