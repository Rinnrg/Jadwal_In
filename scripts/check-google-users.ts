/**
 * Script to check Google Auth users and their NIM values
 */

import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking Google Auth users...\n')
  
  const profiles = await prisma.profile.findMany({
    where: {
      user: {
        googleId: { not: null }
      }
    },
    include: {
      user: {
        select: {
          email: true,
          googleId: true,
          name: true
        }
      }
    }
  })
  
  console.log(`📊 Found ${profiles.length} Google Auth users with profiles:\n`)
  
  profiles.forEach((p, index) => {
    console.log(`${index + 1}. ${p.user.name}`)
    console.log(`   Email: ${p.user.email}`)
    console.log(`   NIM: ${p.nim || 'NULL'}`)
    console.log(`   UserID: ${p.userId}`)
    console.log(`   Avatar: ${p.avatarUrl ? 'Yes' : 'No'}`)
    console.log('')
  })
  
  // Check if any NIM is null or invalid
  const invalidProfiles = profiles.filter(p => !p.nim || p.nim.length < 8)
  if (invalidProfiles.length > 0) {
    console.log(`⚠️  Warning: ${invalidProfiles.length} profile(s) have invalid NIM:`)
    invalidProfiles.forEach(p => {
      console.log(`   - ${p.user.email}: NIM = ${p.nim || 'NULL'}`)
    })
  } else {
    console.log('✅ All Google Auth users have valid NIMs!')
  }
}

main()
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
