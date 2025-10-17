'use client'

import { useOptimizedTheme } from '@/src/hooks/useOptimizedTheme'
import { MoonIcon, SunIcon } from '@radix-ui/react-icons'

export default function ThemeSwitcher() {
  const { resolvedTheme, toggleTheme, mounted } = useOptimizedTheme()

  const handleClick = () => {
    toggleTheme()
  }

  if (!mounted) {
    return (
      <button disabled className="inline-flex items-center justify-center rounded-md h-9 w-9 opacity-50" title="Loading theme...">
        <SunIcon className="h-4 w-4" />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="relative inline-flex items-center justify-center rounded-md h-9 w-9 transition-all duration-200 hover:scale-110 hover:bg-accent hover:text-accent-foreground"
      title="Toggle Theme"
    >

        {/* Sun Icon */}
        <SunIcon
          className={`absolute h-4 w-4 transition-all duration-300 z-10 ${
            resolvedTheme === 'dark' ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
          }`}
        />

        {/* Moon Icon */}
        <MoonIcon
          className={`absolute h-4 w-4 transition-all duration-300 z-10 ${
            resolvedTheme === 'dark' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
          }`}
        />
      </button>
  )
}