"use client"

import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface NotificationBadgeProps {
  count: number
  className?: string
  showPulse?: boolean
}

export function NotificationBadge({ count, className, showPulse = true }: NotificationBadgeProps) {
  if (count === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={cn(
          "absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold shadow-lg border-2 border-white dark:border-gray-900",
          showPulse && "animate-pulse",
          className
        )}
      >
        {count > 99 ? "99+" : count}
        {showPulse && (
          <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
        )}
      </motion.div>
    </AnimatePresence>
  )
}
