import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const [farmer, documents, landHoldings, bankDetails, category, applications] =
    await Promise.all([
      queryOne('SELECT * FROM users WHERE id = $1', [params.id]),
      query('SELECT * FROM documents WHERE user_id = $1 ORDER BY uploaded_at DESC', [params.id]),
      query('SELECT * FROM land_holdings WHERE user_id = $1', [params.id]),
      query('SELECT * FROM bank_details WHERE user_id = $1', [params.id]),
      queryOne('SELECT * FROM farmer_category WHERE user_id = $1', [params.id]),
      query(
        `SELECT sa.*, s.name as scheme_name, s.short_name, s.benefit_amount
         FROM scheme_applications sa
         JOIN schemes s ON s.id = sa.scheme_id
         WHERE sa.user_id = $1
         ORDER BY sa.applied_at DESC`,
        [params.id]
      ),
    ])

  if (!farmer) {
    return NextResponse.json({ success: false, error: 'Farmer not found' }, { status: 404 })
  }

  return NextResponse.json({
    success: true,
    data: { farmer, documents, landHoldings, bankDetails, category, applications },
  })
}