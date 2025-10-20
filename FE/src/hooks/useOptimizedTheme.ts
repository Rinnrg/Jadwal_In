'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function useOptimizedTheme() {
  const { theme, setTheme, resolvedTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    if (isTransitioning) return // Prevent rapid theme switching

    setIsTransitioning(true)
    
    // Use resolved theme for accurate switching
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
    
    // Optimize transition by temporarily disabling animations on body
    document.body.style.transition = 'none'
    
    setTheme(newTheme)
    
    // Re-enable transitions after a minimal delay
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.body.style.transition = ''
        setIsTransitioning(false)
      })
    })
  }

  const setThemeOptimized = (newTheme: string) => {
    if (isTransitioning) return

    setIsTransitioning(true)
    document.body.style.transition = 'none'
    
    setTheme(newTheme)
    
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.body.style.transition = ''
        setIsTransitioning(false)
      })
    })
  }

  return {
    theme,
    resolvedTheme,
    systemTheme,
    mounted,
    isTransitioning,
    toggleTheme,
    setTheme: setThemeOptimized,
  }
}
