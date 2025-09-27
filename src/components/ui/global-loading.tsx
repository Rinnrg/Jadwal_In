"use client"

import Image from "next/image"

export function GlobalLoading() {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center space-y-4">
        {/* Logo */}
        <div className="flex items-center justify-center">
          <Image 
            src="/logo jadwal in.svg" 
            alt="jadwal_in Logo" 
            width={24} 
            height={24}
            className="w-6 h-6 object-contain"
          />
        </div>
        
        {/* Loading text */}
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">jadwal_in</p>
          <p className="text-xs text-muted-foreground">Loading...</p>
        </div>
      </div>
    </div>
  )
}
