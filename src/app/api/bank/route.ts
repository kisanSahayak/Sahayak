import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

// GET - fetch bank details
export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const details = await query(
    `SELECT bd.*, d.file_name, d.status as doc_status
     FROM bank_details bd
     LEFT JOIN documents d ON d.id = bd.document_id
     WHERE bd.user_id = $1
     ORDER BY bd.created_at DESC`,
    [user.userId]
  )

  return NextResponse.json({ success: true, data: details })
}

// POST - add bank details
export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const {
    account_holder_name, bank_name, branch_name,
    account_number, ifsc_code, account_type,
    is_aadhaar_linked, document_id,
  } = body

  if (!account_number || !ifsc_code) {
    return NextResponse.json(
      { success: false, error: 'Account number and IFSC code are required' },
      { status: 400 }
    )
  }

  // Validate IFSC format
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc_code)) {
    return NextResponse.json(
      { success: false, error: 'Invalid IFSC code format' },
      { status: 400 }
    )
  }

  // Check for duplicate account
  const existing = await query(
    'SELECT id FROM bank_details WHERE user_id = $1 AND account_number = $2',
    [user.userId, account_number]
  )
  if (existing.length > 0) {
    return NextResponse.json(
      { success: false, error: 'This account number is already saved' },
      { status: 409 }
    )
  }

  const [detail] = await query<{ id: string }>(
    `INSERT INTO bank_details (
       user_id, account_holder_name, bank_name, branch_name,
       account_number, ifsc_code, account_type,
       is_aadhaar_linked, document_id
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING id`,
    [
      user.userId,
      account_holder_name || null,
      bank_name || null,
      branch_name || null,
      account_number,
      ifsc_code.toUpperCase(),
      account_type || 'savings',
      is_aadhaar_linked || false,
      document_id || null,
    ]
  )

  return NextResponse.json({
    success: true,
    message: 'Bank details saved successfully',
    data: { id: detail.id },
  })
}