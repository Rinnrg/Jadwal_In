"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Toaster } from "sonner";
import { useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  // Pre-load animasi saat app mount dengan PRIORITAS TINGGI
  useEffect(() => {
    // Immediate preload - tidak pakai dynamic import untuk instant execution
    import('@/src/utils/preload-animations').then(({ preloadAnimations }) => {
      // Preload langsung tanpa delay
      preloadAnimations([
        '/lottie/success.json',
        '/lottie/Businessman flies up with rocket.json',
      ])
    })
  }, [])

  return (
    <NextThemesProvider 
      attribute="class" 
      defaultTheme="system" 
      enableSystem
      disableTransitionOnChange={false}
      enableColorScheme={false}
      storageKey="jadwalim-theme"
      themes={["light", "dark", "system"]}
    >
      {children}
      <Toaster 
        position="top-right" 
        richColors 
        closeButton
        expand={false}
        duration={5000}
        toastOptions={{
          style: {
            background: 'var(--background)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)',
          },
          className: 'group toast group-[.toaster]:shadow-lg',
          descriptionClassName: 'group-[.toast]:text-muted-foreground',
        }}
        className="toaster group"
        gap={12}
      />
    </NextThemesProvider>
  );
}
