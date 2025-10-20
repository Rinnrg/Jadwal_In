"use client";

import { Moon, Sun } from "lucide-react";
import { useOptimizedTheme } from "@/hooks/useOptimizedTheme";

export default function ThemeSwitcher() {
  const { resolvedTheme, toggleTheme, mounted } = useOptimizedTheme();

  const handleClick = () => {
    toggleTheme();
  };

  if (!mounted) {
    return (
      <button 
        disabled 
        className="inline-flex items-center justify-center rounded-md h-9 w-9 opacity-50"
        title="Loading theme..."
      >
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle theme</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="relative inline-flex items-center justify-center rounded-md h-9 w-9 transition-all duration-200 hover:scale-110 hover:bg-accent hover:text-accent-foreground"
      title="Toggle Theme"
    >

        {/* Sun Icon */}
        <Sun
          className={`absolute h-[1.2rem] w-[1.2rem] transition-all duration-300 z-10 ${
            resolvedTheme === "dark"
              ? "rotate-90 scale-0 opacity-0"
              : "rotate-0 scale-100 opacity-100"
          }`}
        />

        {/* Moon Icon */}
        <Moon
          className={`absolute h-[1.2rem] w-[1.2rem] transition-all duration-300 z-10 ${
            resolvedTheme === "dark"
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-0 opacity-0"
          }`}
        />

        <span className="sr-only">Toggle theme</span>
      </button>
  );
}
