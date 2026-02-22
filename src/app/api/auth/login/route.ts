import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { queryOne } from '@/lib/db'
import { signToken, setAuthCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, password } = body

    if (!phone || !password) {
      return NextResponse.json(
        { success: false, error: 'Phone and password are required' },
        { status: 400 }
      )
    }

    // Find user
    const user = await queryOne<{
      id: string
      full_name: string
      phone: string
      password_hash: string
      role: string
      is_verified: boolean
    }>('SELECT id, full_name, phone, password_hash, role, is_verified FROM users WHERE phone = $1', [phone])

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number or password' },
        { status: 401 }
      )
    }

    // Sign JWT and set cookie
    const token = await signToken({
      userId: user.id,
      phone: user.phone,
      role: user.role,
      fullName: user.full_name,
    })
    setAuthCookie(token)

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: { userId: user.id, fullName: user.full_name, role: user.role },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}