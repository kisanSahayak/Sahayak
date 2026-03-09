"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"

const DOC_LABELS: any = {
  aadhaar: "Aadhaar Card",
  land_record: "Land Record",
  bank_passbook: "Bank Passbook",
  income_certificate: "Income Certificate",
  caste_certificate: "Caste Certificate",
}

const STATUS_STYLES: any = {
  pending: { background: "#fef9c3", color: "#854d0e" },
  processing: { background: "#dbeafe", color: "#1d4ed8" },
  ocr_done: { background: "#e0f2fe", color: "#0369a1" },
  verified: { background: "#dcfce7", color: "#166534" },
  rejected: { background: "#fee2e2", color: "#991b1b" },
}

export default function FarmerDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState("")
  const [activeTab, setTab] = useState("profile")

  useEffect(() => {
    fetch(`/api/admin/farmers/${id}`)
      .then(r => r.json())
      .then(d => { setData(d.data); setLoading(false) })
  }, [id])

  const handleDocAction = async (document_id: string, action: string, note = "") => {
    setActionLoading(document_id + action)
    await fetch("/api/admin/documents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document_id, action, admin_note: note }),
    })
    // Refresh
    const d = await fetch(`/api/admin/farmers/${id}`).then(r => r.json())
    setData(d.data)
    setActionLoading(null)
  }

  if (loading) return <div style={{ padding: "32px", color: "#64748b" }}>Loading...</div>
  if (!data) return <div style={{ padding: "32px", color: "#ef4444" }}>Farmer not found</div>

  const { farmer, documents, landHoldings, bankDetails, category, applications } = data

  const TABS = ["profile", "documents", "land & bank", "applications"]

  return (
    <div style={{ padding: "32px" }}>
      {/* Back */}
      <Link href="/admin/farmers" style={{ color: "#2563eb", fontSize: "13px", textDecoration: "none" }}>
        ← Back to Farmers
      </Link>

      {/* Header */}
      <div style={{ marginTop: "16px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
            {farmer.full_name}
          </h1>
          <p style={{ color: "#64748b", fontSize: "14px", marginTop: "4px" }}>
            {farmer.phone} · {farmer.state}, {farmer.district}
          </p>
        </div>
        <div style={{
          background: "#dbeafe", color: "#1d4ed8",
          padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "600",
        }}>
          Aadhaar: XXXX XXXX {farmer.aadhaar_last4 || "????"}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "24px", borderBottom: "1px solid #e2e8f0" }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setTab(tab)} style={{
            padding: "8px 16px", border: "none", background: "transparent",
            fontSize: "13px", fontWeight: "500", cursor: "pointer",
            color: activeTab === tab ? "#1d4ed8" : "#64748b",
            borderBottom: activeTab === tab ? "2px solid #1d4ed8" : "2px solid transparent",
            textTransform: "capitalize",
          }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div style={{
          background: "#fff", borderRadius: "6px", padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}>
          <h2 style={{ fontSize: "15px", fontWeight: "600", color: "#1e293b", marginBottom: "16px" }}>
            Farmer Details
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {[
              ["Full Name", farmer.full_name],
              ["Phone", farmer.phone],
              ["Email", farmer.email || "—"],
              ["State", farmer.state || "—"],
              ["District", farmer.district || "—"],
              ["Village", farmer.village || "—"],
              ["Land Area", farmer.land_area_acres ? `${farmer.land_area_acres} acres` : "—"],
              ["Aadhaar Last 4", farmer.aadhaar_last4 || "—"],
              ["Registered", new Date(farmer.created_at).toLocaleDateString('en-IN')],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "2px" }}>{label}</div>
                <div style={{ fontSize: "14px", color: "#1e293b", fontWeight: "500" }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Category */}
          {category && (
            <>
              <hr style={{ margin: "24px 0", borderColor: "#f1f5f9" }} />
              <h2 style={{ fontSize: "15px", fontWeight: "600", color: "#1e293b", marginBottom: "16px" }}>
                Category & Income
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {[
                  ["Caste", category.caste || "—"],
                  ["Category", category.caste_category || "—"],
                  ["Annual Income", category.annual_income ? `₹${category.annual_income.toLocaleString('en-IN')}` : "—"],
                  ["Income Certified", category.income_certified ? "Yes ✓" : "No"],
                  ["Caste Certified", category.caste_certified ? "Yes ✓" : "No"],
                  ["BPL", category.is_bpl ? "Yes" : "No"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "2px" }}>{label}</div>
                    <div style={{ fontSize: "14px", color: "#1e293b", fontWeight: "500" }}>{value}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === "documents" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {documents.length === 0 ? (
            <div style={{ background: "#fff", borderRadius: "6px", padding: "32px", textAlign: "center", color: "#94a3b8" }}>
              No documents uploaded yet
            </div>
          ) : documents.map((doc: any) => (
            <div key={doc.id} style={{
              background: "#fff", borderRadius: "6px", padding: "20px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: "600", color: "#1e293b" }}>
                    {DOC_LABELS[doc.doc_type] || doc.doc_type}
                  </div>
                  <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
                    Uploaded {new Date(doc.uploaded_at).toLocaleDateString('en-IN')}
                  </div>
                </div>
                <span style={{
                  padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "500",
                  ...(STATUS_STYLES[doc.status] || { background: "#f1f5f9", color: "#475569" })
                }}>
                  {doc.status}
                </span>
              </div>

              {/* OCR Data */}
              {doc.ocr_data?.extracted && (
                <div style={{
                  marginTop: "12px", background: "#f8fafc", borderRadius: "4px",
                  padding: "12px", fontSize: "12px",
                }}>
                  <div style={{ fontWeight: "600", color: "#475569", marginBottom: "8px" }}>
                    OCR Extracted — {doc.ocr_data.confidence
                      ? `${Math.round(doc.ocr_data.confidence * 100)}% confidence`
                      : ""}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                    {Object.entries(doc.ocr_data.extracted)
                      .filter(([k, v]) => !k.endsWith('_confidence') && v !== null && v !== undefined)
                      .map(([key, value]) => (
                        <div key={key}>
                          <span style={{ color: "#94a3b8" }}>{key}: </span>
                          <span style={{ color: "#1e293b" }}>
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {(doc.status === 'ocr_done' || doc.status === 'pending') && (
                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                  <button
                    onClick={() => handleDocAction(doc.id, 'verify')}
                    disabled={actionLoading === doc.id + 'verify'}
                    style={{
                      background: "#16a34a", color: "#fff", border: "none",
                      borderRadius: "4px", padding: "6px 16px", fontSize: "13px",
                      cursor: "pointer", fontWeight: "500",
                    }}
                  >
                    ✓ Verify
                  </button>
                  <button
                    onClick={() => {
                      const note = prompt("Rejection reason (optional):")
                      handleDocAction(doc.id, 'reject', note || "")
                    }}
                    disabled={actionLoading === doc.id + 'reject'}
                    style={{
                      background: "#dc2626", color: "#fff", border: "none",
                      borderRadius: "4px", padding: "6px 16px", fontSize: "13px",
                      cursor: "pointer", fontWeight: "500",
                    }}
                  >
                    ✗ Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Land & Bank Tab */}
      {activeTab === "land & bank" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Land */}
          <div style={{ background: "#fff", borderRadius: "6px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <h2 style={{ fontSize: "15px", fontWeight: "600", color: "#1e293b", marginBottom: "16px" }}>
              Land Holdings ({landHoldings.length})
            </h2>
            {landHoldings.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: "14px" }}>No land holdings recorded</p>
            ) : landHoldings.map((l: any) => (
              <div key={l.id} style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "12px", marginBottom: "12px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", fontSize: "13px" }}>
                  {[
                    ["Survey/Khasra", l.survey_number || "—"],
                    ["Area", l.total_area_acres ? `${l.total_area_acres} acres` : "—"],
                    ["Type", l.land_type || "—"],
                    ["Village", l.village || "—"],
                    ["District", l.district || "—"],
                    ["Verified", l.is_verified ? "✓ Yes" : "Pending"],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ color: "#94a3b8", fontSize: "11px" }}>{k}</div>
                      <div style={{ color: "#1e293b", fontWeight: "500" }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Bank */}
          <div style={{ background: "#fff", borderRadius: "6px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <h2 style={{ fontSize: "15px", fontWeight: "600", color: "#1e293b", marginBottom: "16px" }}>
              Bank Details ({bankDetails.length})
            </h2>
            {bankDetails.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: "14px" }}>No bank details recorded</p>
            ) : bankDetails.map((b: any) => (
              <div key={b.id} style={{ fontSize: "13px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                  {[
                    ["Account Holder", b.account_holder_name || "—"],
                    ["Bank", b.bank_name || "—"],
                    ["Account No.", b.account_number || "—"],
                    ["IFSC", b.ifsc_code || "—"],
                    ["Branch", b.branch_name || "—"],
                    ["Aadhaar Linked", b.is_aadhaar_linked ? "Yes ✓" : "No"],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ color: "#94a3b8", fontSize: "11px" }}>{k}</div>
                      <div style={{ color: "#1e293b", fontWeight: "500" }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Applications Tab */}
      {activeTab === "applications" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {applications.length === 0 ? (
            <div style={{ background: "#fff", borderRadius: "6px", padding: "32px", textAlign: "center", color: "#94a3b8" }}>
              No scheme applications yet
            </div>
          ) : applications.map((app: any) => (
            <div key={app.id} style={{
              background: "#fff", borderRadius: "6px", padding: "20px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: "600", color: "#1e293b" }}>
                    {app.scheme_name}
                  </div>
                  <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
                    Applied {new Date(app.applied_at).toLocaleDateString('en-IN')}
                    {app.benefit_amount && ` · ₹${parseInt(app.benefit_amount).toLocaleString('en-IN')}`}
                  </div>
                </div>
                <span style={{
                  padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "500",
                  background: app.status === 'approved' || app.status === 'disbursed' ? '#dcfce7' :
                    app.status === 'rejected' ? '#fee2e2' : '#fef9c3',
                  color: app.status === 'approved' || app.status === 'disbursed' ? '#166534' :
                    app.status === 'rejected' ? '#991b1b' : '#854d0e',
                }}>
                  {app.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}