"use client";
import { motion } from "framer-motion";
import { Shield, Zap, Heart, Globe } from "lucide-react";

const benefits = [
  {
    title: "Keamanan Tinggi",
    description: "Data akademik Anda dilindungi dengan enkripsi tingkat enterprise dan backup otomatis",
    icon: Shield,
    features: ["Enkripsi End-to-End", "Backup Otomatis", "SSL Certificate", "Privacy Compliance"]
  },
  {
    title: "Performa Cepat",
    description: "Interface yang responsif dan server yang handal memastikan akses cepat kapan saja",
    icon: Zap,
    features: ["Load Time < 2 detik", "99.9% Uptime", "CDN Global", "Cache Optimization"]
  },
  {
    title: "User-Friendly",
    description: "Antarmuka yang intuitif membuat semua fitur mudah digunakan oleh siapa saja",
    icon: Heart,
    features: ["UI/UX Modern", "Mobile Responsive", "Dark/Light Mode", "Accessibility Ready"]
  },
  {
    title: "Akses Universal",
    description: "Dapat diakses dari berbagai perangkat dan platform tanpa batasan",
    icon: Globe,
    features: ["Cross-Platform", "Web-Based", "Multi-Device", "Offline Support"]
  }
];

export default function Benefits() {
  return (
    <div id="benefits" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-base text-primary font-semibold tracking-wide uppercase"
          >
            Keunggulan
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-foreground sm:text-4xl"
          >
            Mengapa Memilih jadwal_in?
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="mt-4 max-w-3xl text-xl text-muted-foreground mx-auto"
          >
            Platform yang dirancang khusus untuk memenuhi kebutuhan institusi pendidikan modern dengan standar kualitas tinggi
          </motion.p>
        </div>

        <div className="mt-20">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative bg-card border border-border rounded-xl p-8 hover:shadow-xl transition-all duration-300 group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary text-primary-foreground group-hover:scale-110 transition-transform duration-300">
                      <benefit.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                      {benefit.title}
                    </h3>
                  </div>
                  
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {benefit.description}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {benefit.features.map((feature, featureIndex) => (
                      <motion.div
                        key={feature}
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: (index * 0.1) + (featureIndex * 0.05) }}
                        viewport={{ once: true }}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span className="text-muted-foreground">{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
