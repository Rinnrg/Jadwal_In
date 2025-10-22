"use client"

import { useEffect } from "react"
import { bootstrapData, fetchUserProfile } from "@/data/bootstrap"

export function ClientBootstrap() {
  useEffect(() => {
    // Initialize bootstrap data on client side
    bootstrapData()
    
    // Fetch user profile from database
    fetchUserProfile()
  }, [])

  return null
}
