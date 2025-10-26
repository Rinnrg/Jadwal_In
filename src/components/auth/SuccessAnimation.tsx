"use client"

import React, { useEffect, useState } from 'react'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import { getCachedAnimation, preloadAnimation } from '@/src/utils/preload-animations'

interface SuccessAnimationProps {
  onComplete?: () => void
}

export function SuccessAnimation({ onComplete }: SuccessAnimationProps) {
  const dotLottieRef = React.useRef<any>(null)
  const [animationData, setAnimationData] = useState<any>(getCachedAnimation('/lottie/success.json'))
  const [isReady, setIsReady] = useState(!!getCachedAnimation('/lottie/success.json'))
  const [isFadingOut, setIsFadingOut] = useState(false)

  useEffect(() => {
    // Load animation jika belum ada di cache
    if (!animationData) {
      preloadAnimation('/lottie/success.json').then(data => {
        if (data) {
          setAnimationData(data)
          setIsReady(true)
        }
      })
    }
  }, [animationData])

  useEffect(() => {
    if (dotLottieRef.current && isReady) {
      const handleComplete = () => {
        // Start fade out animation
        setIsFadingOut(true)
        
        // Wait for fade out, then call onComplete
        setTimeout(() => {
          if (onComplete) {
            onComplete()
          }
        }, 500) // Fade out duration
      }

      dotLottieRef.current.addEventListener('complete', handleComplete)

      return () => {
        dotLottieRef.current?.removeEventListener('complete', handleComplete)
      }
    }
  }, [onComplete, isReady])

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-md transition-opacity duration-500 ${
        isFadingOut ? 'opacity-0' : 'opacity-100 animate-in fade-in'
      }`}
    >
      <div className={`relative transition-transform duration-500 ${
        isFadingOut ? 'scale-95' : 'animate-in zoom-in duration-300'
      }`}>
        {isReady && animationData ? (
          <DotLottieReact
            data={animationData}
            autoplay
            loop={false}
            speed={1.3}
            dotLottieRefCallback={(dotLottie) => {
              dotLottieRef.current = dotLottie
            }}
            style={{ width: '400px', height: '400px' }}
            autoResizeCanvas={true}
            renderConfig={{
              devicePixelRatio: 2
            }}
          />
        ) : (
          // Fallback sederhana saat loading - instant feedback
          <div className="w-[400px] h-[400px] flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center animate-scale-in">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
