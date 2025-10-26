"use client"

import React, { useEffect } from 'react'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'

interface SuccessAnimationProps {
  onComplete?: () => void
}

export function SuccessAnimation({ onComplete }: SuccessAnimationProps) {
  const dotLottieRef = React.useRef<any>(null)

  useEffect(() => {
    if (dotLottieRef.current) {
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
  }, [onComplete])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative">
        <DotLottieReact
          src="https://lottie.host/6b0fb7ba-8e31-4bc6-95cc-d9a65af37a87/UzGKpYW6Md.lottie"
          autoplay
          loop={false}
          dotLottieRefCallback={(dotLottie) => {
            dotLottieRef.current = dotLottie
          }}
          style={{ width: '400px', height: '400px' }}
        />
        <div className="absolute bottom-0 left-0 right-0 text-center pb-8">
          <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 animate-fade-in">
            Login Berhasil!
          </h2>
          <p className="text-sm text-muted-foreground mt-2 animate-fade-in [animation-delay:0.2s]">
            Mengalihkan ke dashboard...
          </p>
        </div>
      </div>
    </div>
  )
}
