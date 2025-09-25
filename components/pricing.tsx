"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { motion } from "framer-motion";
import { CheckIcon } from "@radix-ui/react-icons";

export default function Pricing() {
  const plans = [
    {
      name: "Mahasiswa",
      desc: "Akses penuh untuk mahasiswa",
      price: "Gratis",
      isMostPop: false,
      features: [
        "Melihat jadwal perkuliahan",
        "Mengisi KRS online",
        "Monitoring kehadiran",
        "Notifikasi jadwal",
        "Akses mobile app",
      ],
    },
    {
      name: "Dosen",
      desc: "Fitur lengkap untuk pengajar",
      price: "Gratis",
      isMostPop: true,
      features: [
        "Semua fitur mahasiswa",
        "Mengelola kelas",
        "Input nilai dan kehadiran",
        "Laporan akademik",
        "Komunikasi dengan mahasiswa",
        "Dashboard analytics",
      ],
    },
    {
      name: "Kaprodi/Admin",
      desc: "Kontrol penuh sistem akademik",
      price: "Gratis",
      isMostPop: false,
      features: [
        "Semua fitur dosen",
        "Mengelola kurikulum",
        "Monitoring program studi",
        "Laporan comprehensive",
        "User management",
        "System configuration",
      ],
    },
  ];

  return (
    <section
      id="pricing"
      className="w-full max-w-7xl mx-auto px-4 py-24 md:px-6"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center mb-16 flex flex-col gap-3"
      >
        <h2 className="text-xl font-semibold sm:text-2xl bg-linear-to-b from-foreground to-muted-foreground text-transparent bg-clip-text">
          Fitur untuk Setiap Peran
        </h2>
        <p className="mx-auto max-w-xl text-muted-foreground text-center">
          Akses fitur yang disesuaikan dengan peran Anda dalam sistem akademik.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.name}
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className={`relative ${plan.isMostPop ? "scale-105" : ""}`}
          >
            <Card
              className={`relative h-full ${
                plan.isMostPop ? "border-2 border-primary shadow-xl" : ""
              }`}
            >
              {plan.isMostPop && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-card border-2 border-primary px-4 py-1 rounded-full text-sm font-medium">
                    Terpopuler
                  </span>
                </div>
              )}

              <CardContent className="p-6 pt-8">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {plan.desc}
                  </p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold">{plan.price}</span>
                  </div>
                </div>

                <Separator className="my-6" />

                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className="flex items-center text-sm"
                    >
                      <CheckIcon className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="p-6 pt-0">
                <Button
                  className="w-full"
                  variant={plan.isMostPop ? "default" : "outline"}
                  size="lg"
                >
                  Mulai Sekarang
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
