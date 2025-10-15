"use client";
import { Button } from "@/components/ui/button";
import ThemeSwitcher from "./theme-switcher";
import Link from "next/link";
import Image from "next/image";

export default function NavBar() {

  return (
    <nav className="sticky top-0 z-50 w-full glass-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex">
            <Link href="/" className="flex items-center space-x-2 font-light tracking-tighter text-base sm:text-lg md:text-xl lg:text-2xl">
              <Image 
                src="/logo jadwal in.svg" 
                alt="jadwal_in Logo" 
                width={32} 
                height={32}
                className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 object-contain"
              />
              <span>jadwal_in</span>
            </Link>
          </div>
          <div className="hidden sm:flex items-center space-x-8">
            <Button asChild variant="ghost" size="sm">
              <Link href="#features">Fitur</Link>
            </Button>

            <Button asChild variant="ghost" size="sm">
              <Link href="#about">Tentang</Link>
            </Button>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              asChild 
              size="sm"
              className="
                bg-blue-600 hover:bg-blue-700 
                dark:bg-blue-600 dark:hover:bg-blue-700 
                text-white font-medium
                transition-all duration-200 
                shadow-sm hover:shadow-md
              "
            >
              <Link href="/login">Masuk</Link>
            </Button>
            <ThemeSwitcher />
          </div>
        </div>
      </div>
    </nav>
  );
}
