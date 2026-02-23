'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

const STATES = [
  'Andhra Pradesh', 'Bihar', 'Chhattisgarh', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu',
  'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Other',
]

export default function RegisterPage() {
  const [form, setForm] = useState<any>({
    full_name: '',
    phone: '',
    email: '',
    password: '',
    confirm_password: '',
    state: '',
    district: '',
    village: '',
    land_area_acres: '',
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleChange = (e: any) => {
    setForm((prev: any) => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()

    if (form.password !== form.confirm_password) {
      setError('Passwords do not match')
      return
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    setLoading(false)

    if (!data.success) {
      setError(data.error || 'Registration failed')
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="page-wrapper">
      <Header />

      <main className="content-area">

        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link href="/">Home</Link> › New Farmer Registration
        </div>

        <div className="section-box">
          <div className="section-heading">
            Farmer Registration Form
          </div>

          <div style={{ padding: '10px 14px', fontSize: '12px' }}>

            {error && (
              <div className="error-box">
                ⚠ {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>

              {/* PERSONAL */}
              <div className="form-block">
                <div className="form-section">Personal Details</div>

                <label className="form-label">Full Name *</label>
                <input
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  className="form-input"
                  required
                />

                <label className="form-label">Mobile Number *</label>
                <div className="phone-group">
                  <span>+91</span>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    maxLength={10}
                    required
                  />
                </div>

                <label className="form-label">Email (Optional)</label>
                <input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              {/* LOCATION */}
              <div className="form-block">
                <div className="form-section">Location Details</div>

                <label className="form-label">State</label>
                <select
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">-- Select State --</option>
                  {STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <label className="form-label">District</label>
                <input
                  name="district"
                  value={form.district}
                  onChange={handleChange}
                  className="form-input"
                />

                <label className="form-label">Village / Town</label>
                <input
                  name="village"
                  value={form.village}
                  onChange={handleChange}
                  className="form-input"
                />

                <label className="form-label">Land Area (Acres)</label>
                <input
                  name="land_area_acres"
                  type="number"
                  value={form.land_area_acres}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              {/* PASSWORD */}
              <div className="form-block">
                <div className="form-section">Set Password</div>

                <label className="form-label">Password *</label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  className="form-input"
                  required
                />

                <label className="form-label">Confirm Password *</label>
                <input
                  name="confirm_password"
                  type="password"
                  value={form.confirm_password}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              {/* BUTTONS */}
              <div style={{ marginTop: '14px', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
                <button type="submit" className="btn-primary">
                  {loading ? 'Submitting...' : 'Submit Registration'}
                </button>

                <Link href="/login" className="link-btn" style={{ marginLeft: '12px' }}>
                  Already Registered? Login
                </Link>
              </div>

            </form>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  )
}