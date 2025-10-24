import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Kebijakan Privasi - Jadwal_In',
  description: 'Kebijakan privasi aplikasi Jadwal_In',
}

export default function PrivacyPolicyPage() {
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
            <CardTitle className="text-2xl">Kebijakan Privasi</CardTitle>
            <p className="text-sm text-muted-foreground">Terakhir diperbarui: 24 Oktober 2025</p>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Pendahuluan</h2>
              <p className="text-muted-foreground">
                Jadwal_In ("kami", "kami", atau "milik kami") berkomitmen untuk melindungi privasi Anda. 
                Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, mengungkapkan, 
                dan melindungi informasi pribadi Anda saat Anda menggunakan aplikasi Jadwal_In ("Layanan").
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Informasi yang Kami Kumpulkan</h2>
              
              <h3 className="text-lg font-semibold mb-2 mt-4">2.1 Informasi yang Anda Berikan</h3>
              <p className="text-muted-foreground mb-2">Kami mengumpulkan informasi yang Anda berikan secara langsung, termasuk:</p>
              <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
                <li>Nama lengkap</li>
                <li>Nomor Induk Mahasiswa (NIM)</li>
                <li>Alamat email</li>
                <li>Password (disimpan dalam bentuk terenkripsi)</li>
                <li>Nomor telepon</li>
                <li>Program studi dan fakultas</li>
                <li>Foto profil (opsional)</li>
              </ul>

              <h3 className="text-lg font-semibold mb-2 mt-4">2.2 Informasi Akademik</h3>
              <p className="text-muted-foreground mb-2">Kami mengumpulkan dan memproses informasi akademik Anda, termasuk:</p>
              <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
                <li>Jadwal perkuliahan</li>
                <li>Mata kuliah yang diambil (KRS)</li>
                <li>Nilai dan transkrip (KHS)</li>
                <li>Data kehadiran</li>
                <li>Tugas dan pengumpulan tugas</li>
                <li>Informasi dosen dan mata kuliah</li>
              </ul>

              <h3 className="text-lg font-semibold mb-2 mt-4">2.3 Informasi dari Google OAuth</h3>
              <p className="text-muted-foreground mb-2">
                Ketika Anda masuk menggunakan Google, kami menerima informasi berikut dari Google:
              </p>
              <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
                <li>Nama lengkap Anda</li>
                <li>Alamat email Google Anda</li>
                <li>Foto profil Google Anda</li>
                <li>ID pengguna Google Anda</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                Kami hanya meminta izin minimal yang diperlukan dan tidak mengakses data Google lainnya seperti 
                Gmail, Google Drive, atau kalender Anda.
              </p>

              <h3 className="text-lg font-semibold mb-2 mt-4">2.4 Informasi Teknis</h3>
              <p className="text-muted-foreground mb-2">Kami secara otomatis mengumpulkan informasi tertentu, termasuk:</p>
              <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
                <li>Alamat IP</li>
                <li>Jenis browser dan perangkat</li>
                <li>Sistem operasi</li>
                <li>Waktu akses dan aktivitas penggunaan</li>
                <li>Log error dan diagnostik</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Cara Kami Menggunakan Informasi Anda</h2>
              <p className="text-muted-foreground mb-2">Kami menggunakan informasi yang dikumpulkan untuk:</p>
              <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
                <li>Menyediakan, mengoperasikan, dan memelihara layanan kami</li>
                <li>Mengelola akun dan autentikasi pengguna</li>
                <li>Memproses data akademik dan menampilkan informasi yang relevan</li>
                <li>Mengirim notifikasi penting terkait jadwal, tugas, dan aktivitas akademik</li>
                <li>Meningkatkan dan mengoptimalkan pengalaman pengguna</li>
                <li>Menganalisis penggunaan layanan untuk pengembangan fitur baru</li>
                <li>Mendeteksi, mencegah, dan mengatasi masalah teknis atau keamanan</li>
                <li>Mematuhi kewajiban hukum</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Berbagi Informasi</h2>
              <p className="text-muted-foreground mb-2">
                Kami tidak menjual, menyewakan, atau membagikan informasi pribadi Anda kepada pihak ketiga, kecuali:
              </p>
              <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
                <li>Dengan persetujuan eksplisit Anda</li>
                <li>Untuk mematuhi kewajiban hukum atau proses hukum</li>
                <li>Untuk melindungi hak, properti, atau keamanan kami dan pengguna lain</li>
                <li>Dengan institusi pendidikan yang berafiliasi untuk tujuan akademik</li>
                <li>Dengan penyedia layanan pihak ketiga yang membantu operasional kami (seperti hosting, analitik) 
                    yang terikat oleh kewajiban kerahasiaan</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Keamanan Data</h2>
              <p className="text-muted-foreground mb-2">
                Kami menerapkan langkah-langkah keamanan yang sesuai untuk melindungi informasi Anda:
              </p>
              <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
                <li>Enkripsi data saat transit menggunakan HTTPS/TLS</li>
                <li>Penyimpanan password dalam bentuk hash menggunakan algoritma bcrypt</li>
                <li>Kontrol akses berbasis peran (Role-Based Access Control)</li>
                <li>Pemantauan keamanan dan audit log secara berkala</li>
                <li>Backup data secara teratur</li>
                <li>Autentikasi dua faktor melalui Google OAuth</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                Namun, perlu diingat bahwa tidak ada metode transmisi data melalui internet atau metode penyimpanan 
                elektronik yang 100% aman.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Penyimpanan Data</h2>
              <p className="text-muted-foreground">
                Kami menyimpan informasi pribadi Anda selama akun Anda aktif atau selama diperlukan untuk memberikan 
                layanan kepada Anda. Kami juga dapat menyimpan dan menggunakan informasi Anda untuk mematuhi kewajiban 
                hukum, menyelesaikan perselisihan, dan menegakkan perjanjian kami.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Hak Anda</h2>
              <p className="text-muted-foreground mb-2">Anda memiliki hak untuk:</p>
              <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
                <li>Mengakses informasi pribadi yang kami miliki tentang Anda</li>
                <li>Memperbarui atau mengoreksi informasi Anda</li>
                <li>Menghapus akun dan data Anda</li>
                <li>Menolak pemrosesan data tertentu</li>
                <li>Meminta salinan data Anda dalam format yang dapat dibaca mesin</li>
                <li>Mencabut persetujuan Anda untuk pemrosesan data</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                Untuk menggunakan hak-hak ini, silakan hubungi kami melalui informasi kontak yang tercantum di bawah.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Cookie dan Teknologi Pelacakan</h2>
              <p className="text-muted-foreground">
                Kami menggunakan cookie dan teknologi pelacakan serupa untuk meningkatkan pengalaman Anda, 
                mengingat preferensi Anda, dan menganalisis penggunaan layanan. Anda dapat mengontrol cookie 
                melalui pengaturan browser Anda, namun menonaktifkan cookie dapat mempengaruhi fungsionalitas 
                layanan.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Layanan Pihak Ketiga</h2>
              <p className="text-muted-foreground mb-2">
                Layanan kami mengintegrasikan dengan layanan pihak ketiga berikut:
              </p>
              <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
                <li><strong>Google OAuth 2.0:</strong> Untuk autentikasi pengguna</li>
                <li><strong>Vercel:</strong> Untuk hosting aplikasi</li>
                <li><strong>PostgreSQL (Neon/Supabase):</strong> Untuk penyimpanan database</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                Layanan pihak ketiga ini memiliki kebijakan privasi mereka sendiri. Kami mendorong Anda untuk 
                membaca kebijakan privasi mereka.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Privasi Anak-anak</h2>
              <p className="text-muted-foreground">
                Layanan kami ditujukan untuk mahasiswa dan staf akademik. Kami tidak secara sengaja mengumpulkan 
                informasi pribadi dari anak-anak di bawah usia 13 tahun. Jika Anda adalah orang tua atau wali dan 
                mengetahui bahwa anak Anda telah memberikan informasi pribadi kepada kami, silakan hubungi kami.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Perubahan Kebijakan Privasi</h2>
              <p className="text-muted-foreground">
                Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Kami akan memberi tahu Anda tentang 
                perubahan dengan memposting kebijakan baru di halaman ini dan memperbarui tanggal "Terakhir diperbarui". 
                Perubahan signifikan akan diberitahukan melalui email atau notifikasi dalam aplikasi.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">12. Yurisdiksi</h2>
              <p className="text-muted-foreground">
                Layanan kami dioperasikan di Indonesia dan tunduk pada hukum Republik Indonesia, termasuk 
                Undang-Undang Nomor 27 Tahun 2022 tentang Perlindungan Data Pribadi.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">13. Hubungi Kami</h2>
              <p className="text-muted-foreground mb-2">
                Jika Anda memiliki pertanyaan, kekhawatiran, atau permintaan terkait Kebijakan Privasi ini, 
                silakan hubungi kami:
              </p>
              <ul className="list-none text-muted-foreground ml-4 space-y-1">
                <li><strong>Email:</strong> privacy@jadwalin.id</li>
                <li><strong>Email Dukungan:</strong> support@jadwalin.id</li>
                <li><strong>Website:</strong> https://jadwalin.id</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">14. Persetujuan</h2>
              <p className="text-muted-foreground">
                Dengan menggunakan layanan Jadwal_In, Anda menyetujui pengumpulan dan penggunaan informasi 
                sesuai dengan Kebijakan Privasi ini.
              </p>
            </section>

            <div className="mt-8 pt-6 border-t">
              <p className="text-sm text-muted-foreground text-center">
                Kami berkomitmen untuk menjaga privasi dan keamanan data Anda. 
                Terima kasih atas kepercayaan Anda kepada Jadwal_In.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
