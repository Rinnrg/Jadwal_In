/**
 * Script to migrate plain text passwords to bcrypt hashed passwords
 * Run with: pnpm tsx scripts/migrate-passwords.ts
 */

import { PrismaClient } from '@/generated/prisma'
import { hashPassword } from '../lib/auth'

const prisma = new PrismaClient()

async function migratePasswords() {
  console.log('🔐 Starting password migration...\n')

  try {
    // Find all users with passwords that are NOT hashed (don't start with $2)
    const users = await prisma.user.findMany({
      where: {
        password: {
          not: null,
        },
      },
    })

    console.log(`📊 Found ${users.length} users with passwords\n`)

    let migrated = 0
    let skipped = 0
    let errors = 0

    for (const user of users) {
      if (!user.password) {
        console.log(`⏭️  Skipping ${user.email} (no password)`)
        skipped++
        continue
      }

      // Skip if already hashed
      if (user.password.startsWith('$2')) {
        console.log(`✅ Skipping ${user.email} (already hashed)`)
        skipped++
        continue
      }

      // Skip super admin
      if (user.role === 'super_admin') {
        console.log(`⏭️  Skipping ${user.email} (super admin - uses hardcoded password)`)
        skipped++
        continue
      }

      try {
        // Hash the password
        const hashedPassword = await hashPassword(user.password)

        // Update in database
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword },
        })

        console.log(`🔒 Migrated ${user.email}`)
        migrated++
      } catch (error) {
        console.error(`❌ Error migrating ${user.email}:`, error)
        errors++
      }
    }

    console.log('\n' + '='.repeat(50))
    console.log('📈 Migration Summary:')
    console.log(`✅ Successfully migrated: ${migrated}`)
    console.log(`⏭️  Skipped: ${skipped}`)
    console.log(`❌ Errors: ${errors}`)
    console.log('='.repeat(50))

    if (migrated > 0) {
      console.log('\n✨ Password migration completed successfully!')
    } else {
      console.log('\nℹ️  No passwords needed migration.')
    }
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
migratePasswords()
