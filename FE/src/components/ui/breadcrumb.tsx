"use client"

import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

interface BreadcrumbItem {
  title: string
  path: string
  isCurrentPage?: boolean
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cn("flex items-center space-x-2 text-sm", className)}>
      <Link
        href="/dashboard"
        className="flex items-center text-muted-foreground hover:text-primary transition-colors duration-200"
      >
        <Home className="h-4 w-4" />
      </Link>

      {items.map((item, index) => (
        <div key={item.path} className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          {item.isCurrentPage ? (
            <span className="text-foreground font-medium">{item.title}</span>
          ) : (
            <Link href={item.path} className="text-muted-foreground hover:text-primary transition-colors duration-200">
              {item.title}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}
