"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full bg-card">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-8"
        >
          <div className="col-span-1 md:col-span-2">
            <Link
              href="/"
              className="flex items-center space-x-2 text-2xl font-medium hover:opacity-80 transition-opacity"
            >
              <Image 
                src="/logo jadwal in.svg" 
                alt="Jadwal.in Logo" 
                width={32} 
                height={32}
                className="w-8 h-8 object-contain"
              />
              <span>Jadwal.in</span>
            </Link>
            <p className="text-muted-foreground mt-4 max-w-md">
              Platform manajemen jadwal akademik yang memudahkan mahasiswa, dosen, dan kaprodi dalam mengelola aktivitas perkuliahan.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Fitur</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#pricing" className="hover:text-foreground transition-colors">
                  Manajemen Jadwal
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="hover:text-foreground transition-colors">
                  Sistem KRS
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="hover:text-foreground transition-colors">
                  Monitoring Kehadiran
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="hover:text-foreground transition-colors">
                  Laporan Akademik
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Bantuan</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#" className="hover:text-foreground transition-colors">
                  Dokumentasi
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground transition-colors">
                  Support
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-foreground transition-colors">
                  Login
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground transition-colors">
                  Kontak
                </Link>
              </li>
            </ul>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="border-t border-border mt-8 pt-8 text-center"
        >
          <div className="text-sm text-muted-foreground">
            © {year} Jadwal.in. Semua hak dilindungi.
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
