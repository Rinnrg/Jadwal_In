"use client";
import { motion } from "framer-motion";

export default function About() {
  return (
    <div id="about" className="py-24 bg-muted/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-base text-primary font-semibold tracking-wide uppercase"
          >
            Tentang Jadwal.in
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-foreground sm:text-4xl"
          >
            Digitalisasi Sistem Akademik Modern
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="mt-4 max-w-3xl text-xl text-muted-foreground lg:mx-auto"
          >
            Jadwal.in hadir sebagai solusi komprehensif untuk mengatasi tantangan dalam pengelolaan jadwal akademik. 
            Dengan antarmuka yang intuitif dan fitur yang lengkap, kami membantu institusi pendidikan meningkatkan 
            efisiensi administrasi akademik dan memberikan pengalaman terbaik bagi mahasiswa, dosen, dan staf akademik.
          </motion.p>
        </div>

        <div className="mt-20">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-4xl font-bold text-primary">1000+</div>
              <div className="mt-2 text-lg font-medium text-foreground">Mahasiswa Aktif</div>
              <div className="mt-1 text-sm text-muted-foreground">Menggunakan sistem kami</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-4xl font-bold text-primary">50+</div>
              <div className="mt-2 text-lg font-medium text-foreground">Dosen</div>
              <div className="mt-1 text-sm text-muted-foreground">Terdaftar dalam sistem</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-4xl font-bold text-primary">99%</div>
              <div className="mt-2 text-lg font-medium text-foreground">Uptime</div>
              <div className="mt-1 text-sm text-muted-foreground">Keandalan sistem</div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
