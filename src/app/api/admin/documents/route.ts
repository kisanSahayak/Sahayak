import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

// GET — list all documents pending verification
export async function GET(request: NextRequest) {
  const user = await getAuthUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'ocr_done'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 20
  const offset = (page - 1) * limit

  const documents = await query(
    `SELECT 
       d.id, d.doc_type, d.status, d.uploaded_at, d.processed_at,
       d.ocr_data,
       u.full_name, u.phone, u.id as user_id
     FROM documents d
     JOIN users u ON u.id = d.user_id
     WHERE d.status = $1
     ORDER BY d.uploaded_at DESC
     LIMIT $2 OFFSET $3`,
    [status, limit, offset]
  )

  const totalResult = await queryOne(
    'SELECT COUNT(*) as count FROM documents WHERE status = $1',
    [status]
  ) as any

  return NextResponse.json({
    success: true,
    data: documents,
    pagination: {
      page,
      limit,
      total: parseInt(totalResult.count),
      pages: Math.ceil(parseInt(totalResult.count) / limit),
    },
  })
}

// PATCH — verify or reject a document
export async function PATCH(request: NextRequest) {
  const user = await getAuthUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { document_id, action, admin_note } = body
  // action: 'verify' | 'reject'

  if (!document_id || !action) {
    return NextResponse.json({ success: false, error: 'document_id and action required' }, { status: 400 })
  }

  const newStatus = action === 'verify' ? 'verified' : 'rejected'

  await query(
    `UPDATE documents 
     SET status = $1, admin_note = $2, reviewed_at = NOW(), reviewed_by = $3
     WHERE id = $4`,
    [newStatus, admin_note || null, user.userId, document_id]
  )

  // If verified — also mark relevant sub-table as verified
  const doc = await queryOne('SELECT * FROM documents WHERE id = $1', [document_id]) as any
  if (doc && action === 'verify') {
    if (doc.doc_type === 'land_record') {
      await query(
        'UPDATE land_holdings SET is_verified = true WHERE document_id = $1',
        [document_id]
      )
    } else if (doc.doc_type === 'bank_passbook') {
      await query(
        'UPDATE bank_details SET is_verified = true WHERE document_id = $1',
        [document_id]
      )
    }
  }

  // Notify farmer
  const notifTitle = action === 'verify'
    ? `${doc.doc_type.replace('_', ' ')} Verified`
    : `${doc.doc_type.replace('_', ' ')} Rejected`
  const notifMsg = action === 'verify'
    ? `Your document has been verified by admin.`
    : `Your document was rejected. Reason: ${admin_note || 'Please re-upload a clearer copy.'}`

  await query(
    `INSERT INTO notifications (user_id, title, message, type, link)
     VALUES ($1, $2, $3, $4, $5)`,
    [doc.user_id, notifTitle, notifMsg, action === 'verify' ? 'success' : 'error', '/upload']
  )

  return NextResponse.json({ success: true, status: newStatus })
}