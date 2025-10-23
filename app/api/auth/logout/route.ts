import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Get session token from cookies
    const sessionToken = request.cookies.get('session_token')?.value
    
    // Delete session from database if it exists
    if (sessionToken) {
      try {
        await prisma.session.deleteMany({
          where: {
            sessionToken,
          },
        })
      } catch (error) {
        console.error('Error deleting session from database:', error)
        // Continue with cookie deletion even if DB delete fails
      }
    }

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
    
    // Clear jadwalin-auth (manual login legacy)
    response.cookies.set('jadwalin-auth', '', cookieOptions)

    return response
  } catch (error) {
    console.error('Logout error:', error)
    
    // Even if there's an error, try to clear cookies
    const response = NextResponse.json(
      { error: 'Terjadi kesalahan saat logout' },
      { status: 500 }
    )
    
    const cookieOptions = {
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    }
    
    response.cookies.set('session_token', '', cookieOptions)
    response.cookies.set('jadwalin-auth', '', cookieOptions)
    
    return response
  }
}
