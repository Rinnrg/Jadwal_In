"use client"

import React, { useEffect, useState } from 'react'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'

interface SuccessAnimationProps {
  onComplete?: () => void
}

export function SuccessAnimation({ onComplete }: SuccessAnimationProps) {
  const dotLottieRef = React.useRef<any>(null)
  const [animationData, setAnimationData] = useState<any>(null)

  useEffect(() => {
    console.log('SuccessAnimation mounted, loading animation file...')
    // Load the local Lottie JSON file
    fetch('/lottie/success.json')
      .then(response => response.json())
      .then(data => {
        console.log('Animation data loaded successfully:', data)
        setAnimationData(data)
      })
      .catch(error => console.error('Error loading animation:', error))
  }, [])

  useEffect(() => {
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

  if (!animationData) {
    console.log('Waiting for animation data to load...')
    return null // or a loading spinner
  }

  console.log('Rendering animation with data')
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative">
        <DotLottieReact
          data={animationData}
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
