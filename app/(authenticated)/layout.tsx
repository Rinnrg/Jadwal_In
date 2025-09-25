import type React from "react"
import { HydrationGuard, Protected } from "@/lib/guards"
import { Topbar } from "@/components/layout/Topbar"
import { Sidebar } from "@/components/layout/Sidebar"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <HydrationGuard>
      <Protected>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
          <Topbar />
          <div className="flex pt-16">
            <Sidebar />
            {/* Mobile: full width centered content, Desktop: account for sidebar */}
            <main className="flex-1 sm:ml-16 pt-4 px-4 sm:px-6 min-h-[calc(100vh-4rem)] overflow-x-hidden">
              <div className="max-w-full w-full overflow-x-hidden mx-auto">
                {children}
              </div>
            </main>
          </div>
        </div>
      </Protected>
    </HydrationGuard>
  )
}
