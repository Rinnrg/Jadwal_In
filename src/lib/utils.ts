import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Array helper to ensure we always get an array
export function arr<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : []
}

// Safe JSON parse
export function safeJSON<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str)
  } catch {
    return fallback
  }
}

// Generate unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Guard helper for checking if value exists
export function exists<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

// Predefined color palette for subjects
const COLOR_PALETTE = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#f97316", // orange
  "#14b8a6", // teal
  "#6366f1", // indigo
  "#84cc16", // lime
  "#f43f5e", // rose
  "#a855f7", // violet
  "#22c55e", // green-500
  "#eab308", // yellow
  "#64748b", // slate
]

// Generate a random color that hasn't been used
export function generateUniqueColor(usedColors: string[]): string {
  const availableColors = COLOR_PALETTE.filter(color => !usedColors.includes(color))
  
  if (availableColors.length === 0) {
    // If all colors are used, pick a random one from the palette
    return COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)]
  }
  
  return availableColors[Math.floor(Math.random() * availableColors.length)]
}

// Get all predefined colors for color picker
export function getColorPalette(): string[] {
  return [...COLOR_PALETTE]
}
