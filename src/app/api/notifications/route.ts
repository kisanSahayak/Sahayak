import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

// GET - list notifications
export async function GET(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const unreadOnly = searchParams.get('unread') === 'true'

  const whereClause = unreadOnly
    ? 'WHERE user_id = $1 AND is_read = false'
    : 'WHERE user_id = $1'

  const notifications = await query(
    `SELECT id, title, message, type, is_read, link, created_at
     FROM notifications ${whereClause} ORDER BY created_at DESC LIMIT 50`,
    [user.userId]
  )

  const unreadCount = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
    [user.userId]
  )

  return NextResponse.json({
    success: true,
    data: {
      notifications,
      unreadCount: parseInt(unreadCount[0]?.count || '0'),
    },
  })
}

// PATCH - mark notifications as read
export async function PATCH(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { ids, markAll } = body

  if (markAll) {
    await query('UPDATE notifications SET is_read = true WHERE user_id = $1', [user.userId])
  } else if (ids && Array.isArray(ids)) {
    await query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND id = ANY($2::uuid[])',
      [user.userId, ids]
    )
  }

  return NextResponse.json({ success: true, message: 'Notifications marked as read' })
}