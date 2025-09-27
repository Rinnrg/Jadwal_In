"use client";
/* eslint-disable @next/next/no-img-element */
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Hero() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleNavigateToLogin = async () => {
    setIsNavigating(true);
    
    // Delay untuk menampilkan animasi loading
    setTimeout(() => {
      router.push('/login');
    }, 800);
  };

  return (
    <div className="relative justify-center items-center">
      <section className="max-w-7xl mx-auto px-4 py-28 gap-12 md:px-8 flex flex-col justify-center items-center">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{
            y: 0,
            opacity: 1,
          }}
          transition={{ duration: 0.6, type: "spring", bounce: 0 }}
          className="flex flex-col justify-center items-center space-y-5 max-w-4xl mx-auto text-center"
        >
          <span className="w-fit h-full text-sm bg-card px-2 py-1 border border-border rounded-full">
            Sistem Manajemen Jadwal
          </span>
          <h1 className="text-4xl font-medium tracking-tighter mx-auto md:text-6xl text-pretty bg-linear-to-b from-sky-800 dark:from-sky-100 to-foreground dark:to-foreground bg-clip-text text-transparent">
            Jadwal Gak Pernah Telat, Reminder Selalu Ingat
          </h1>
          <p className="max-w-2xl text-lg mx-auto text-muted-foreground text-balance">
            Jadwal, KRS, sampai absensi? Semua aman dalam satu aplikasi.
          </p>
          <motion.div
            className="items-center justify-center gap-x-3 space-y-3 sm:flex sm:space-y-0"
          >
            <motion.div
              whileHover={{ 
                scale: 1.05,
                rotateX: 5,
                rotateY: 5,
              }}
              whileTap={{ scale: 0.95 }}
              animate={isNavigating ? {
                scale: [1, 1.1],
                rotate: 360,
                opacity: [1, 0.7]
              } : {}}
              transition={isNavigating ? {
                duration: 0.8,
                ease: "easeInOut",
                type: "tween"
              } : { 
                type: "spring", 
                stiffness: 400, 
                damping: 17
              }}
              className="relative group"
            >
              <Button 
                onClick={handleNavigateToLogin}
                disabled={isNavigating}
                className="relative overflow-hidden shadow-lg bg-gradient-to-r from-[#4285F4] via-[#4285F4] to-[#3367D6] hover:from-[#3367D6] hover:via-[#4285F4] hover:to-[#5AA3F5] text-white border-0 px-8 py-3 transition-all duration-300 hover:shadow-2xl hover:shadow-[#4285F4]/25 disabled:opacity-70"
              >
                <motion.span 
                  className="relative z-10 font-semibold flex items-center gap-2"
                  animate={isNavigating ? { opacity: [1, 0, 1] } : {}}
                  transition={{ duration: 0.8, repeat: isNavigating ? Infinity : 0 }}
                >
                  {isNavigating ? (
                    <>
                      <motion.div
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      Memuat...
                    </>
                  ) : (
                    "Mulai Sekarang"
                  )}
                </motion.span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-[#4285F4]/0 via-[#4285F4]/30 to-[#4285F4]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                {isNavigating && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-[#4285F4] via-white to-[#4285F4]"
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                  />
                )}
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, delay: 0.5, type: "spring", bounce: 0 }}
        className="w-full h-full absolute -top-32 flex justify-end items-center pointer-events-none overflow-hidden"
      >
        <div className="w-3/4 flex justify-center items-center">
          <div className="w-12 h-[600px] bg-light blur-[70px] rounded-3xl max-sm:rotate-15 sm:rotate-35 will-change-transform"></div>
        </div>
      </motion.div>
    </div>
  );
}
