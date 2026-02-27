import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

// GET - fetch all land holdings for farmer
export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const holdings = await query(
    `SELECT lh.*, d.file_name, d.status as doc_status
     FROM land_holdings lh
     LEFT JOIN documents d ON d.id = lh.document_id
     WHERE lh.user_id = $1
     ORDER BY lh.created_at DESC`,
    [user.userId]
  )

  return NextResponse.json({ success: true, data: holdings })
}

// POST - add a land holding
export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const {
    state, district, tehsil, village,
    survey_number, doc_type, total_area_acres,
    irrigated_acres, unirrigated_acres,
    land_type, ownership_type, document_id,
    verified_from,
  } = body

  if (!state || !district || !total_area_acres) {
    return NextResponse.json(
      { success: false, error: 'State, district and land area are required' },
      { status: 400 }
    )
  }

  const [holding] = await query<{ id: string }>(
    `INSERT INTO land_holdings (
       user_id, state, district, tehsil, village,
       survey_number, doc_type, total_area_acres,
       irrigated_acres, unirrigated_acres,
       land_type, ownership_type, document_id, verified_from
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING id`,
    [
      user.userId, state, district, tehsil || null, village || null,
      survey_number || null, doc_type || null, total_area_acres,
      irrigated_acres || null, unirrigated_acres || null,
      land_type || null, ownership_type || 'single',
      document_id || null, verified_from || 'document',
    ]
  )

  // Update total land area on user profile
  await query(
    `UPDATE users SET
       land_area_acres = (
         SELECT COALESCE(SUM(total_area_acres), 0)
         FROM land_holdings WHERE user_id = $1
       )
     WHERE id = $1`,
    [user.userId]
  )

  return NextResponse.json({
    success: true,
    message: 'Land holding added successfully',
    data: { id: holding.id },
  })
}

// PATCH - mark land holding as verified
export async function PATCH(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { id, is_verified, verified_from } = body

  await query(
    `UPDATE land_holdings
     SET is_verified = $1, verified_from = $2
     WHERE id = $3 AND user_id = $4`,
    [is_verified, verified_from || 'document', id, user.userId]
  )

  return NextResponse.json({ success: true, message: 'Land holding updated' })
}