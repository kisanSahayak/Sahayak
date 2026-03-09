"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function AdminLoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ phone: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    setLoading(false)

    if (!data.success) {
      setError(data.error || "Login failed")
      return
    }

    if (data.data?.role !== "admin") {
      setError("Access denied — admin only")
      return
    }

    router.push("/admin")
    router.refresh()
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#1a2332",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Georgia, serif",
    }}>
      <div style={{
        background: "#fff",
        borderRadius: "4px",
        padding: "48px",
        width: "100%",
        maxWidth: "400px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            width: "48px", height: "48px",
            background: "#1a3a5c",
            borderRadius: "50%",
            margin: "0 auto 16px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "#fff", fontSize: "20px" }}>⚙</span>
          </div>
          <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#1a3a5c", margin: 0 }}>
            Admin Portal
          </h1>
          <p style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>
            KisanSahayak Administration
          </p>
        </div>

        {error && (
          <div style={{
            background: "#fef2f2", border: "1px solid #fca5a5",
            color: "#dc2626", padding: "10px 14px",
            borderRadius: "4px", fontSize: "13px", marginBottom: "20px",
          }}>
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "4px" }}>
            Phone Number
          </label>
          <input
            value={form.phone}
            onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
            style={{
              width: "100%", border: "1px solid #d1d5db",
              borderRadius: "4px", padding: "10px 12px",
              fontSize: "14px", marginBottom: "16px",
              boxSizing: "border-box",
            }}
            placeholder="Enter admin phone"
            required
          />

          <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "4px" }}>
            Password
          </label>
          <input
            type="password"
            value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            style={{
              width: "100%", border: "1px solid #d1d5db",
              borderRadius: "4px", padding: "10px 12px",
              fontSize: "14px", marginBottom: "24px",
              boxSizing: "border-box",
            }}
            placeholder="Enter password"
            required
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", background: loading ? "#94a3b8" : "#1a3a5c",
              color: "#fff", border: "none", borderRadius: "4px",
              padding: "12px", fontSize: "14px", fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  )
}