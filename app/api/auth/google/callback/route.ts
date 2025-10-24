import { NextRequest, NextResponse } from 'next/server'
import { getGoogleUserInfo } from '@/lib/google-auth'
import { PrismaClient } from '@/generated/prisma'
import { randomBytes } from 'crypto'

const prisma = new PrismaClient()

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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
      
      // Extract NIM from email if it's from student domain
      // Format 1: NIM@mhs.unesa.ac.id (e.g., 22050974001@mhs.unesa.ac.id)
      // Format 2: name.NIM@mhs.unesa.ac.id (e.g., muhammadhamdan.22034@mhs.unesa.ac.id)
      let extractedNim: string | null = null
      const emailPrefix = googleUser.email.split('@')[0]
      
      // Check if email prefix contains a dot (format 2)
      if (emailPrefix.includes('.')) {
        const parts = emailPrefix.split('.')
        const lastPart = parts[parts.length - 1]
        // Check if the last part after dot is numeric
        if (/^\d+$/.test(lastPart)) {
          extractedNim = lastPart
          console.log('✅ NIM extracted from email (format 2):', extractedNim)
        }
      } 
      // Check if email prefix is numeric (format 1)
      else if (/^\d+$/.test(emailPrefix)) {
        extractedNim = emailPrefix
        console.log('✅ NIM extracted from email (format 1):', extractedNim)
      }
      
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
              prodi: null,
              bio: null,
            }
          }
        },
        include: {
          profile: true,
        }
      })
      console.log('✅ User created with profile:', user.id, 'NIM:', extractedNim)
    } else if (!user.googleId) {
      console.log('🔄 Updating existing user with Google ID...')
      
      // Check if user has profile
      const existingProfile = await prisma.profile.findUnique({
        where: { userId: user.id }
      })
      
      // Extract NIM from email if not in profile
      let extractedNim: string | null = null
      if (!existingProfile || !existingProfile.nim) {
        const emailPrefix = googleUser.email.split('@')[0]
        
        // Check if email prefix contains a dot (format: name.NIM@domain)
        if (emailPrefix.includes('.')) {
          const parts = emailPrefix.split('.')
          const lastPart = parts[parts.length - 1]
          if (/^\d+$/.test(lastPart)) {
            extractedNim = lastPart
            console.log('✅ NIM extracted from email (format 2):', extractedNim)
          }
        } 
        // Check if email prefix is numeric (format: NIM@domain)
        else if (/^\d+$/.test(emailPrefix)) {
          extractedNim = emailPrefix
          console.log('✅ NIM extracted from email (format 1):', extractedNim)
        }
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
              }
            } : undefined
          ) : {
            create: {
              nim: extractedNim,
              angkatan: extractAngkatan(extractedNim),
              kelas: 'A',
              prodi: null,
              bio: null,
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
      
      // Update image if Google has newer one
      if (googleUser.picture && user.image !== googleUser.picture) {
        console.log('🖼️ Updating user image from Google...')
        user = await prisma.user.update({
          where: { id: user.id },
          data: { image: googleUser.picture },
          include: { profile: true },
        })
      }
      
      // Check if user has profile, if not create one
      if (!user.profile) {
        console.log('⚠️ User has no profile, creating...')
        const emailPrefix = googleUser.email.split('@')[0]
        let extractedNim: string | null = null
        
        // Check if email prefix contains a dot (format: name.NIM@domain)
        if (emailPrefix.includes('.')) {
          const parts = emailPrefix.split('.')
          const lastPart = parts[parts.length - 1]
          if (/^\d+$/.test(lastPart)) {
            extractedNim = lastPart
            console.log('✅ NIM extracted from email (format 2):', extractedNim)
          }
        } 
        // Check if email prefix is numeric (format: NIM@domain)
        else if (/^\d+$/.test(emailPrefix)) {
          extractedNim = emailPrefix
          console.log('✅ NIM extracted from email (format 1):', extractedNim)
        }
        
        await prisma.profile.create({
          data: {
            userId: user.id,
            nim: extractedNim,
            angkatan: extractAngkatan(extractedNim),
            kelas: 'A',
            prodi: null,
            bio: null,
          }
        })
        
        // Reload user with profile
        user = await prisma.user.findUnique({
          where: { id: user.id },
          include: { profile: true },
        }) as any
        
        console.log('✅ Profile created for existing user')
      }
    }

    // Ensure user exists before creating session
    if (!user) {
      console.log('❌ User is null after all operations')
      return NextResponse.redirect(
        new URL('/login?error=user_creation_failed', request.url)
      )
    }

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
