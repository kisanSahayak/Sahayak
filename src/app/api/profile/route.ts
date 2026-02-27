import { NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

// GET - fetch complete farmer profile in one call
export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  // Run all queries in parallel
  const [profile, landHoldings, bankDetails, category, documents, recentNotifications] =
    await Promise.all([
      queryOne(
        `SELECT id, full_name, phone, email, aadhaar_last4,
                state, district, village, land_area_acres,
                role, is_verified, created_at
         FROM users WHERE id = $1`,
        [user.userId]
      ),
      query(
        `SELECT * FROM land_holdings WHERE user_id = $1 ORDER BY created_at DESC`,
        [user.userId]
      ),
      query(
        `SELECT id, account_holder_name, bank_name, branch_name,
                account_number, ifsc_code, account_type,
                is_aadhaar_linked, is_dbt_enabled, is_verified
         FROM bank_details WHERE user_id = $1 AND is_active = true`,
        [user.userId]
      ),
      queryOne(
        'SELECT * FROM farmer_category WHERE user_id = $1',
        [user.userId]
      ),
      query(
        `SELECT id, doc_type, file_name, status, uploaded_at, ocr_data
         FROM documents WHERE user_id = $1
         ORDER BY uploaded_at DESC`,
        [user.userId]
      ),
      query(
        `SELECT * FROM notifications WHERE user_id = $1
         ORDER BY created_at DESC LIMIT 5`,
        [user.userId]
      ),
    ])

  // Calculate profile completeness score
  const completeness = _calculateCompleteness({
    profile,
    landHoldings,
    bankDetails,
    category,
    documents,
  })

  return NextResponse.json({
    success: true,
    data: {
      profile,
      land_holdings: landHoldings,
      bank_details: bankDetails,
      category,
      documents,
      recent_notifications: recentNotifications,
      completeness,
    },
  })
}

function _calculateCompleteness(data: {
  profile: Record<string, unknown> | null
  landHoldings: Record<string, unknown>[]
  bankDetails: Record<string, unknown>[]
  category: Record<string, unknown> | null
  documents: Record<string, unknown>[]
}) {
  const checks = [
    { label: 'Basic profile', done: !!data.profile?.full_name && !!data.profile?.phone },
    { label: 'Aadhaar number', done: !!data.profile?.aadhaar_last4 },
    { label: 'Land holding added', done: data.landHoldings.length > 0 },
    { label: 'Land record verified', done: data.landHoldings.some((l) => l.is_verified) },
    { label: 'Bank account added', done: data.bankDetails.length > 0 },
    { label: 'Aadhaar-bank linked', done: data.bankDetails.some((b) => b.is_aadhaar_linked) },
    { label: 'Category info filled', done: !!data.category },
    { label: 'Aadhaar uploaded', done: data.documents.some((d) => d.doc_type === 'aadhaar') },
    { label: 'Income certificate', done: data.documents.some((d) => d.doc_type === 'income_certificate') },
  ]

  const done = checks.filter((c) => c.done).length
  const total = checks.length
  const percentage = Math.round((done / total) * 100)

  return {
    percentage,
    done,
    total,
    checks,
  }
}