"use client";
import { Button } from "@/components/ui/button";
import ThemeSwitcher from "@/components/theme-switcher";
import Link from "next/link";
import Image from "next/image";

export default function NavBar() {

  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex">
            <Link href="/" className="flex items-center space-x-2 font-light tracking-tighter text-lg sm:text-2xl">
              <Image 
                src="/logo jadwal in.svg" 
                alt="jadwal_in Logo" 
                width={24} 
                height={24}
                className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
              />
              <span>Jadwal_in</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeSwitcher />
          </div>
        </div>
      </div>
    </nav>
  );
}
