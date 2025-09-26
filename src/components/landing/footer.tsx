import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-background border-t">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center space-x-2 font-light tracking-tighter text-2xl">
              <Image 
                src="/logo jadwal in.svg" 
                alt="Jadwal.in Logo" 
                width={32} 
                height={32}
                className="w-8 h-8 object-contain"
              />
              <span>Jadwal.in</span>
            </Link>
            <p className="mt-4 text-muted-foreground max-w-md">
              Platform manajemen jadwal akademik yang memudahkan mahasiswa, dosen, dan kaprodi 
              dalam mengelola aktivitas perkuliahan.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">
              Fitur
            </h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link href="#" className="text-base text-muted-foreground hover:text-foreground">
                  Manajemen Jadwal
                </Link>
              </li>
              <li>
                <Link href="#" className="text-base text-muted-foreground hover:text-foreground">
                  Sistem KRS
                </Link>
              </li>
              <li>
                <Link href="#" className="text-base text-muted-foreground hover:text-foreground">
                  Kehadiran
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">
              Bantuan
            </h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link href="#" className="text-base text-muted-foreground hover:text-foreground">
                  Dokumentasi
                </Link>
              </li>
              <li>
                <Link href="#" className="text-base text-muted-foreground hover:text-foreground">
                  Dukungan
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-base text-muted-foreground hover:text-foreground">
                  Login
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 border-t border-border pt-8">
          <p className="text-base text-muted-foreground text-center">
            © 2024 Jadwal.in. Semua hak dilindungi.
          </p>
        </div>
      </div>
    </footer>
  );
}
