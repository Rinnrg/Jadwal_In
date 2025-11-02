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

    // Note: Database session verification disabled - no Session model in schema
    // Session is cookie-based only in current implementation
    // For production, implement proper session management or use NextAuth.js
    
    // Return null user since we can't verify session without database model
    return NextResponse.json({ user: null }, { status: 200 })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({ user: null }, { status: 200 })
  }
}
