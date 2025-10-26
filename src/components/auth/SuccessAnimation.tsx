"use client"

import React, { useEffect, useState, useMemo } from 'react'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import { getCachedAnimation, preloadAnimation } from '@/src/utils/preload-animations'

interface SuccessAnimationProps {
  onComplete?: () => void
}

export function SuccessAnimation({ onComplete }: SuccessAnimationProps) {
  const dotLottieRef = React.useRef<any>(null)
  
  // Check cache immediately on component mount - useMemo untuk instant check
  const cachedData = useMemo(() => getCachedAnimation('/lottie/success.json'), [])
  const [animationData, setAnimationData] = useState<any>(cachedData)
  const [isReady, setIsReady] = useState(!!cachedData)
  const [isFadingOut, setIsFadingOut] = useState(false)

  useEffect(() => {
    // Load animation jika belum ada di cache - tapi tetap show fallback instantly
    if (!animationData) {
      // Immediately set isReady to true to show fallback
      setIsReady(true)
      
      preloadAnimation('/lottie/success.json').then(data => {
        if (data) {
          setAnimationData(data)
        }
      })
    }
  }, [animationData])

  useEffect(() => {
    if (dotLottieRef.current && isReady) {
      const handleComplete = () => {
        // Start fade out animation
        setIsFadingOut(true)
        
        // Instant callback - no delay
        setTimeout(() => {
          if (onComplete) {
            onComplete()
          }
        }, 150) // Minimal delay hanya untuk smooth fade out
      }

      dotLottieRef.current.addEventListener('complete', handleComplete)

      return () => {
        dotLottieRef.current?.removeEventListener('complete', handleComplete)
      }
    }
  }, [onComplete, isReady])

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-150 ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ animation: isFadingOut ? 'none' : 'fadeIn 0.1s ease-out' }}
    >
      <div className={`relative transition-transform duration-150 ${
        isFadingOut ? 'scale-95' : 'scale-100'
      }`}
        style={{ animation: isFadingOut ? 'none' : 'scaleIn 0.15s ease-out' }}
      >
        {animationData ? (
          <DotLottieReact
            data={animationData}
            autoplay
            loop={false}
            speed={2.0}
            dotLottieRefCallback={(dotLottie) => {
              dotLottieRef.current = dotLottie
            }}
            style={{ width: '400px', height: '400px' }}
          />
        ) : (
          // Fallback INSTANT - muncul langsung tanpa delay
          <div className="w-[400px] h-[400px] flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center shadow-2xl animate-bounce-in">
              <svg className="w-14 h-14 text-white animate-draw-check" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: scale(0.8);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes bounce-in {
          0% { 
            transform: scale(0);
            opacity: 0;
          }
          60% { 
            transform: scale(1.15);
          }
          100% { 
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes draw-check {
          0% {
            stroke-dasharray: 0 100;
          }
          100% {
            stroke-dasharray: 100 100;
          }
        }
        .animate-bounce-in {
          animation: bounce-in 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        .animate-draw-check {
          stroke-dasharray: 100;
          animation: draw-check 0.4s ease-out 0.15s forwards;
        }
      `}</style>
    </div>
  )
}
