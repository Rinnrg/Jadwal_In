"use client"

import React from 'react'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'

interface LottieAnimationProps {
  src: string
  loop?: boolean
  autoplay?: boolean
  className?: string
  width?: number | string
  height?: number | string
  onComplete?: () => void
  onPlay?: () => void
  onPause?: () => void
}

/**
 * Generic Lottie Animation Component
 * 
 * @example
 * ```tsx
 * <LottieAnimation
 *   src="https://lottie.host/..."
 *   loop={true}
 *   autoplay={true}
 *   width={300}
 *   height={300}
 *   onComplete={() => console.log('Animation completed')}
 * />
 * ```
 */
export function LottieAnimation({
  src,
  loop = false,
  autoplay = true,
  className = '',
  width = 300,
  height = 300,
  onComplete,
  onPlay,
  onPause,
}: LottieAnimationProps) {
  const dotLottieRef = React.useRef<any>(null)

  React.useEffect(() => {
    if (!dotLottieRef.current) return

    const handleComplete = () => {
      onComplete?.()
    }

    const handlePlay = () => {
      onPlay?.()
    }

    const handlePause = () => {
      onPause?.()
    }

    if (onComplete) {
      dotLottieRef.current.addEventListener('complete', handleComplete)
    }
    if (onPlay) {
      dotLottieRef.current.addEventListener('play', handlePlay)
    }
    if (onPause) {
      dotLottieRef.current.addEventListener('pause', handlePause)
    }

    return () => {
      if (onComplete) {
        dotLottieRef.current?.removeEventListener('complete', handleComplete)
      }
      if (onPlay) {
        dotLottieRef.current?.removeEventListener('play', handlePlay)
      }
      if (onPause) {
        dotLottieRef.current?.removeEventListener('pause', handlePause)
      }
    }
  }, [onComplete, onPlay, onPause])

  return (
    <div className={className}>
      <DotLottieReact
        src={src}
        loop={loop}
        autoplay={autoplay}
        dotLottieRefCallback={(dotLottie) => {
          dotLottieRef.current = dotLottie
        }}
        style={{ width, height }}
      />
    </div>
  )
}
