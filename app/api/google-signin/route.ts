import { NextResponse } from "next/server"

export async function GET() {
  // Redirect langsung ke Google OAuth
  const googleAuthUrl = `/api/auth/signin/google?callbackUrl=${encodeURIComponent('/dashboard')}`
  return NextResponse.redirect(new URL(googleAuthUrl, process.env.NEXTAUTH_URL))
}
