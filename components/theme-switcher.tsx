"use client";
import { Button } from "@/components/ui/button";
import { useOptimizedTheme } from "@/hooks/useOptimizedTheme";
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";

export default function ThemeSwitcher() {
  const { resolvedTheme, mounted, isTransitioning, toggleTheme } = useOptimizedTheme();

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <SunIcon className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleTheme}
      disabled={isTransitioning}
      className="relative overflow-hidden transition-transform duration-150 hover:scale-105 disabled:cursor-not-allowed"
    >
      <SunIcon className={`absolute h-4 w-4 transition-all duration-200 ${
        resolvedTheme === "dark" 
          ? "rotate-90 scale-0 opacity-0" 
          : "rotate-0 scale-100 opacity-100"
      }`} />
      <MoonIcon className={`absolute h-4 w-4 transition-all duration-200 ${
        resolvedTheme === "dark" 
          ? "rotate-0 scale-100 opacity-100" 
          : "-rotate-90 scale-0 opacity-0"
      }`} />
    </Button>
  );
}
