import { NextRequest, NextResponse } from 'next/server'
import { getGoogleUserInfo } from '@/lib/google-auth'
import { PrismaClient } from '@/generated/prisma'
import { randomBytes } from 'crypto'

const prisma = new PrismaClient()

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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

// Helper function to extract angkatan from NIM
function extractAngkatan(nim: string | null): number {
  if (!nim) return new Date().getFullYear()
  
  // Try to extract first 2 or 4 digits as year
  const firstTwoDigits = nim.substring(0, 2)
  const firstFourDigits = nim.substring(0, 4)
  
  // If NIM starts with 4 digits (2020, 2021, etc.)
  if (nim.length >= 4 && firstFourDigits >= '2000' && firstFourDigits <= '2099') {
    return parseInt(firstFourDigits)
  }
  
  // If NIM starts with 2 digits (20, 21, 22, etc.)
  if (nim.length >= 2) {
    const year = parseInt(firstTwoDigits)
    // Assume 20xx for years 00-99
    if (year >= 0 && year <= 99) {
      return 2000 + year
    }
  }
  
  return new Date().getFullYear()
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔵 Google Callback Started')
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    console.log('📥 Received params:', { code: code?.substring(0, 20) + '...', error })

    // Handle user cancellation
    if (error) {
      console.log('❌ User cancelled or error:', error)
      return NextResponse.redirect(
        new URL(`/login?error=${error}`, request.url)
      )
    }

    if (!code) {
      console.log('❌ No authorization code received')
      return NextResponse.redirect(
        new URL('/login?error=no_code', request.url)
      )
    }

    // Get user info from Google
    console.log('🔍 Getting user info from Google...')
    const googleUser = await getGoogleUserInfo(code)
    console.log('✅ Google user info:', { email: googleUser.email, name: googleUser.name })

    if (!googleUser.email) {
      console.log('❌ No email from Google')
      return NextResponse.redirect(
        new URL('/login?error=no_email', request.url)
      )
    }

    // Find or create user in database
    console.log('🔍 Finding user in database...')
    let user = await prisma.user.findUnique({
      where: { email: googleUser.email },
      include: { profile: true },
    })

    if (!user) {
      console.log('➕ Creating new user...')
      
      // Extract full NIM from email using proper reconstruction
      const extractedNim = extractNIMFromEmail(googleUser.email)
      console.log('✅ NIM extracted from email:', extractedNim)
      
      // Create new user with profile
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name || googleUser.email.split('@')[0],
          role: 'mahasiswa', // Default role
          googleId: googleUser.googleId,
          image: googleUser.picture,
          profile: {
            create: {
              nim: extractedNim,
              angkatan: extractAngkatan(extractedNim),
              kelas: 'A', // Default class, can be updated later
              avatarUrl: googleUser.picture, // Sync Google photo to profile
            }
          }
        },
        include: {
          profile: true,
        }
      })
      console.log('✅ User created with profile:', user.id, 'NIM:', extractedNim)
      console.log('✅ Avatar synced to profile:', !!googleUser.picture)
    } else if (!user.googleId) {
      console.log('🔄 Updating existing user with Google ID...')
      
      // Check if user has profile
      const existingProfile = await prisma.profile.findUnique({
        where: { userId: user.id }
      })
      
      // Extract full NIM from email if not in profile
      let extractedNim: string | null = null
      if (!existingProfile || !existingProfile.nim) {
        extractedNim = extractNIMFromEmail(googleUser.email)
        console.log('✅ NIM extracted from email:', extractedNim)
      }
      
      // Update existing user with Google ID and create/update profile
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: googleUser.googleId,
          image: googleUser.picture || user.image,
          profile: existingProfile ? (
            extractedNim && !existingProfile.nim ? {
              update: {
                nim: extractedNim,
                angkatan: extractAngkatan(extractedNim),
                avatarUrl: googleUser.picture, // Sync Google photo
              }
            } : {
              update: {
                avatarUrl: googleUser.picture, // Sync Google photo even if NIM exists
              }
            }
          ) : {
            create: {
              nim: extractedNim,
              angkatan: extractAngkatan(extractedNim),
              kelas: 'A',
              avatarUrl: googleUser.picture, // Sync Google photo
            }
          }
        },
        include: {
          profile: true,
        }
      })
      console.log('✅ User updated:', user.id)
    } else {
      console.log('✅ User found:', user.id)
      
      // Extract NIM from email
      const extractedNim = extractNIMFromEmail(googleUser.email)
      console.log('📧 NIM extracted from email:', extractedNim)
      
      let needsUpdate = false
      const updateData: any = {}
      
      // Update image if Google has newer one
      if (googleUser.picture && user.image !== googleUser.picture) {
        console.log('🖼️ Updating user image from Google...')
        updateData.image = googleUser.picture
        needsUpdate = true
      }
      
      // Check if user has profile, if not create one
      if (!user.profile) {
        console.log('⚠️ User has no profile, creating...')
        updateData.profile = {
          create: {
            nim: extractedNim,
            angkatan: extractAngkatan(extractedNim),
            kelas: 'A',
            avatarUrl: googleUser.picture, // Sync Google photo to profile
          }
        }
        needsUpdate = true
      } else {
        // Check if NIM needs to be updated (null or too short)
        const currentNim = user.profile.nim
        const nimNeedsUpdate = !currentNim || currentNim.length < 8
        
        // Check if avatarUrl needs to be synced from Google picture
        const avatarNeedsUpdate = googleUser.picture && 
          (!user.profile.avatarUrl || user.profile.avatarUrl !== googleUser.picture)
        
        if (nimNeedsUpdate || avatarNeedsUpdate) {
          const profileUpdateData: any = {}
          
          if (nimNeedsUpdate && extractedNim) {
            console.log(`🔄 Updating NIM: "${currentNim || 'NULL'}" → "${extractedNim}"`)
            profileUpdateData.nim = extractedNim
            profileUpdateData.angkatan = extractAngkatan(extractedNim)
          }
          
          if (avatarNeedsUpdate) {
            console.log(`🖼️ Syncing Google photo to profile.avatarUrl`)
            profileUpdateData.avatarUrl = googleUser.picture
          }
          
          updateData.profile = {
            update: profileUpdateData
          }
          needsUpdate = true
        } else {
          console.log(`✅ NIM already valid: ${currentNim}`)
          console.log(`✅ Avatar already synced`)
        }
      }
      
      // Apply updates if needed
      if (needsUpdate) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updateData,
          include: { profile: true },
        })
        console.log('✅ User profile updated with NIM:', user.profile?.nim)
      }
    }

    // Ensure user exists before creating session
    if (!user) {
      console.log('❌ User is null after all operations')
      return NextResponse.redirect(
        new URL('/login?error=user_creation_failed', request.url)
      )
    }

    // Final verification: Log user profile details
    console.log('📊 Final User Profile Status:')
    console.log('   - User ID:', user.id)
    console.log('   - Email:', user.email)
    console.log('   - Has Profile:', !!user.profile)
    console.log('   - NIM:', user.profile?.nim || 'NULL')
    console.log('   - Angkatan:', user.profile?.angkatan || 'NULL')
    console.log('   - Google ID:', user.googleId || 'NULL')

    // Create session token
    console.log('🔐 Creating session...')
    const sessionToken = randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // 30 days

    // Store session in database
    await prisma.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expires: expiresAt,
      },
    })
    console.log('✅ Session created')

    // Get callback URL from cookie
    const callbackUrl = request.cookies.get('google_callback_url')?.value || '/dashboard'
    console.log('🎯 Redirecting to:', callbackUrl)

    // Create response with redirect
    const response = NextResponse.redirect(
      new URL(callbackUrl, request.url)
    )

    // Set session cookie
    console.log('🍪 Setting session cookie:', sessionToken.substring(0, 20) + '...')
    response.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })
    console.log('🍪 Cookie set in response')

    // Clear callback URL cookie
    response.cookies.delete('google_callback_url')

    return response
  } catch (error: any) {
    console.error('❌ Google callback error:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return NextResponse.redirect(
      new URL(`/login?error=callback_failed&details=${encodeURIComponent(error.message)}`, request.url)
    )
  }
}
