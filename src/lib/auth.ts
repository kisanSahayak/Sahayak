import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
)

export interface JWTPayload {
  userId: string
  phone: string
  role: string
  fullName: string
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

// Set cookie based on user role
export function setAuthCookie(token: string, role: string) {
  const cookieName = role === 'admin' ? 'admin_session' : 'farmer_session'
  
  // Set the role-specific cookie
  cookies().set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
  
  // Clear the other role's cookie to prevent conflicts
  const otherCookie = role === 'admin' ? 'farmer_session' : 'admin_session'
  cookies().set(otherCookie, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  
  // Also clear the old auth_token for backward compatibility
  cookies().set('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
}

// Clear all auth cookies
export function clearAuthCookies() {
  cookies().set('farmer_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  
  cookies().set('admin_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  
  cookies().set('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
}

// Get the current authenticated user
export async function getAuthUser(): Promise<JWTPayload | null> {
  // Check for farmer session first
  const farmerToken = cookies().get('farmer_session')?.value
  if (farmerToken) {
    const payload = await verifyToken(farmerToken)
    if (payload) return payload
  }
  
  // Then check for admin session
  const adminToken = cookies().get('admin_session')?.value
  if (adminToken) {
    const payload = await verifyToken(adminToken)
    if (payload) return payload
  }
  
  // Fallback to old auth_token for backward compatibility
  const oldToken = cookies().get('auth_token')?.value
  if (oldToken) {
    const payload = await verifyToken(oldToken)
    if (payload) {
      // Migrate to new cookie format
      setAuthCookie(oldToken, payload.role)
      return payload
    }
  }
  
  return null
}

// Check if a specific type of user is logged in
export async function checkFarmerAuth(): Promise<JWTPayload | null> {
  const token = cookies().get('farmer_session')?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (payload && payload.role === 'farmer') return payload
  return null
}

export async function checkAdminAuth(): Promise<JWTPayload | null> {
  const token = cookies().get('admin_session')?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (payload && payload.role === 'admin') return payload
  return null
}

export async function getUserRole(): Promise<'admin' | 'farmer' | null> {
  const farmerToken = cookies().get('farmer_session')?.value
  if (farmerToken) {
    const payload = await verifyToken(farmerToken)
    if (payload && payload.role === 'farmer') return 'farmer'
  }
  
  const adminToken = cookies().get('admin_session')?.value
  if (adminToken) {
    const payload = await verifyToken(adminToken)
    if (payload && payload.role === 'admin') return 'admin'
  }
  
  return null
}