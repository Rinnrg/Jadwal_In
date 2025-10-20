"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";

export default function Faq() {
  const accordionItems = [
    {
      title: "Apakah jadwal_in gratis untuk digunakan?",
      content: (
        <div className="text-muted-foreground">
          Ya, jadwal_in sepenuhnya gratis untuk semua civitas akademika. Kami menyediakan akses penuh ke semua fitur tanpa biaya berlangganan.
        </div>
      ),
    },
    {
      title: "Bagaimana cara mendaftar di jadwal_in?",
      content: (
        <div className="text-muted-foreground">
          Pendaftaran dilakukan melalui admin institusi. Hubungi bagian akademik atau IT support di universitas Anda untuk mendapatkan akun dan panduan penggunaan.
        </div>
      ),
    },
    {
      title: "Apakah data akademik saya aman?",
      content: (
        <div className="text-muted-foreground">
          Keamanan data adalah prioritas utama kami. Semua data dienkripsi dan disimpan dengan standar keamanan tinggi. Kami juga melakukan backup berkala untuk memastikan data tidak hilang.
        </div>
      ),
    },
    {
      title: "Bisakah diakses dari perangkat mobile?",
      content: (
        <div className="text-muted-foreground">
          Ya, jadwal_in dapat diakses melalui browser di perangkat mobile dan tablet. Interface kami responsive dan user-friendly untuk semua ukuran layar.
        </div>
      ),
    },
    {
      title: "Bagaimana jika ada masalah teknis?",
      content: (
        <div className="text-muted-foreground">
          Tim support kami siap membantu 24/7. Anda dapat menghubungi kami melalui fitur help desk yang tersedia di dalam sistem atau melalui kontak yang disediakan institusi.
        </div>
      ),
    },
  ];

  return (
    <motion.section
      initial={{ y: 20, opacity: 0 }}
      whileInView={{
        y: 0,
        opacity: 1,
      }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.5, type: "spring", bounce: 0 }}
      className="relative w-full max-w-(--breakpoint-xl) mx-auto px-4 py-28 gap-5 md:px-8 flex flex-col justify-center items-center"
    >
      <div className="flex flex-col gap-3 justify-center items-center">
        <h4 className="text-xl sm:text-2xl md:text-3xl font-bold bg-linear-to-b from-foreground to-muted-foreground text-transparent bg-clip-text">
          FAQ
        </h4>
        <p className="max-w-xl text-sm sm:text-base text-muted-foreground text-center">
          Pertanyaan yang sering diajukan tentang jadwal_in.
        </p>
      </div>
      <div className="flex w-full max-w-lg">
        <Accordion type="multiple" className="w-full">
          {accordionItems.map((item, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="text-muted-foreground"
            >
              <AccordionTrigger className="text-left">
                {item.title}
              </AccordionTrigger>
              <AccordionContent>{item.content}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </motion.section>
  );
}
