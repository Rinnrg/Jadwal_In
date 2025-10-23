import { NextRequest, NextResponse } from 'next/server'
import { getGoogleAuthUrl } from '@/lib/google-auth'

// Endpoint to initiate Google OAuth
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
    
    // Generate Google OAuth URL
    const authUrl = getGoogleAuthUrl()
    
    // Store callbackUrl in cookie for after auth
    const response = NextResponse.redirect(authUrl)
    response.cookies.set('google_callback_url', callbackUrl, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
    })
    
    return response
  } catch (error) {
    console.error('Error initiating Google auth:', error)
    return NextResponse.json(
      { error: 'Failed to initiate Google authentication' },
      { status: 500 }
    )
  }
}
