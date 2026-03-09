"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

const STATUS_TABS = ["ocr_done", "pending", "verified", "rejected"]

const DOC_LABELS: any = {
  aadhaar: "Aadhaar",
  land_record: "Land Record",
  bank_passbook: "Bank Passbook",
  income_certificate: "Income Cert",
  caste_certificate: "Caste Cert",
}

export default function AdminDocumentsPage() {
  const [docs, setDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState("ocr_done")
  const [pagination, setPagination] = useState<any>(null)
  const [page, setPage] = useState(1)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchDocs = (s = status, p = page) => {
    setLoading(true)
    fetch(`/api/admin/documents?status=${s}&page=${p}`)
      .then(r => r.json())
      .then(d => {
        setDocs(d.data || [])
        setPagination(d.pagination)
        setLoading(false)
      })
  }

  useEffect(() => { fetchDocs() }, [status, page])

  const handleAction = async (document_id: string, action: string) => {
    let note = ""
    if (action === 'reject') {
      note = prompt("Rejection reason:") || ""
    }
    setActionLoading(document_id)
    await fetch("/api/admin/documents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document_id, action, admin_note: note }),
    })
    setActionLoading(null)
    fetchDocs()
  }

  return (
    <div style={{ padding: "32px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
          Documents
        </h1>
        <p style={{ color: "#64748b", fontSize: "14px", marginTop: "4px" }}>
          Review and verify farmer uploaded documents
        </p>
      </div>

      {/* Status Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "20px", borderBottom: "1px solid #e2e8f0" }}>
        {STATUS_TABS.map(s => (
          <button key={s} onClick={() => { setStatus(s); setPage(1) }} style={{
            padding: "8px 16px", border: "none", background: "transparent",
            fontSize: "13px", fontWeight: "500", cursor: "pointer",
            color: status === s ? "#1d4ed8" : "#64748b",
            borderBottom: status === s ? "2px solid #1d4ed8" : "2px solid transparent",
          }}>
            {s === "ocr_done" ? "Awaiting Review" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: "#64748b" }}>Loading...</div>
      ) : docs.length === 0 ? (
        <div style={{
          background: "#fff", borderRadius: "6px", padding: "48px",
          textAlign: "center", color: "#94a3b8",
        }}>
          No documents with status "{status}"
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {docs.map((doc: any) => (
            <div key={doc.id} style={{
              background: "#fff", borderRadius: "6px", padding: "16px 20px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: "16px",
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{
                    background: "#f1f5f9", color: "#475569",
                    padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "600",
                  }}>
                    {DOC_LABELS[doc.doc_type] || doc.doc_type}
                  </span>
                  {doc.ocr_data?.confidence && (
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      {Math.round(doc.ocr_data.confidence * 100)}% confidence
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "14px", fontWeight: "500", color: "#1e293b", marginTop: "4px" }}>
                  {doc.full_name}
                </div>
                <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                  {doc.phone} · {new Date(doc.uploaded_at).toLocaleDateString('en-IN')}
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <Link href={`/admin/farmers/${doc.user_id}`} style={{
                  color: "#2563eb", fontSize: "13px", textDecoration: "none",
                  padding: "5px 12px", border: "1px solid #bfdbfe", borderRadius: "4px",
                }}>
                  View Farmer
                </Link>
                {status === "ocr_done" || status === "pending" ? (
                  <>
                    <button
                      onClick={() => handleAction(doc.id, 'verify')}
                      disabled={actionLoading === doc.id}
                      style={{
                        background: "#16a34a", color: "#fff", border: "none",
                        borderRadius: "4px", padding: "5px 14px", fontSize: "13px",
                        cursor: "pointer", fontWeight: "500",
                      }}
                    >
                      ✓ Verify
                    </button>
                    <button
                      onClick={() => handleAction(doc.id, 'reject')}
                      disabled={actionLoading === doc.id}
                      style={{
                        background: "#dc2626", color: "#fff", border: "none",
                        borderRadius: "4px", padding: "5px 14px", fontSize: "13px",
                        cursor: "pointer", fontWeight: "500",
                      }}
                    >
                      ✗ Reject
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}