'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  user?: { fullName: string; role: string } | null
  unreadCount?: number
}

export default function Header({ user, unreadCount = 0 }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Top Tricolor Strip */}
      <div className="top-strip" />

      {/* Utility Bar */}
      <div className="utility-bar">
        <div className="content-area util-inner">
          <span>Ministry of Agriculture & Farmers Welfare, Government of India</span>
          <div className="lang-switch">
            <span>English</span>
            <span>|</span>
            <span>हिन्दी</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="main-header">
        <div className="content-area header-inner">

          {/* Logo + Title */}
          <Link href="/" className="branding">
            <div className="emblem">
              <span>GOVT.</span>
              <span>INDIA</span>
            </div>

            <div className="title-group">
              <div className="title">KisanSahayak</div>
              <div className="subtitle">Department of Agriculture & Farmers Welfare</div>
            </div>
          </Link>

          {/* Right side */}
          <div className="header-actions">
            {user ? (
              <>
                {/* Notifications */}
                <Link href="/notifications" className="notif-icon">
                  🔔
                  {unreadCount > 0 && (
                    <span className="notif-badge">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* User */}
                <div className="user-menu">
                  <button onClick={() => setMenuOpen(!menuOpen)} className="user-btn">
                    <span className="avatar">
                      {user.fullName.charAt(0).toUpperCase()}
                    </span>
                    <span className="username">{user.fullName}</span>
                    ▼
                  </button>

                  {menuOpen && (
                    <div className="dropdown">
                      <Link href="/dashboard">Dashboard</Link>
                      <Link href="/upload">Upload Documents</Link>
                      <Link href="/notifications">Notifications</Link>
                      <button onClick={handleLogout}>Logout</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="auth-buttons">
                <Link href="/login" className="btn-primary">Login</Link>
                <Link href="/register" className="btn-outline">Register</Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="nav-bar">
        <div className="content-area nav-inner">
          {['Home', 'About', 'Schemes', 'Guidelines', 'Contact'].map((item) => (
            <Link key={item} href="#" className="nav-link">
              {item}
            </Link>
          ))}
        </div>
      </nav>

      {/* News Ticker */}
      <div className="ticker">
        <span className="ticker-label">LATEST</span>
        <div className="ticker-text">
          New scheme applications are now open for 2025-26 | Upload your documents to check eligibility | eKYC is mandatory | Visit CSC for assistance
        </div>
      </div>
    </>
  )
}