import type React from "react"
import { HydrationGuard, Protected } from "@/lib/guards"
import { Topbar } from "@/components/layout/Topbar"
import { Sidebar } from "@/components/layout/Sidebar"
import { NotificationManager } from "@/components/layout/NotificationManager"
import { FloatingNotifications } from "@/components/layout/FloatingNotifications"
import "@/utils/notification-test" // Load test utilities in development

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <HydrationGuard>
      <Protected>
        <NotificationManager />
        <FloatingNotifications />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 overflow-x-hidden w-full">
          <Topbar />
          <div className="flex pt-16 overflow-x-hidden w-full">
            <Sidebar />
            {/* Mobile: full width centered content, Desktop: account for sidebar */}
            <main className="flex-1 sm:ml-16 pt-2 md:pt-4 px-2 sm:px-4 md:px-6 pb-8 md:pb-12 min-h-[calc(100vh-4rem)] overflow-x-hidden w-full max-w-full">
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
