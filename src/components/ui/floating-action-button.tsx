"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Plus, Calendar, BookOpen, Bell, Users, X } from "lucide-react"
import Link from "next/link"

interface FloatingActionButtonProps {
  className?: string
}

export function FloatingActionButton({ className }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  const actions = [
    {
      icon: Calendar,
      label: "Tambah Jadwal",
      href: "/schedule",
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      icon: BookOpen,
      label: "Tambah Mata Kuliah",
      href: "/subjects",
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      icon: Bell,
      label: "Buat Pengingat",
      href: "/reminders",
      color: "bg-orange-500 hover:bg-orange-600",
    },
    {
      icon: Users,
      label: "Lihat KRS",
      href: "/krs",
      color: "bg-purple-500 hover:bg-purple-600",
    },
  ]

  return (
    <div className={cn("fixed bottom-6 right-6 z-50", className)}>
      <div className="relative">
        {isOpen && (
          <div className="absolute bottom-16 right-0 space-y-3 animate-scale-in">
            {actions.map((action, index) => (
              <Link key={action.href} href={action.href}>
                <Button
                  size="lg"
                  className={cn("w-14 h-14 rounded-full shadow-lg button-modern", action.color, "animate-spring")}
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => setIsOpen(false)}
                >
                  <action.icon className="h-6 w-6 text-white" />
                  <span className="sr-only">{action.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        )}

        <Button
          size="lg"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-16 h-16 rounded-full shadow-xl button-modern gradient-primary text-white",
            "hover:scale-110 transition-all duration-300",
            isOpen && "rotate-45",
          )}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </Button>
      </div>
    </div>
  )
}
