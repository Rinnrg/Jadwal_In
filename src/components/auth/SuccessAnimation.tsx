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
        if (onComplete) {
          onComplete()
        }
      }

      dotLottieRef.current.addEventListener('complete', handleComplete)

      return () => {
        dotLottieRef.current?.removeEventListener('complete', handleComplete)
      }
    }
  }, [onComplete, isReady])

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative animate-in zoom-in duration-300">
        {isReady && animationData ? (
          <DotLottieReact
            data={animationData}
            autoplay
            loop={false}
            dotLottieRefCallback={(dotLottie) => {
              dotLottieRef.current = dotLottie
            }}
            style={{ width: '300px', height: '300px' }}
          />
        ) : (
          // Fallback sederhana saat loading - instant feedback
          <div className="w-[300px] h-[300px] flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center animate-scale-in">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 text-center pb-8">
          <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 animate-in fade-in slide-in-from-bottom-4 duration-300">
            Login Berhasil!
          </h2>
          <p className="text-sm text-muted-foreground mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-100">
            Mengalihkan ke dashboard...
          </p>
        </div>
      </div>
    </div>
  )
}
