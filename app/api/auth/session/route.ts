import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session_token')?.value

    if (!sessionToken) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    // Find session in database
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            image: true,
          },
        },
      },
    })

    // Check if session exists and not expired
    if (!session || session.expires < new Date()) {
      // Delete expired session
      if (session) {
        await prisma.session.delete({
          where: { id: session.id },
        })
      }
      
      return NextResponse.json({ user: null }, { status: 200 })
    }

    // Return user data
    return NextResponse.json(
      { 
        user: session.user,
        expires: session.expires.toISOString()
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({ user: null }, { status: 200 })
  }
}
