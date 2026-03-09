"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

const STATUS_TABS = ["applied", "approved", "rejected", "disbursed"]

export default function AdminApplicationsPage() {
  const [apps, setApps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState("applied")
  const [pagination, setPagination] = useState<any>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchApps = (s = status) => {
    setLoading(true)
    fetch(`/api/admin/applications?status=${s}`)
      .then(r => r.json())
      .then(d => { setApps(d.data || []); setPagination(d.pagination); setLoading(false) })
  }

  useEffect(() => { fetchApps() }, [status])

  const handleAction = async (application_id: string, action: string) => {
    let rejection_reason = ""
    let remarks = ""

    if (action === 'reject') {
      rejection_reason = prompt("Rejection reason:") || "Does not meet eligibility criteria"
    } else if (action === 'disburse') {
      remarks = prompt("Disbursement remarks (optional):") || ""
    }

    setActionLoading(application_id)
    await fetch("/api/admin/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ application_id, action, rejection_reason, remarks }),
    })
    setActionLoading(null)
    fetchApps()
  }

  return (
    <div style={{ padding: "32px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
          Scheme Applications
        </h1>
        <p style={{ color: "#64748b", fontSize: "14px", marginTop: "4px" }}>
          Review and process farmer scheme applications
        </p>
      </div>

      {/* Status Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "20px", borderBottom: "1px solid #e2e8f0" }}>
        {STATUS_TABS.map(s => (
          <button key={s} onClick={() => setStatus(s)} style={{
            padding: "8px 16px", border: "none", background: "transparent",
            fontSize: "13px", fontWeight: "500", cursor: "pointer",
            color: status === s ? "#1d4ed8" : "#64748b",
            borderBottom: status === s ? "2px solid #1d4ed8" : "2px solid transparent",
          }}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
            {pagination && status === s && (
              <span style={{
                marginLeft: "6px", background: "#e2e8f0", color: "#475569",
                borderRadius: "10px", padding: "1px 6px", fontSize: "11px",
              }}>
                {pagination.total}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: "#64748b" }}>Loading...</div>
      ) : apps.length === 0 ? (
        <div style={{
          background: "#fff", borderRadius: "6px", padding: "48px",
          textAlign: "center", color: "#94a3b8",
        }}>
          No {status} applications
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {apps.map((app: any) => (
            <div key={app.id} style={{
              background: "#fff", borderRadius: "6px", padding: "20px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "15px", fontWeight: "600", color: "#1e293b" }}>
                    {app.scheme_name}
                    <span style={{
                      marginLeft: "8px", fontSize: "11px", fontWeight: "500",
                      background: app.tier === 1 ? "#dbeafe" : "#fae8ff",
                      color: app.tier === 1 ? "#1d4ed8" : "#7e22ce",
                      padding: "2px 6px", borderRadius: "4px",
                    }}>
                      Tier {app.tier}
                    </span>
                  </div>
                  <div style={{ fontSize: "13px", color: "#475569", marginTop: "4px" }}>
                    {app.full_name} · {app.phone} · {app.state}
                  </div>
                  <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
                    Applied {new Date(app.applied_at).toLocaleDateString('en-IN')}
                    {app.benefit_amount && ` · Benefit: ${app.benefit_amount}`}
                  </div>

                  {/* Passed rules */}
                  {app.passed_rules?.length > 0 && (
                    <div style={{ marginTop: "8px", display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      {app.passed_rules.map((r: string) => (
                        <span key={r} style={{
                          background: "#dcfce7", color: "#166534",
                          padding: "2px 6px", borderRadius: "4px", fontSize: "11px",
                        }}>
                          ✓ {r}
                        </span>
                      ))}
                    </div>
                  )}

                  {app.rejection_reason && (
                    <div style={{ marginTop: "8px", fontSize: "12px", color: "#dc2626" }}>
                      Reason: {app.rejection_reason}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
                  <Link href={`/admin/farmers/${app.user_id}`} style={{
                    color: "#2563eb", fontSize: "13px", textDecoration: "none",
                    padding: "5px 12px", border: "1px solid #bfdbfe", borderRadius: "4px",
                  }}>
                    View Farmer
                  </Link>

                  {status === "applied" && (
                    <>
                      <button
                        onClick={() => handleAction(app.id, 'approve')}
                        disabled={actionLoading === app.id}
                        style={{
                          background: "#16a34a", color: "#fff", border: "none",
                          borderRadius: "4px", padding: "5px 14px", fontSize: "13px",
                          cursor: "pointer", fontWeight: "500",
                        }}
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleAction(app.id, 'reject')}
                        disabled={actionLoading === app.id}
                        style={{
                          background: "#dc2626", color: "#fff", border: "none",
                          borderRadius: "4px", padding: "5px 14px", fontSize: "13px",
                          cursor: "pointer", fontWeight: "500",
                        }}
                      >
                        ✗ Reject
                      </button>
                    </>
                  )}

                  {status === "approved" && (
                    <button
                      onClick={() => handleAction(app.id, 'disburse')}
                      disabled={actionLoading === app.id}
                      style={{
                        background: "#0369a1", color: "#fff", border: "none",
                        borderRadius: "4px", padding: "5px 14px", fontSize: "13px",
                        cursor: "pointer", fontWeight: "500",
                      }}
                    >
                       Mark Disbursed
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}