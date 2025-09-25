"use client"

export function GlobalLoading() {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center space-y-4">
        {/* Simple spinner */}
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        
        {/* Loading text */}
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}
