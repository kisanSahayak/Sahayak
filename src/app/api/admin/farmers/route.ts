import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

export async function GET(request: NextRequest) {
  const user = await getAuthUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 20
  const offset = (page - 1) * limit
  const search = searchParams.get('search') || ''

  const farmers = await query(
    `SELECT 
       u.id, u.full_name, u.phone, u.email, u.state, u.district, u.village,
       u.land_area_acres, u.aadhaar_last4, u.created_at,
       COUNT(DISTINCT d.id) as doc_count,
       COUNT(DISTINCT CASE WHEN d.status = 'ocr_done' THEN d.id END) as verified_doc_count,
       COUNT(DISTINCT sa.id) as application_count
     FROM users u
     LEFT JOIN documents d ON d.user_id = u.id
     LEFT JOIN scheme_applications sa ON sa.user_id = u.id
     WHERE u.role = 'farmer'
     ${search ? "AND (u.full_name ILIKE $3 OR u.phone ILIKE $3)" : ''}
     GROUP BY u.id
     ORDER BY u.created_at DESC
     LIMIT $1 OFFSET $2`,
    search ? [limit, offset, `%${search}%`] : [limit, offset]
  )

  const totalResult = await queryOne(
    `SELECT COUNT(*) as count FROM users WHERE role = 'farmer'
     ${search ? "AND (full_name ILIKE $1 OR phone ILIKE $1)" : ''}`,
    search ? [`%${search}%`] : []
  ) as any

  return NextResponse.json({
    success: true,
    data: farmers,
    pagination: {
      page,
      limit,
      total: parseInt(totalResult.count),
      pages: Math.ceil(parseInt(totalResult.count) / limit),
    },
  })
}