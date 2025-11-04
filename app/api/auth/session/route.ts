import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session_token')?.value
    const userId = request.cookies.get('user_id')?.value

    if (!sessionToken || !userId) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    // Fetch user data from database using user ID from cookie
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
        prodi: true,
        nim: true,
        nip: true,
        angkatan: true,
        avatarUrl: true,
      }
    })

    if (!user) {
      // User not found in database, clear cookies
      return NextResponse.json({ user: null }, { status: 200 })
    }

    // Return user data for session
    return NextResponse.json({ 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        image: user.image || user.avatarUrl,
        prodi: user.prodi,
      }
    }, { status: 200 })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({ user: null }, { status: 200 })
  }
}
