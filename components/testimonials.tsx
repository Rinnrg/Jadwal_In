"use client";
import { motion } from "framer-motion";

export default function Testimonials() {
  const testimonials = [
    {
      name: "Dr. Ahmad Susanto",
      role: "Kaprodi Teknik Informatika",
      avatar: "https://i.pravatar.cc/150?img=1",
      content:
        "jadwal_in telah merevolusi cara kami mengelola jadwal perkuliahan. Fitur monitoring dan pelaporan sangat membantu dalam pengambilan keputusan akademik.",
      rating: 5,
    },
    {
      name: "Prof. Siti Nurhaliza",
      role: "Dosen Sistem Informasi",
      avatar: "https://i.pravatar.cc/150?img=3",
      content:
        "Interface yang intuitif dan fitur kehadiran real-time sangat memudahkan saya dalam mengelola kelas. Support team juga sangat responsif.",
      rating: 5,
    },
    {
      name: "Budi Pratama",
      role: "Mahasiswa Semester 6",
      avatar: "https://i.pravatar.cc/150?img=5",
      content:
        "Sebagai mahasiswa, saya sangat terbantu dengan fitur KRS online dan notifikasi jadwal. Tidak pernah terlewat kelas lagi!",
      rating: 5,
    },
    {
      name: "Dr. Maya Indrasari",
      role: "Kaprodi Manajemen",
      avatar: "https://i.pravatar.cc/150?img=15",
      content:
        "Security dan akurasi data adalah prioritas utama kami. jadwal_in memberikan kepercayaan penuh dalam mengelola data akademik.",
      rating: 5,
    },
    {
      name: "Andi Wijaya",
      role: "Staff Akademik",
      avatar: "https://i.pravatar.cc/150?img=17",
      content:
        "Customer support yang luar biasa. Setiap pertanyaan dijawab dengan cepat dan menyeluruh. Seperti memiliki tim IT tambahan.",
      rating: 5,
    },
    {
      name: "Rina Sari",
      role: "Mahasiswa Semester 4",
      avatar: "https://i.pravatar.cc/150?img=19",
      content:
        "Sudah mencoba berbagai platform akademik, tapi jadwal_in paling reliable. Zero error selama 2 semester menggunakan.",
      rating: 5,
    },
    {
      name: "Prof. Bambang Sutrisno",
      role: "Dosen Senior",
      avatar: "https://i.pravatar.cc/150?img=21",
      content:
        "Dashboard analytics memberikan insight yang belum pernah ada sebelumnya. Pengambilan keputusan berbasis data jadi competitive advantage.",
      rating: 5,
    },
    {
      name: "Desi Ratnasari",
      role: "Koordinator Akademik",
      avatar: "https://i.pravatar.cc/150?img=23",
      content:
        "Migrasi sistem sangat smooth dan proses onboarding exceptional. Tim kami langsung produktif dari hari pertama.",
      rating: 5,
    },
    {
      name: "Fajar Ramadhan",
      role: "Mahasiswa Pascasarjana",
      avatar: "https://i.pravatar.cc/150?img=25",
      content:
        "Platform yang scalable dari program sarjana hingga pascasarjana. Berkembang bersama kebutuhan akademik kami.",
      rating: 5,
    },
    {
      name: "Dr. Indah Permatasari",
      role: "Wakil Dekan Akademik",
      avatar: "https://i.pravatar.cc/150?img=27",
      content:
        "Fitur kolaborasi real-time mengubah cara kerja tim akademik. Produktivitas meningkat drastis sejak menggunakan jadwal_in.",
      rating: 5,
    },
  ];

  const StarIcon = () => (
    <svg
      className="w-4 h-4 text-yellow-500"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );

  return (
    <section id="testimonials" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-20 flex flex-col gap-3"
        >
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold bg-gradient-to-b from-foreground to-muted-foreground text-transparent bg-clip-text">
            Dipercaya Civitas Akademika
          </h2>
          <p className="mx-auto max-w-xl text-sm sm:text-base text-muted-foreground text-center">
            Bergabunglah dengan ribuan pengguna yang mempercayai platform kami.
          </p>
        </motion.div>

        <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                delay: index * 0.05,
                ease: "easeOut",
              }}
              className="break-inside-avoid mb-8"
            >
              <div className="p-6 rounded-xl bg-card border border-border transition-colors duration-300">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} />
                  ))}
                </div>

                <p className="text-muted-foreground mb-6 leading-relaxed text-sm">
                  &ldquo;{testimonial.content}&rdquo;
                </p>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center text-sm font-medium border border-primary/20">
                    {testimonial.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">
                      {testimonial.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
