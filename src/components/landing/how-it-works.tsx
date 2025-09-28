"use client";
import { motion } from "framer-motion";
import { CheckCircle, Clock, Bell, Smartphone } from "lucide-react";

const steps = [
  {
    title: "Daftar & Login",
    description: "Mahasiswa, dosen, dan kaprodi daftar dengan akun institusi mereka",
    icon: CheckCircle,
    color: "from-green-400 to-green-600"
  },
  {
    title: "Atur Jadwal",
    description: "Sistem mengatur jadwal perkuliahan secara otomatis dan dapat disesuaikan",
    icon: Clock,
    color: "from-blue-400 to-blue-600"
  },
  {
    title: "Notifikasi Real-time",
    description: "Dapatkan reminder dan notifikasi penting langsung ke perangkat Anda",
    icon: Bell,
    color: "from-yellow-400 to-yellow-600"
  },
  {
    title: "Akses Mobile",
    description: "Akses sistem kapan saja, di mana saja melalui web responsif",
    icon: Smartphone,
    color: "from-purple-400 to-purple-600"
  }
];

export default function HowItWorks() {
  return (
    <div id="how-it-works" className="py-24 bg-gradient-to-br ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-base text-primary font-semibold tracking-wide uppercase"
          >
            Cara Kerja
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-foreground sm:text-4xl"
          >
            Mudah Digunakan dalam 4 Langkah
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="mt-4 max-w-2xl text-xl text-muted-foreground mx-auto"
          >
            Proses yang sederhana namun powerful untuk mengelola seluruh aktivitas akademik Anda
          </motion.p>
        </div>

        <div className="mt-20">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative text-center group"
              >
                <div className="relative">
                  <div className={`mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${step.color} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <step.icon className="w-8 h-8" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                </div>
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-base text-muted-foreground">
                    {step.description}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-muted via-muted-foreground/20 to-transparent transform -translate-x-8" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
