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
