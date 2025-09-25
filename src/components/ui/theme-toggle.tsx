"use client"

import { useUIStore } from "@/stores/ui.store"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Monitor } from "lucide-react"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useUIStore()

  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-5 w-5" />
      case "dark":
        return <Moon className="h-5 w-5" />
      default:
        return <Monitor className="h-5 w-5" />
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn(
        "h-12 w-12 rounded-xl",
        "hover:bg-primary/10 hover:text-primary",
        "transition-all duration-300",
        "hover:rotate-12 hover:scale-110 button-press",
        "theme-transition relative overflow-hidden group",
        "border border-transparent hover:border-primary/20",
        className,
      )}
      title={`Current theme: ${theme}. Click to switch.`}
    >
      <div className="transition-all duration-300 group-hover:rotate-12 group-active:scale-90 theme-transition">
        {getThemeIcon()}
      </div>
      <div className="absolute inset-0 bg-primary/20 rounded-xl scale-0 group-active:scale-100 transition-transform duration-200 ease-out" />
    </Button>
  )
}
