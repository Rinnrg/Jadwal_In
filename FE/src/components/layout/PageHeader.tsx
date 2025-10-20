"use client"

import type React from "react"

import { useNavigation } from "@/hooks/useNavigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title?: string
  description?: string
  showBackButton?: boolean
  children?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, showBackButton = false, children, className }: PageHeaderProps) {
  const { getPageTitle, getPageDescription } = useNavigation()
  const router = useRouter()

  const pageTitle = title || getPageTitle()
  const pageDescription = description || getPageDescription()

  return (
    <div className={cn("mb-8 animate-fade-in", className)}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-6">
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="
                h-12 w-12 rounded-xl
                hover:bg-primary/10 hover:text-primary 
                transition-all duration-300 hover:scale-110
                button-press border border-transparent hover:border-primary/20
              "
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}

          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <h1 className="text-4xl font-bold text-foreground animate-slide-in-left">{pageTitle}</h1>
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            </div>

            {pageDescription && (
              <p
                className="text-lg text-muted-foreground animate-slide-in-left max-w-2xl leading-relaxed [animation-delay:0.1s]"
              >
                {pageDescription}
              </p>
            )}
          </div>
        </div>

        {children && <div className="flex items-center space-x-3 animate-slide-in-right">{children}</div>}
      </div>

      <div className="h-1 w-full bg-gradient-to-r from-primary via-secondary to-primary/50 rounded-full animate-shimmer" />
    </div>
  )
}
