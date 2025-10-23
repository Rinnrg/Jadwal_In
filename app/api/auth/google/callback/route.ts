import { NextRequest, NextResponse } from 'next/server'
import { getGoogleUserInfo } from '@/lib/google-auth'
import { PrismaClient } from '@/generated/prisma'
import { randomBytes } from 'crypto'

const prisma = new PrismaClient()

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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
    })

    if (!user) {
      console.log('➕ Creating new user...')
      // Create new user
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name || googleUser.email.split('@')[0],
          role: 'mahasiswa', // Default role
          googleId: googleUser.googleId,
          image: googleUser.picture,
        },
      })
      console.log('✅ User created:', user.id)
    } else if (!user.googleId) {
      console.log('🔄 Updating existing user with Google ID...')
      // Update existing user with Google ID
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: googleUser.googleId,
          image: googleUser.picture || user.image,
        },
      })
      console.log('✅ User updated:', user.id)
    } else {
      console.log('✅ User found:', user.id)
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
