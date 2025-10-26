/**
 * Script to fix NIM for existing Google Auth users
 * 
 * Problem: Previous Google callback extracted short NIM (5 digits like "22002")
 * but E-KTM QR code generates full NIM (11 digits like "22050974002")
 * 
 * Solution: Reconstruct full NIM from email for all Google Auth users
 */

import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

// Helper function to extract and reconstruct full NIM from email
function extractNIMFromEmail(email: string): string | null {
  // Format email: namapertamanamakedua.22002@mhs.unesa.ac.id
  // From .22002 we extract: year(22) + sequence(002)
  // Full NIM: year(22) + faculty(05) + program(0974) + sequence(002) = 22050974002
  const emailParts = email.split('@')[0]
  const parts = emailParts.split('.')
  
  if (parts.length >= 2) {
    const nimPart = parts[1] // "22002"
    if (nimPart && /^\d{5,}$/.test(nimPart)) { // At least 5 digits
      // Extract year (first 2 digits) and sequence number (last 3 digits)
      const tahun = nimPart.substring(0, 2) // "22"
      const nomorUrut = nimPart.substring(2) // "002"
      
      // Reconstruct full NIM with default faculty and program codes
      const kodeFakultas = "05"
      const kodeProdi = "0974"
      
      return `${tahun}${kodeFakultas}${kodeProdi}${nomorUrut}` // "22050974002"
    }
  }
  
  // Check if email prefix is already a full NIM (numeric)
  if (/^\d{8,}$/.test(emailParts)) {
    return emailParts
  }
  
  return null
}

async function main() {
  console.log('🔍 Finding Google Auth users with profiles...')
  
  // Find all users who logged in with Google Auth and have profiles
  const googleUsers = await prisma.user.findMany({
    where: {
      googleId: { not: null },
      profile: { isNot: null }
    },
    include: {
      profile: true
    }
  })
  
  console.log(`📊 Found ${googleUsers.length} Google Auth users with profiles`)
  
  let updatedCount = 0
  let skippedCount = 0
  
  for (const user of googleUsers) {
    if (!user.profile) continue
    
    const currentNIM = user.profile.nim
    const reconstructedNIM = extractNIMFromEmail(user.email)
    
    console.log(`\n👤 User: ${user.email}`)
    console.log(`   Current NIM: ${currentNIM || 'null'}`)
    console.log(`   Reconstructed NIM: ${reconstructedNIM || 'null'}`)
    
    // Update if:
    // 1. Current NIM is null, or
    // 2. Current NIM is short (less than 8 digits), or
    // 3. Current NIM is different from reconstructed
    const shouldUpdate = 
      !currentNIM || 
      currentNIM.length < 8 || 
      (reconstructedNIM && currentNIM !== reconstructedNIM)
    
    if (shouldUpdate && reconstructedNIM) {
      console.log(`   ✅ Updating NIM to: ${reconstructedNIM}`)
      
      await prisma.profile.update({
        where: { id: user.profile.id },
        data: { nim: reconstructedNIM }
      })
      
      updatedCount++
    } else {
      console.log(`   ⏭️  Skipped (NIM is already correct)`)
      skippedCount++
    }
  }
  
  console.log(`\n✅ Migration completed!`)
  console.log(`   Updated: ${updatedCount} profiles`)
  console.log(`   Skipped: ${skippedCount} profiles`)
}

main()
  .catch((error) => {
    console.error('❌ Error during migration:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
