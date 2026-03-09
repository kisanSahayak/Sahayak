import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

export async function GET(request: NextRequest) {
  const user = await getAuthUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'applied'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 20
  const offset = (page - 1) * limit

  const applications = await query(
    `SELECT 
       sa.id, sa.status, sa.applied_at, sa.reviewed_at, sa.approved_at,
       sa.disbursed_at, sa.rejection_reason, sa.admin_remarks,
       sa.passed_rules, sa.failed_rules,
       s.name as scheme_name, s.short_name, s.benefit_amount, s.tier,
       u.full_name, u.phone, u.state, u.id as user_id
     FROM scheme_applications sa
     JOIN schemes s ON s.id = sa.scheme_id
     JOIN users u ON u.id = sa.user_id
     WHERE sa.status = $1
     ORDER BY sa.applied_at DESC
     LIMIT $2 OFFSET $3`,
    [status, limit, offset]
  )

  const totalResult = await queryOne(
    'SELECT COUNT(*) as count FROM scheme_applications WHERE status = $1',
    [status]
  ) as any

  return NextResponse.json({
    success: true,
    data: applications,
    pagination: {
      page,
      limit,
      total: parseInt(totalResult.count),
      pages: Math.ceil(parseInt(totalResult.count) / limit),
    },
  })
}

export async function PATCH(request: NextRequest) {
  const user = await getAuthUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { application_id, action, remarks, rejection_reason } = body
  // action: 'approve' | 'reject' | 'disburse'

  if (!application_id || !action) {
    return NextResponse.json({ success: false, error: 'application_id and action required' }, { status: 400 })
  }

  const app = await queryOne(
    `SELECT sa.*, s.name as scheme_name, u.full_name
     FROM scheme_applications sa
     JOIN schemes s ON s.id = sa.scheme_id
     JOIN users u ON u.id = sa.user_id
     WHERE sa.id = $1`,
    [application_id]
  ) as any

  if (!app) {
    return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 })
  }

  let newStatus = ''
  let updateQuery = ''
  let updateParams: any[] = []

  if (action === 'approve') {
    newStatus = 'approved'
    updateQuery = `UPDATE scheme_applications 
                   SET status = 'approved', reviewed_at = NOW(), admin_remarks = $1 
                   WHERE id = $2`
    updateParams = [remarks || null, application_id]
  } else if (action === 'reject') {
    newStatus = 'rejected'
    updateQuery = `UPDATE scheme_applications 
                   SET status = 'rejected', reviewed_at = NOW(), 
                   rejection_reason = $1, admin_remarks = $2 
                   WHERE id = $3`
    updateParams = [rejection_reason || 'Does not meet eligibility criteria', remarks || null, application_id]
  } else if (action === 'disburse') {
    newStatus = 'disbursed'
    updateQuery = `UPDATE scheme_applications 
                   SET status = 'disbursed', disbursed_at = NOW(), admin_remarks = $1 
                   WHERE id = $2`
    updateParams = [remarks || null, application_id]
  }

  await query(updateQuery, updateParams)

  // Notify farmer
  const notifMap: any = {
    approve: {
      title: `${app.scheme_name} Application Approved`,
      message: `Congratulations! Your application for ${app.scheme_name} has been approved.`,
      type: 'success',
    },
    reject: {
      title: `${app.scheme_name} Application Rejected`,
      message: `Your application for ${app.scheme_name} was rejected. Reason: ${rejection_reason || 'Does not meet eligibility criteria'}`,
      type: 'error',
    },
    disburse: {
      title: `${app.scheme_name} Benefit Disbursed`,
      message: `The benefit for ${app.scheme_name} has been disbursed to your registered bank account.`,
      type: 'success',
    },
  }

  const notif = notifMap[action]
  await query(
    `INSERT INTO notifications (user_id, title, message, type, link)
     VALUES ($1, $2, $3, $4, $5)`,
    [app.user_id, notif.title, notif.message, notif.type, '/dashboard']
  )

  return NextResponse.json({ success: true, status: newStatus })
}