import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
)

const PROTECTED_ROUTES = ['/dashboard', '/upload', '/notifications']
const AUTH_ROUTES = ['/login', '/register']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('auth_token')?.value

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r))
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r))

  let isValidToken = false
  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET)
      isValidToken = true
    } catch {
      isValidToken = false
    }
  }

  if (isProtected && !isValidToken) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  if (isAuthRoute && isValidToken) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/upload/:path*', '/notifications/:path*', '/login', '/register'],
}