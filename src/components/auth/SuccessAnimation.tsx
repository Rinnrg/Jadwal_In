"use client"

import React, { useEffect } from 'react'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'

interface SuccessAnimationProps {
  onComplete?: () => void
}

export function SuccessAnimation({ onComplete }: SuccessAnimationProps) {
  const dotLottieRef = React.useRef<any>(null)

  useEffect(() => {
    console.log('SuccessAnimation mounted')
    if (dotLottieRef.current) {
      console.log('Setting up animation event listeners')
      const handleComplete = () => {
        console.log('Animation completed!')
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

  console.log('Rendering animation')
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative animate-in zoom-in duration-500">
        <DotLottieReact
          src="/lottie/success.json"
          autoplay
          loop={false}
          dotLottieRefCallback={(dotLottie) => {
            dotLottieRef.current = dotLottie
          }}
          style={{ width: '400px', height: '400px' }}
        />
        <div className="absolute bottom-0 left-0 right-0 text-center pb-8">
          <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 animate-in fade-in slide-in-from-bottom-4 duration-500">
            Login Berhasil!
          </h2>
          <p className="text-sm text-muted-foreground mt-2 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">
            Mengalihkan ke dashboard...
          </p>
        </div>
      </div>
    </div>
  )
}
