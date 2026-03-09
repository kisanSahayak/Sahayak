import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check for separate cookies
  const farmerToken = request.cookies.get('farmer_session')?.value
  const adminToken = request.cookies.get('admin_session')?.value

  // Farmer routes
  const isFarmerRoute = pathname.startsWith('/dashboard') || 
                        pathname.startsWith('/upload') || 
                        pathname.startsWith('/notifications')
  const isFarmerLogin = pathname === '/login'
  
  // Admin routes
  const isAdminRoute = pathname.startsWith('/admin') && pathname !== '/admin/login'
  const isAdminLogin = pathname === '/admin/login'

  // Verify tokens if they exist
  let farmerData = null
  let adminData = null
  
  if (farmerToken) {
    try {
      const { payload } = await jwtVerify(farmerToken, JWT_SECRET)
      farmerData = payload
    } catch {
      // Invalid farmer token - clear it
      const response = NextResponse.next()
      response.cookies.delete('farmer_session')
      return response
    }
  }
  
  if (adminToken) {
    try {
      const { payload } = await jwtVerify(adminToken, JWT_SECRET)
      adminData = payload
    } catch {
      // Invalid admin token - clear it
      const response = NextResponse.next()
      response.cookies.delete('admin_session')
      return response
    }
  }

  // HANDLE FARMER LOGIN PAGE
  if (isFarmerLogin) {
    // If there's an admin cookie, delete it (fresh start for farmer)
    if (adminToken) {
      const response = NextResponse.next()
      response.cookies.delete('admin_session')
      return response
    }
    
    // If farmer is already logged in, send to dashboard
    if (farmerData) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
    
    // No farmer logged in - show farmer login
    return NextResponse.next()
  }

  // HANDLE ADMIN LOGIN PAGE
  if (isAdminLogin) {
    // If there's a farmer cookie, delete it (fresh start for admin)
    if (farmerToken) {
      const response = NextResponse.next()
      response.cookies.delete('farmer_session')
      return response
    }
    
    // If admin is already logged in, send to admin dashboard
    if (adminData) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }
    
    // No admin logged in - show admin login
    return NextResponse.next()
  }

  // PROTECT FARMER ROUTES
  if (isFarmerRoute) {
    if (!farmerData) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    // Verify this is actually a farmer
    if (farmerData.role !== 'farmer') {
      const response = NextResponse.next()
      response.cookies.delete('farmer_session')
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  // PROTECT ADMIN ROUTES
  if (isAdminRoute) {
    if (!adminData) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }
    // Verify this is actually an admin
    if (adminData.role !== 'admin') {
      const response = NextResponse.next()
      response.cookies.delete('admin_session')
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/upload/:path*',
    '/notifications/:path*',
    '/admin/:path*',
    '/login',
    '/admin/login',
  ],
}