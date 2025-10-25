/**
 * Clear Old KRS LocalStorage Data
 * 
 * Run this in browser console to clear old localStorage data
 * This ensures the app uses database only
 */

function clearOldKrsData() {
  console.log('=== Clearing Old KRS Data ===')
  
  // Check what's in localStorage
  const keys = Object.keys(localStorage)
  console.log('LocalStorage keys:', keys)
  
  // Clear all jadwalin keys
  const jadwalinKeys = keys.filter(k => k.startsWith('jadwalin:'))
  console.log('Jadwalin keys to clear:', jadwalinKeys)
  
  jadwalinKeys.forEach(key => {
    console.log(`Removing: ${key}`)
    localStorage.removeItem(key)
  })
  
  console.log('✅ Cleared all old KRS data')
  console.log('🔄 Please refresh the page')
}

// Auto-run
clearOldKrsData()
