"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

function StatCard({ label, value, sub, color, href }: any) {
  return (
    <Link href={href || "#"} style={{ textDecoration: "none" }}>
      <div style={{
        background: "#fff", borderRadius: "6px", padding: "24px",
        borderLeft: `4px solid ${color}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        cursor: href ? "pointer" : "default",
        transition: "box-shadow 0.15s",
      }}>
        <div style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b" }}>{value ?? "—"}</div>
        <div style={{ fontSize: "14px", color: "#64748b", marginTop: "4px" }}>{label}</div>
        {sub && <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>{sub}</div>}
      </div>
    </Link>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(r => r.json())
      .then(d => { setStats(d.data); setLoading(false) })
  }, [])

  return (
    <div style={{ padding: "32px" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
          Dashboard
        </h1>
        <p style={{ color: "#64748b", marginTop: "4px", fontSize: "14px" }}>
          Overview of all farmer activity
        </p>
      </div>

      {loading ? (
        <div style={{ color: "#64748b" }}>Loading stats...</div>
      ) : (
        <>
          {/* Stat Cards */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "16px", marginBottom: "32px",
          }}>
            <StatCard
              label="Total Farmers"
              value={stats?.total_farmers}
              sub={`+${stats?.recent_farmers_7days} this week`}
              color="#3b82f6"
              href="/admin/farmers"
            />
            <StatCard
              label="Documents Pending"
              value={stats?.pending_documents}
              sub="Awaiting admin review"
              color="#f59e0b"
              href="/admin/documents"
            />
            <StatCard
              label="Total Documents"
              value={stats?.total_documents}
              color="#10b981"
              href="/admin/documents"
            />
            <StatCard
              label="Applications Pending"
              value={stats?.pending_applications}
              sub="Awaiting approval"
              color="#8b5cf6"
              href="/admin/applications"
            />
            <StatCard
              label="Total Applications"
              value={stats?.total_applications}
              color="#6366f1"
              href="/admin/applications"
            />
            <StatCard
              label="Disbursed"
              value={stats?.disbursed_applications}
              sub="Benefits sent"
              color="#059669"
              href="/admin/applications?status=disbursed"
            />
          </div>

          {/* Document Status Breakdown */}
          <div style={{
            background: "#fff", borderRadius: "6px",
            padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}>
            <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", marginBottom: "16px" }}>
              Document Status Breakdown
            </h2>
            <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
              {stats?.docs_by_status?.map((row: any) => (
                <div key={row.status} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "24px", fontWeight: "700", color: "#1e293b" }}>
                    {row.count}
                  </div>
                  <div style={{
                    fontSize: "12px", marginTop: "4px",
                    padding: "2px 8px", borderRadius: "12px",
                    background: row.status === 'verified' ? '#dcfce7' :
                      row.status === 'ocr_done' ? '#dbeafe' :
                      row.status === 'pending' ? '#fef9c3' :
                      row.status === 'rejected' ? '#fee2e2' : '#f1f5f9',
                    color: row.status === 'verified' ? '#166534' :
                      row.status === 'ocr_done' ? '#1d4ed8' :
                      row.status === 'pending' ? '#854d0e' :
                      row.status === 'rejected' ? '#991b1b' : '#475569',
                  }}>
                    {row.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}