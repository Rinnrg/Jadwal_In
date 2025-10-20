"use client"

import { useState, useEffect } from "react"

export function useCountdown(targetTime: number) {
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now()
      const difference = targetTime - now
      setTimeLeft(Math.max(0, difference))
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [targetTime])

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24))
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)

  return { days, hours, minutes, seconds, totalMs: timeLeft }
}
