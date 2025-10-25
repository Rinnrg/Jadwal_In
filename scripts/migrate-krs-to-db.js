/**
 * Migration Script: Migrate KRS from localStorage to Database
 * 
 * This script helps migrate existing KRS data from localStorage to the database.
 * Run this in the browser console on the KRS page after logging in.
 */

async function migrateKrsToDatabase() {
  console.log('[KRS Migration] Starting migration...')
  
  // Get data from localStorage
  const krsData = localStorage.getItem('jadwalin:krs:v2')
  if (!krsData) {
    console.log('[KRS Migration] No KRS data found in localStorage')
    return
  }
  
  let parsedData
  try {
    parsedData = JSON.parse(krsData)
  } catch (error) {
    console.error('[KRS Migration] Error parsing localStorage data:', error)
    return
  }
  
  const krsItems = parsedData?.state?.krsItems || []
  console.log(`[KRS Migration] Found ${krsItems.length} items in localStorage`)
  
  if (krsItems.length === 0) {
    console.log('[KRS Migration] No items to migrate')
    return
  }
  
  // Migrate each item
  let successCount = 0
  let errorCount = 0
  
  for (const item of krsItems) {
    try {
      const response = await fetch('/api/krs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: item.userId,
          subjectId: item.subjectId,
          offeringId: item.offeringId,
          term: item.term,
        }),
      })
      
      if (response.ok) {
        successCount++
        console.log(`[KRS Migration] ✓ Migrated item ${item.id}`)
      } else {
        const error = await response.json()
        if (error.error === 'Mata kuliah sudah ada di KRS') {
          console.log(`[KRS Migration] ⊘ Skipped item ${item.id} (already exists)`)
          successCount++
        } else {
          errorCount++
          console.error(`[KRS Migration] ✗ Failed to migrate item ${item.id}:`, error)
        }
      }
    } catch (error) {
      errorCount++
      console.error(`[KRS Migration] ✗ Error migrating item ${item.id}:`, error)
    }
  }
  
  console.log(`[KRS Migration] Migration complete!`)
  console.log(`[KRS Migration] Success: ${successCount}, Errors: ${errorCount}`)
  
  if (errorCount === 0) {
    console.log('[KRS Migration] All items migrated successfully!')
    console.log('[KRS Migration] You can now safely clear localStorage KRS data')
    console.log('[KRS Migration] Run: localStorage.removeItem("jadwalin:krs:v2")')
  }
}

// Run migration
migrateKrsToDatabase()
