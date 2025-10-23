import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define public routes that don't require authentication
const publicRoutes = ["/login", "/admin", "/", "/auth"]

// Define protected routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/jadwal",
  "/kehadiran",
  "/subjects",
  "/entry-nilai",
  "/krs",
  "/khs",
  "/asynchronous",
  "/profile",
  "/reminders",
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check both types of authentication
  const manualSessionCookie = request.cookies.get("jadwalin-auth")
  const hasManualSession = manualSessionCookie?.value === "true"
  
  // Check Google OAuth session
  const googleSessionCookie = request.cookies.get("session_token")
  const hasGoogleSession = !!googleSessionCookie?.value
  
  const isAuthenticated = hasManualSession || hasGoogleSession
  
  // Debug log (remove in production)
  console.log(`[Middleware] ${pathname} - Auth: ${isAuthenticated} (manual: ${hasManualSession}, google: ${hasGoogleSession})`)
  
  // If user is on auth path, handle authentication logic
  if (pathname === "/auth") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    } else {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }
  
  // If user is trying to access login/admin while authenticated, redirect to dashboard
  if ((pathname === "/login" || pathname === "/admin") && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }
  
  // Allow access to login page if not authenticated
  if (pathname === "/login" && !isAuthenticated) {
    return NextResponse.next()
  }
  
  // If user is trying to access protected route without authentication, redirect to login
  if (protectedRoutes.some(route => pathname.startsWith(route)) && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
}
