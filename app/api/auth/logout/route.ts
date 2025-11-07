import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Note: Database session deletion disabled - no Session model in schema
    // Session is cookie-based only in current implementation
    // For production, implement proper session management or use NextAuth.js

    // Create response
    const response = NextResponse.json({ success: true })

    // Clear all auth cookies
    const cookieOptions = {
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    }

    // Clear session_token (Google OAuth and manual login)
    response.cookies.set('session_token', '', cookieOptions)
    
    // Clear user_id cookie
    response.cookies.set('user_id', '', cookieOptions)
    
    // Clear jadwalin-auth (manual login legacy)
    response.cookies.set('jadwalin-auth', '', cookieOptions)

    return response
  } catch (error) {
    console.log('Logout error (returning success anyway):', error)
    
    // Always return success response to prevent error page
    const response = NextResponse.json(
      { success: true, message: 'Logout berhasil' },
      { status: 200 }
    )
    
    const cookieOptions = {
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    }
    
    response.cookies.set('session_token', '', cookieOptions)
    response.cookies.set('user_id', '', cookieOptions)
    response.cookies.set('jadwalin-auth', '', cookieOptions)
    
    return response
  }
}
