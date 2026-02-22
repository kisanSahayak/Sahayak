'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/Footer'
import type { Notification } from '@/types'

const TYPE_STYLES: Record<string, { icon: string; bg: string; border: string }> = {
  success: { icon: '✅', bg: 'bg-green-50', border: 'border-green-200' },
  warning: { icon: '⚠️', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  error: { icon: '❌', bg: 'bg-red-50', border: 'border-red-200' },
  info: { icon: 'ℹ️', bg: 'bg-blue-50', border: 'border-blue-200' },
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const fetchNotifications = async (unreadOnly = false) => {
    setLoading(true)
    const res = await fetch(`/api/notifications${unreadOnly ? '?unread=true' : ''}`)
    const data = await res.json()
    if (data.success) {
      setNotifications(data.data.notifications)
      setUnreadCount(data.data.unreadCount)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchNotifications(filter === 'unread')
  }, [filter])

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true }),
    })
    fetchNotifications(filter === 'unread')
  }

  const markOneRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    })
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    )
    setUnreadCount((c) => Math.max(0, c - 1))
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header unreadCount={unreadCount} />

      <main className="flex-1 bg-gray-100">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200 px-4 py-2">
          <div className="max-w-7xl mx-auto text-xs text-gov-text-light">
            <Link href="/" className="hover:text-gov-blue">Home</Link>
            <span className="mx-2">›</span>
            <Link href="/dashboard" className="hover:text-gov-blue">Dashboard</Link>
            <span className="mx-2">›</span>
            <span className="text-gov-blue font-semibold">Notifications</span>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="gov-card overflow-hidden">
            {/* Header */}
            <div className="bg-gov-blue px-6 py-4 flex justify-between items-center">
              <div>
                <h1 className="text-white font-bold text-lg">NOTIFICATIONS</h1>
                <p className="text-blue-200 text-xs mt-0.5">
                  {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                </p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-blue-200 hover:text-white border border-blue-400 hover:border-white px-3 py-1.5 rounded transition-colors"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Filter tabs */}
            <div className="border-b border-gray-200 flex">
              {(['all', 'unread'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-6 py-3 text-sm font-semibold capitalize border-b-2 transition-colors ${
                    filter === f
                      ? 'border-gov-blue text-gov-blue'
                      : 'border-transparent text-gov-text-light hover:text-gov-text'
                  }`}
                >
                  {f === 'all' ? 'All Notifications' : `Unread (${unreadCount})`}
                </button>
              ))}
            </div>

            {/* List */}
            {loading ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-4 border-gov-blue border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-gov-text-light mt-3">Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center text-gov-text-light">
                <div className="text-5xl mb-3">🔔</div>
                <p className="font-semibold">No notifications</p>
                <p className="text-sm mt-1">
                  {filter === 'unread' ? 'You have no unread notifications.' : 'You have no notifications yet.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((n) => {
                  const style = TYPE_STYLES[n.type] || TYPE_STYLES.info
                  return (
                    <div
                      key={n.id}
                      className={`px-6 py-4 flex gap-4 transition-colors ${
                        !n.is_read ? 'bg-blue-50/60 hover:bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full ${style.bg} border ${style.border} flex items-center justify-center flex-shrink-0 text-lg`}>
                        {style.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-semibold text-gov-text ${!n.is_read ? 'text-gov-blue' : ''}`}>
                            {n.title}
                          </p>
                          {!n.is_read && (
                            <button
                              onClick={() => markOneRead(n.id)}
                              className="text-xs text-gov-text-light hover:text-gov-blue whitespace-nowrap flex-shrink-0"
                              title="Mark as read"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-gov-text-light mt-1">{n.message}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <p className="text-xs text-gray-400">
                            {new Date(n.created_at).toLocaleString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                          {n.link && (
                            <Link href={n.link} className="text-xs text-gov-blue hover:underline">
                              View Details →
                            </Link>
                          )}
                        </div>
                      </div>
                      {!n.is_read && (
                        <div className="w-2 h-2 bg-gov-blue rounded-full mt-2 flex-shrink-0" />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}