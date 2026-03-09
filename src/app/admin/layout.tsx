"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

const NAV = [
  { href: "/admin", label: "Dashboard"},
  { href: "/admin/farmers", label: "Farmers"},
  { href: "/admin/documents", label: "Documents"},
  { href: "/admin/applications", label: "Applications"},
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  if (pathname === "/admin/login") return <>{children}</>

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/admin/login")
    router.refresh()
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Sidebar */}
      <aside style={{
        width: "240px", background: "#1a2332", color: "#fff",
        display: "flex", flexDirection: "column", flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{
          padding: "24px 20px", borderBottom: "1px solid #2d3f55",
        }}>
          <div style={{ fontSize: "16px", fontWeight: "700", color: "#fff" }}>
            🌾 KisanSahayak
          </div>
          <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
            Admin Panel
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: "16px 0", flex: 1 }}>
          {NAV.map(item => {
            const active = pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href} style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "10px 20px", fontSize: "14px",
                color: active ? "#fff" : "#94a3b8",
                background: active ? "#2d3f55" : "transparent",
                textDecoration: "none",
                borderLeft: active ? "3px solid #3b82f6" : "3px solid transparent",
                transition: "all 0.15s",
              }}>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid #2d3f55" }}>
          <button onClick={handleLogout} style={{
            width: "100%", background: "transparent",
            border: "1px solid #2d3f55", color: "#94a3b8",
            borderRadius: "4px", padding: "8px",
            fontSize: "13px", cursor: "pointer",
          }}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, background: "#f1f5f9", overflowY: "auto" }}>
        {children}
      </main>
    </div>
  )
}