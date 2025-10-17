"use client";
import { Button } from "@/components/ui/button";
import ThemeSwitcher from "@/src/components/landing/theme-switcher";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function NavBar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollPosition = window.scrollY;
          setIsScrolled(scrollPosition > 80);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Navbar fixed dengan conditional visibility */}
      <nav className={`
        fixed top-0 z-50 w-full transition-all duration-700 ease-out
        ${isScrolled 
          ? 'translate-y-0 opacity-100 glass-surface shadow-xl border-b border-border/30 scale-100 liquid-glass-mode:liquid-glass-panel' 
          : 'translate-y-0 opacity-100 bg-transparent'
        }
      `}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex">
              <Link href="/" className="flex items-center space-x-2 font-light tracking-tighter text-base sm:text-lg md:text-xl lg:text-2xl">
                <Image 
                  src="/logo jadwal in.svg" 
                  alt="jadwal_in Logo" 
                  width={24} 
                  height={24}
                  className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 object-contain"
                />
                <span>Jadwal_in</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeSwitcher />
              <Link href="/login">
                <Button 
                  variant="default"
                  size="sm"
                  className="
                    bg-blue-600 hover:bg-blue-700 
                    dark:bg-blue-600 dark:hover:bg-blue-700 
                    text-white font-medium px-4 py-2 
                    transition-all duration-200 
                    shadow-sm hover:shadow-md
                  "
                >
                  Masuk
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Spacer untuk mencegah content tertutup navbar */}
      <div className="h-16" />
    </>
  );
}
