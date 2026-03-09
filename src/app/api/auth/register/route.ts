import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { query, queryOne } from '@/lib/db'
import { signToken, setAuthCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { full_name, phone, email, password, state, district, village, land_area_acres, aadhaar_last4 } = body

    // Validate required fields
    if (!full_name || !phone || !password) {
      return NextResponse.json(
        { success: false, error: 'Full name, phone, and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Check if phone already exists
    const existing = await queryOne('SELECT id FROM users WHERE phone = $1', [phone])
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An account with this phone number already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12)

    // Insert user
    const [user] = await query<{ id: string; full_name: string; role: string }>(
      `INSERT INTO users (full_name, phone, email, password_hash, state, district, village, land_area_acres, aadhaar_last4)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, full_name, role`,
      [full_name, phone, email || null, password_hash, state || null, district || null, village || null, land_area_acres || null, aadhaar_last4 || null]
    )

    // Create welcome notification
    await query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)`,
      [user.id, 'Welcome to Farmer Scheme Portal!', `Hello ${full_name}, your account has been created successfully. You can now upload your documents to apply for schemes.`, 'success']
    )

    // Sign JWT and set cookie
    const token = await signToken({ userId: user.id, phone, role: user.role, fullName: user.full_name })
    setAuthCookie(token)

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      data: { userId: user.id, fullName: user.full_name },
    })
    
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}