import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

// GET - fetch farmer category info
export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const category = await queryOne(
    'SELECT * FROM farmer_category WHERE user_id = $1',
    [user.userId]
  )

  return NextResponse.json({ success: true, data: category })
}

// POST - create or update farmer category
export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const {
    caste, caste_category, caste_cert_number,
    annual_income, income_cert_number, income_cert_date,
    is_bpl, ration_card_number, ration_card_type,
    farmer_type, caste_document_id, income_document_id,
  } = body

  // Upsert — create if not exists, update if exists
  await query(
    `INSERT INTO farmer_category (
       user_id, caste, caste_category, caste_cert_number,
       annual_income, income_cert_number, income_cert_date,
       is_bpl, ration_card_number, ration_card_type,
       farmer_type, caste_document_id, income_document_id
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     ON CONFLICT (user_id) DO UPDATE SET
       caste               = EXCLUDED.caste,
       caste_category      = EXCLUDED.caste_category,
       caste_cert_number   = EXCLUDED.caste_cert_number,
       annual_income       = EXCLUDED.annual_income,
       income_cert_number  = EXCLUDED.income_cert_number,
       income_cert_date    = EXCLUDED.income_cert_date,
       is_bpl              = EXCLUDED.is_bpl,
       ration_card_number  = EXCLUDED.ration_card_number,
       ration_card_type    = EXCLUDED.ration_card_type,
       farmer_type         = EXCLUDED.farmer_type,
       caste_document_id   = EXCLUDED.caste_document_id,
       income_document_id  = EXCLUDED.income_document_id,
       updated_at          = NOW()`,
    [
      user.userId,
      caste || null,
      caste_category || null,
      caste_cert_number || null,
      annual_income || null,
      income_cert_number || null,
      income_cert_date || null,
      is_bpl || false,
      ration_card_number || null,
      ration_card_type || null,
      farmer_type || 'owner',
      caste_document_id || null,
      income_document_id || null,
    ]
  )

  // If income certified via document, mark it
  if (income_document_id && annual_income) {
    await query(
      `UPDATE farmer_category SET income_certified = true WHERE user_id = $1`,
      [user.userId]
    )
  }

  if (caste_document_id && caste_category) {
    await query(
      `UPDATE farmer_category SET caste_certified = true WHERE user_id = $1`,
      [user.userId]
    )
  }

  return NextResponse.json({
    success: true,
    message: 'Category information saved successfully',
  })
}