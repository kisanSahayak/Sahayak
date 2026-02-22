import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAuthUser } from '@/lib/auth'
import { query } from '@/lib/db'
import Header from '@/components/layout/Header'
import Footer from '@/components/Footer'
import { STATUS_COLORS, STATUS_LABELS, DOCUMENT_TYPE_LABELS } from '@/types'
import type { Document, Notification } from '@/types'

export default async function DashboardPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  // Fetch user profile
  const [profile] = await query<{
    id: string; full_name: string; phone: string; state?: string;
    district?: string; village?: string; land_area_acres?: number; is_verified: boolean; created_at: string
  }>(
    'SELECT id, full_name, phone, state, district, village, land_area_acres, is_verified, created_at FROM users WHERE id = $1',
    [user.userId]
  )

  // Fetch documents
  const documents = await query<Document>(
    'SELECT * FROM documents WHERE user_id = $1 ORDER BY uploaded_at DESC LIMIT 10',
    [user.userId]
  )

  // Fetch recent notifications
  const notifications = await query<Notification>(
    'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
    [user.userId]
  )

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const docStats = {
    total: documents.length,
    verified: documents.filter((d) => d.status === 'verified').length,
    pending: documents.filter((d) => d.status === 'pending' || d.status === 'processing').length,
    rejected: documents.filter((d) => d.status === 'rejected').length,
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={{ fullName: user.fullName, role: user.role }} unreadCount={unreadCount} />

      <main className="flex-1 bg-gray-100">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200 px-4 py-2">
          <div className="max-w-7xl mx-auto text-xs text-gov-text-light">
            <Link href="/" className="hover:text-gov-blue">Home</Link>
            <span className="mx-2">›</span>
            <span className="text-gov-blue font-semibold">My Dashboard</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">

          {/* Welcome banner */}
          <div className="bg-gov-blue text-white rounded shadow-card px-6 py-4 mb-6 flex justify-between items-center">
            <div>
              <h1 className="font-bold text-lg">Welcome, {profile?.full_name}</h1>
              <p className="text-blue-200 text-sm mt-0.5">
                {profile?.state && profile?.district ? `${profile.village || ''} ${profile.district}, ${profile.state}` : 'Complete your profile to get scheme recommendations'}
              </p>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${profile?.is_verified ? 'bg-green-500' : 'bg-yellow-500'} text-white`}>
                {profile?.is_verified ? '✓ Verified' : '⏳ Pending Verification'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Main left area */}
            <div className="lg:col-span-2 space-y-6">

              {/* Document Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Total Uploaded', value: docStats.total, color: 'border-gov-blue', textColor: 'text-gov-blue' },
                  { label: 'Verified', value: docStats.verified, color: 'border-green-500', textColor: 'text-green-600' },
                  { label: 'In Process', value: docStats.pending, color: 'border-gov-orange', textColor: 'text-gov-orange-dark' },
                  { label: 'Rejected', value: docStats.rejected, color: 'border-red-500', textColor: 'text-red-600' },
                ].map((stat) => (
                  <div key={stat.label} className={`gov-card p-4 border-l-4 ${stat.color} text-center`}>
                    <div className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</div>
                    <div className="text-xs text-gov-text-light mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Documents Table */}
              <div className="gov-card">
                <div className="border-b-2 border-gov-blue px-5 py-3 flex justify-between items-center">
                  <h2 className="font-bold text-gov-blue uppercase tracking-wide text-sm">MY DOCUMENTS</h2>
                  <Link href="/upload" className="gov-btn-primary text-xs px-3 py-1.5">
                    + Upload New
                  </Link>
                </div>

                {documents.length === 0 ? (
                  <div className="p-8 text-center text-gov-text-light">
                    <div className="text-4xl mb-3">📭</div>
                    <p className="font-semibold">No documents uploaded yet</p>
                    <p className="text-sm mt-1">Upload your documents to apply for schemes</p>
                    <Link href="/upload" className="gov-btn-primary inline-block mt-4">
                      Upload Documents
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left px-5 py-3 text-xs text-gov-text-light font-semibold uppercase">Document</th>
                          <th className="text-left px-5 py-3 text-xs text-gov-text-light font-semibold uppercase">File</th>
                          <th className="text-left px-5 py-3 text-xs text-gov-text-light font-semibold uppercase">Status</th>
                          <th className="text-left px-5 py-3 text-xs text-gov-text-light font-semibold uppercase">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {documents.map((doc, i) => (
                          <tr key={doc.id} className={`border-b border-gray-100 hover:bg-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                            <td className="px-5 py-3 font-medium text-gov-text">
                              {DOCUMENT_TYPE_LABELS[doc.doc_type as keyof typeof DOCUMENT_TYPE_LABELS] || doc.doc_type}
                            </td>
                            <td className="px-5 py-3 text-gov-text-light text-xs truncate max-w-32">{doc.file_name}</td>
                            <td className="px-5 py-3">
                              <span className={`status-badge ${STATUS_COLORS[doc.status]}`}>
                                {STATUS_LABELS[doc.status]}
                              </span>
                              {doc.admin_remarks && (
                                <p className="text-xs text-red-600 mt-1">{doc.admin_remarks}</p>
                              )}
                            </td>
                            <td className="px-5 py-3 text-gov-text-light text-xs whitespace-nowrap">
                              {new Date(doc.uploaded_at).toLocaleDateString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right sidebar */}
            <div className="space-y-6">

              {/* Profile Summary */}
              <div className="gov-card">
                <div className="border-b-2 border-gov-blue px-5 py-3">
                  <h2 className="font-bold text-gov-blue uppercase tracking-wide text-sm">MY PROFILE</h2>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gov-blue rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {profile?.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-gov-text">{profile?.full_name}</div>
                      <div className="text-xs text-gov-text-light">📱 +91 {profile?.phone}</div>
                    </div>
                  </div>

                  {profile?.land_area_acres && (
                    <div className="text-sm bg-green-50 rounded p-3">
                      <span className="text-gov-text-light">Land Area:</span>{' '}
                      <span className="font-semibold text-gov-green">{profile.land_area_acres} Acres</span>
                    </div>
                  )}

                  <div className="text-xs text-gov-text-light border-t pt-2">
                    Registered on {new Date(profile?.created_at || '').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Recent Notifications */}
              <div className="gov-card">
                <div className="border-b-2 border-gov-blue px-5 py-3 flex justify-between items-center">
                  <h2 className="font-bold text-gov-blue uppercase tracking-wide text-sm">NOTIFICATIONS</h2>
                  <Link href="/notifications" className="text-xs text-gov-blue hover:underline">
                    View All
                  </Link>
                </div>
                <div className="divide-y divide-gray-100">
                  {notifications.length === 0 ? (
                    <p className="p-5 text-sm text-gov-text-light text-center">No notifications yet</p>
                  ) : (
                    notifications.slice(0, 4).map((n) => (
                      <div key={n.id} className={`px-5 py-3 ${!n.is_read ? 'bg-blue-50' : ''}`}>
                        <div className="flex items-start gap-2">
                          <span className="text-sm mt-0.5">
                            {n.type === 'success' ? '✅' : n.type === 'warning' ? '⚠️' : n.type === 'error' ? '❌' : 'ℹ️'}
                          </span>
                          <div>
                            <p className="text-xs font-semibold text-gov-text">{n.title}</p>
                            <p className="text-xs text-gov-text-light mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(n.created_at).toLocaleDateString('en-IN')}
                            </p>
                          </div>
                          {!n.is_read && (
                            <span className="ml-auto w-2 h-2 bg-gov-blue rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}