"use client";
import { motion } from "framer-motion";
import { BookOpen, Calendar, BarChart3, Users } from "lucide-react";

const features = [
  {
    name: "Manajemen Jadwal",
    description: "Kelola jadwal perkuliahan dengan mudah dan efisien untuk semua mata kuliah.",
    icon: Calendar,
  },
  {
    name: "Sistem KRS",
    description: "Proses Kartu Rencana Studi yang terintegrasi dengan sistem akademik.",
    icon: BookOpen,
  },
  {
    name: "Monitoring Kehadiran",
    description: "Pantau kehadiran mahasiswa dalam perkuliahan secara real-time.",
    icon: BarChart3,
  },
  {
    name: "Multi-Role Access",
    description: "Akses untuk mahasiswa, dosen, dan kaprodi dengan fitur yang disesuaikan.",
    icon: Users,
  },
];

export default function Features() {
  return (
    <div id="features" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-base text-primary font-semibold tracking-wide uppercase"
          >
            Fitur Utama
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="mt-2 text-2xl sm:text-3xl md:text-4xl leading-7 sm:leading-8 font-extrabold tracking-tight text-foreground"
          >
            Solusi Lengkap Manajemen Akademik
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="mt-4 max-w-2xl text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground lg:mx-auto"
          >
            Platform terintegrasi yang memudahkan pengelolaan jadwal, KRS, dan kehadiran untuk seluruh civitas akademika.
          </motion.p>
        </div>

        <div className="mt-20">
          <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
            {features.map((feature, index) => (
              <motion.div
                key={feature.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative"
              >
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary text-primary-foreground">
                    <feature.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className="ml-16 text-base sm:text-lg leading-6 font-medium text-foreground">
                    {feature.name}
                  </p>
                </dt>
                <dd className="mt-2 ml-16 text-sm sm:text-base text-muted-foreground">
                  {feature.description}
                </dd>
              </motion.div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
