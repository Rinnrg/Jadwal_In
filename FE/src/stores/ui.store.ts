import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { UIPreferences } from "@/data/schema"

interface UIState extends UIPreferences {
  setTheme: (theme: UIPreferences["theme"]) => void
  setLanguage: (language: UIPreferences["language"]) => void
  setFormat24h: (format24h: boolean) => void
  setShowNowLine: (showNowLine: boolean) => void
  setShowLegend: (showLegend: boolean) => void
  setSnapInterval: (snapInterval: number) => void
  toggleTheme: () => void
}

const defaultPreferences: UIPreferences = {
  theme: "system",
  language: "id",
  format24h: true,
  showNowLine: true,
  showLegend: true,
  snapInterval: 15,
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      ...defaultPreferences,
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setFormat24h: (format24h) => set({ format24h }),
      setShowNowLine: (showNowLine) => set({ showNowLine }),
      setShowLegend: (showLegend) => set({ showLegend }),
      setSnapInterval: (snapInterval) => set({ snapInterval }),
      toggleTheme: () => {
        const { theme } = get()
        const newTheme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light"
        set({ theme: newTheme })
      },
    }),
    {
      name: "jadwalin:ui:v1",
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any, version) => {
        if (version === 0) {
          return { ...defaultPreferences, ...persistedState }
        }
        return persistedState
      },
    },
  ),
)
