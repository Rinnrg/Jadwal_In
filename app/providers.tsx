"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
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
      />
    </NextThemesProvider>
  );
}
