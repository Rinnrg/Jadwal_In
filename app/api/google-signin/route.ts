import { NextResponse } from "next/server"

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  // Get base URL from environment or fallback
  const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000'
  
  // Redirect langsung ke Google OAuth
  const googleAuthUrl = `/api/auth/google/signin?callbackUrl=${encodeURIComponent('/dashboard')}`
  return NextResponse.redirect(new URL(googleAuthUrl, baseUrl))
}
