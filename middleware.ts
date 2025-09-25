import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define public routes that don't require authentication
const publicRoutes = ["/login", "/", "/auth"]

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if user has a session
  const sessionCookie = request.cookies.get("jadwalin-auth")
  const hasSession = sessionCookie?.value === "true"
  
  // If user is on auth path, handle authentication logic
  if (pathname === "/auth") {
    if (hasSession) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    } else {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }
  
  // If user is trying to access login while authenticated, redirect to dashboard
  if (pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }
  
  // If user is trying to access protected route without authentication, redirect to login
  if (protectedRoutes.some(route => pathname.startsWith(route)) && !hasSession) {
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
