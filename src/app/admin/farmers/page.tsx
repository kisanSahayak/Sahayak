"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

export default function AdminFarmersPage() {
  const [farmers, setFarmers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<any>(null)

  const fetchFarmers = (s = search, p = page) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p) })
    if (s) params.set("search", s)
    fetch(`/api/admin/farmers?${params}`)
      .then(r => r.json())
      .then(d => {
        setFarmers(d.data || [])
        setPagination(d.pagination)
        setLoading(false)
      })
  }

  useEffect(() => { fetchFarmers() }, [page])

  const handleSearch = (e: any) => {
    e.preventDefault()
    setPage(1)
    fetchFarmers(search, 1)
  }

  return (
    <div style={{ padding: "32px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
          Farmers
        </h1>
        <p style={{ color: "#64748b", fontSize: "14px", marginTop: "4px" }}>
          {pagination?.total ?? "—"} registered farmers
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or phone..."
          style={{
            flex: 1, border: "1px solid #d1d5db", borderRadius: "4px",
            padding: "8px 12px", fontSize: "14px",
          }}
        />
        <button type="submit" style={{
          background: "#1a3a5c", color: "#fff", border: "none",
          borderRadius: "4px", padding: "8px 20px", fontSize: "14px", cursor: "pointer",
        }}>
          Search
        </button>
      </form>

      {/* Table */}
      <div style={{
        background: "#fff", borderRadius: "6px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflow: "hidden",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              {["Name", "Phone", "State", "Land (Acres)", "Docs", "Applications", "Registered", ""].map(h => (
                <th key={h} style={{
                  padding: "12px 16px", fontSize: "12px", fontWeight: "600",
                  color: "#64748b", textAlign: "left",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>
                Loading...
              </td></tr>
            ) : farmers.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>
                No farmers found
              </td></tr>
            ) : farmers.map((f, i) => (
              <tr key={f.id} style={{
                borderBottom: "1px solid #f1f5f9",
                background: i % 2 === 0 ? "#fff" : "#fafafa",
              }}>
                <td style={{ padding: "12px 16px", fontSize: "14px", color: "#1e293b", fontWeight: "500" }}>
                  {f.full_name}
                </td>
                <td style={{ padding: "12px 16px", fontSize: "14px", color: "#475569" }}>
                  {f.phone}
                </td>
                <td style={{ padding: "12px 16px", fontSize: "13px", color: "#475569" }}>
                  {f.state || "—"}
                </td>
                <td style={{ padding: "12px 16px", fontSize: "13px", color: "#475569" }}>
                  {f.land_area_acres || "—"}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{
                    background: "#dbeafe", color: "#1d4ed8",
                    padding: "2px 8px", borderRadius: "12px", fontSize: "12px",
                  }}>
                    {f.verified_doc_count}/{f.doc_count}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", fontSize: "13px", color: "#475569" }}>
                  {f.application_count}
                </td>
                <td style={{ padding: "12px 16px", fontSize: "12px", color: "#94a3b8" }}>
                  {new Date(f.created_at).toLocaleDateString('en-IN')}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <Link href={`/admin/farmers/${f.id}`} style={{
                    color: "#2563eb", fontSize: "13px", textDecoration: "none",
                    fontWeight: "500",
                  }}>
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div style={{ display: "flex", gap: "8px", marginTop: "16px", justifyContent: "center" }}>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} style={{
              padding: "6px 12px", border: "1px solid #d1d5db",
              borderRadius: "4px", fontSize: "13px", cursor: "pointer",
              background: p === page ? "#1a3a5c" : "#fff",
              color: p === page ? "#fff" : "#374151",
            }}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}