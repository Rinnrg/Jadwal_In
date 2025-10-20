"use client"

import { useState, useRef, useEffect } from "react"

export default function GestureTest() {
  const [events, setEvents] = useState<string[]>([])
  const [isHolding, setIsHolding] = useState(false)
  const [showOverlay, setShowOverlay] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  const addEvent = (msg: string) => {
    setEvents(prev => [...prev.slice(-20), `${new Date().toLocaleTimeString()}: ${msg}`])
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    addEvent(`🔵 Pointer Down (${e.pointerType})`)
    setIsHolding(true)
    
    timerRef.current = setTimeout(() => {
      addEvent('✅ Long Press Triggered!')
      setShowOverlay(true)
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }, 600)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isHolding) {
      addEvent(`📍 Moving...`)
    }
  }

  const handlePointerUp = () => {
    addEvent('🔴 Pointer Up')
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    setIsHolding(false)
    setShowOverlay(false)
  }

  return (
    <div className="min-h-screen p-8 space-y-8">
      <h1 className="text-3xl font-bold">Gesture Detection Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Test Button */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Test Area</h2>
          <div className="p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex items-center justify-center min-h-[300px]">
            <button
              type="button"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className={`
                w-20 h-20 rounded-full 
                bg-blue-500 hover:bg-blue-600 
                text-white font-bold text-2xl
                transition-all duration-200
                ${isHolding ? 'scale-110 ring-4 ring-blue-300' : 'scale-100'}
                ${showOverlay ? 'scale-125 ring-8 ring-green-300' : ''}
              `}
              style={{
                touchAction: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
              }}
            >
              {isHolding ? '⏱️' : '👆'}
            </button>
          </div>
          
          <div className="space-y-2">
            <div className={`p-4 rounded-lg ${isHolding ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
              <p className="font-semibold">Status: {isHolding ? '🟢 Holding...' : '⚪ Ready'}</p>
            </div>
            <div className={`p-4 rounded-lg ${showOverlay ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
              <p className="font-semibold">Long Press: {showOverlay ? '✅ Triggered' : '❌ Not triggered'}</p>
            </div>
          </div>
        </div>

        {/* Event Log */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Event Log</h2>
          <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-[400px] overflow-auto">
            {events.length === 0 ? (
              <p className="text-gray-500">No events yet. Touch/Click the button!</p>
            ) : (
              events.map((event, i) => (
                <div key={i} className="mb-1">{event}</div>
              ))
            )}
          </div>
          <button
            onClick={() => setEvents([])}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Clear Log
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-950 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold mb-2">📖 Instructions:</h3>
        <ol className="list-decimal list-inside space-y-2">
          <li>Hold the button for 600ms (0.6 seconds)</li>
          <li>Watch the event log for "Long Press Triggered!"</li>
          <li>Button should show ⏱️ when holding</li>
          <li>Green ring appears when long press triggers</li>
          <li>Check browser console for additional logs</li>
        </ol>
      </div>

      {/* Overlay Test */}
      {showOverlay && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl">
            <h2 className="text-2xl font-bold mb-4">🎉 Long Press Detected!</h2>
            <p className="text-gray-600 dark:text-gray-300">
              The gesture detection is working correctly!
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
