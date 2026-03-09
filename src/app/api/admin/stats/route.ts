import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  const user = await getAuthUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const [
    farmersResult,
    documentsResult,
    pendingDocsResult,
    applicationsResult,
    pendingAppsResult,
    disbursedResult,
  ] = await Promise.all([
    query('SELECT COUNT(*) as count FROM users WHERE role = $1', ['farmer']),
    query('SELECT COUNT(*) as count FROM documents', []),
    query("SELECT COUNT(*) as count FROM documents WHERE status = 'pending'", []),
    query('SELECT COUNT(*) as count FROM scheme_applications', []),
    query("SELECT COUNT(*) as count FROM scheme_applications WHERE status = 'applied'", []),
    query("SELECT COUNT(*) as count FROM scheme_applications WHERE status = 'disbursed'", []),
  ])

  // Recent registrations (last 7 days)
  const recentFarmers = await query(
    `SELECT COUNT(*) as count FROM users 
     WHERE role = 'farmer' AND created_at > NOW() - INTERVAL '7 days'`,
    []
  )

  // Documents by status
  const docsByStatus = await query(
    `SELECT status, COUNT(*) as count FROM documents GROUP BY status`,
    []
  )

  return NextResponse.json({
    success: true,
    data: {
      total_farmers: parseInt((farmersResult[0] as any).count),
      total_documents: parseInt((documentsResult[0] as any).count),
      pending_documents: parseInt((pendingDocsResult[0] as any).count),
      total_applications: parseInt((applicationsResult[0] as any).count),
      pending_applications: parseInt((pendingAppsResult[0] as any).count),
      disbursed_applications: parseInt((disbursedResult[0] as any).count),
      recent_farmers_7days: parseInt((recentFarmers[0] as any).count),
      docs_by_status: docsByStatus,
    },
  })
}