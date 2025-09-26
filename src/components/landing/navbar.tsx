"use client";
import { Button } from "@/components/ui/button";
import ThemeSwitcher from "./theme-switcher";
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
                alt="Jadwal.in Logo" 
                width={32} 
                height={32}
                className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
              />
              <span>Jadwal.in</span>
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
            <Button asChild size="sm">
              <Link href="/login">Masuk</Link>
            </Button>
            <ThemeSwitcher />
          </div>
        </div>
      </div>
    </nav>
  );
}
