import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

const VALID_CROPS = [
  'Wheat',
  'Cotton',
  'Sugarcane',
  'Pulses (Dal)',
  'Maize',
  'Vegetables',
  'Fruits / Horticulture',
  'Oilseeds (Soybean/Groundnut)',
  'Spices',
]

// GET — fetch current crops
export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const result = await queryOne<{ primary_crops: string[] }>(
    'SELECT primary_crops FROM farmer_category WHERE user_id = $1',
    [user.userId]
  )

  return NextResponse.json({
    success: true,
    data: { primary_crops: result?.primary_crops || [] },
  })
}

// POST — save crops
export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { crops } = body

  if (!Array.isArray(crops) || crops.length === 0) {
    return NextResponse.json({ success: false, error: 'Select at least one crop' }, { status: 400 })
  }

  // Validate all crops are from allowed list
  const invalid = crops.filter((c: string) => !VALID_CROPS.includes(c))
  if (invalid.length > 0) {
    return NextResponse.json({ success: false, error: `Invalid crops: ${invalid.join(', ')}` }, { status: 400 })
  }

  // Upsert farmer_category row
  const existing = await queryOne(
    'SELECT id FROM farmer_category WHERE user_id = $1',
    [user.userId]
  )

  if (existing) {
    await query(
      'UPDATE farmer_category SET primary_crops = $1, updated_at = NOW() WHERE user_id = $2',
      [crops, user.userId]
    )
  } else {
    await query(
      'INSERT INTO farmer_category (user_id, primary_crops) VALUES ($1, $2)',
      [user.userId, crops]
    )
  }

  // Send notification if first time setting crops
  const notifExists = await query(
    `SELECT id FROM notifications WHERE user_id = $1 AND title = 'Crop profile updated'`,
    [user.userId]
  )
  if (notifExists.length === 0) {
    await query(
      `INSERT INTO notifications (user_id, title, message, type, link)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        user.userId,
        'Crop profile updated',
        `Your crop selection (${crops.join(', ')}) has been saved. Visit Schemes to see updated recommendations.`,
        'success',
        '/schemes',
      ]
    )
  }

  return NextResponse.json({ success: true, data: { primary_crops: crops } })
}