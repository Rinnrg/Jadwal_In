"use client"

import { useEffect } from "react"
import { bootstrapData } from "@/data/bootstrap"

export function ClientBootstrap() {
  useEffect(() => {
    // Initialize bootstrap data on client side
    bootstrapData()
  }, [])

  return null
}
