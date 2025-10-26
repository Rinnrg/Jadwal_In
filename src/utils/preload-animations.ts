/**
 * Utility untuk pre-load animasi Lottie
 * Ini akan memuat animasi di background saat aplikasi load
 * sehingga saat dibutuhkan, animasi sudah siap
 */

const animationCache = new Map<string, any>()
const loadingPromises = new Map<string, Promise<any>>()

/**
 * Pre-load animasi Lottie dari file JSON
 */
export async function preloadAnimation(path: string): Promise<any> {
  // Jika sudah ada di cache, return langsung
  if (animationCache.has(path)) {
    return animationCache.get(path)
  }

  // Jika sedang loading, return promise yang sama
  if (loadingPromises.has(path)) {
    return loadingPromises.get(path)
  }

  // Mulai loading
  const promise = fetch(path)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to load animation: ${path}`)
      }
      return response.json()
    })
    .then(data => {
      animationCache.set(path, data)
      loadingPromises.delete(path)
      return data
    })
    .catch(error => {
      console.error(`Error preloading animation ${path}:`, error)
      loadingPromises.delete(path)
      return null
    })

  loadingPromises.set(path, promise)
  return promise
}

/**
 * Get cached animation data
 */
export function getCachedAnimation(path: string): any | null {
  return animationCache.get(path) || null
}

/**
 * Pre-load multiple animations
 */
export async function preloadAnimations(paths: string[]): Promise<void> {
  await Promise.all(paths.map(path => preloadAnimation(path)))
}

/**
 * Clear animation cache (jika perlu untuk free memory)
 */
export function clearAnimationCache(): void {
  animationCache.clear()
  loadingPromises.clear()
}

// Auto pre-load animasi penting saat browser idle
if (typeof window !== 'undefined') {
  // Gunakan requestIdleCallback untuk pre-load saat browser tidak sibuk
  const idleCallback = (window as any).requestIdleCallback || setTimeout
  
  idleCallback(() => {
    // Pre-load animasi success untuk login (HIGH PRIORITY)
    preloadAnimation('/lottie/success.json')
    
    // Pre-load rocket animation untuk page loading (HIGH PRIORITY)
    preloadAnimation('/lottie/Businessman flies up with rocket.json')
    
    // Pre-load animasi lain yang sering dipakai jika ada
    // preloadAnimation('/lottie/loading.json')
  }, { timeout: 100 }) // INSTANT - minimal timeout
}
