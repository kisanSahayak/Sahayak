'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const CROPS: { name: string; schemes: string[] }[] = [
  { name: 'Wheat',                        schemes: ['PMFBY', 'NFSM', 'KCC'] },
  { name: 'Cotton',                       schemes: ['PMFBY', 'KCC'] },
  { name: 'Sugarcane',                    schemes: ['PMFBY', 'KCC', 'e-NAM'] },
  { name: 'Pulses (Dal)',                 schemes: ['PMFBY', 'NFSM', 'KCC'] },
  { name: 'Maize',                        schemes: ['PMFBY', 'NFSM'] },
  { name: 'Vegetables',                   schemes: ['PMFBY', 'PMKSY', 'e-NAM'] },
  { name: 'Fruits / Horticulture',        schemes: ['PMFBY', 'PMKSY', 'e-NAM', 'KCC'] },
  { name: 'Oilseeds (Soybean/Groundnut)', schemes: ['PMFBY', 'NFSM', 'KCC'] },
  { name: 'Spices',                       schemes: ['PMFBY', 'PMKSY', 'e-NAM'] },
]

export default function CropsPage() {
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/crops')
      .then(r => r.json())
      .then(res => {
        if (res.success) setSelected(res.data.primary_crops || [])
      })
      .finally(() => setLoading(false))
  }, [])

  const toggle = (crop: string) => {
    setSaved(false)
    setSelected(prev =>
      prev.includes(crop) ? prev.filter(c => c !== crop) : [...prev, crop]
    )
  }

  const handleSave = async () => {
    if (selected.length === 0) { setError('Please select at least one crop'); return }
    setSaving(true)
    setError(null)
    const res = await fetch('/api/crops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ crops: selected }),
    }).then(r => r.json())
    setSaving(false)
    if (res.success) setSaved(true)
    else setError(res.error || 'Failed to save')
  }

  const boostedSchemes = [...new Set(
    CROPS.filter(c => selected.includes(c.name)).flatMap(c => c.schemes)
  )]

  return (
    <div className="page-wrapper">
      <main className="content-area py-6">

        {/* Breadcrumb */}
        <div className="breadcrumb mb-4">
          <Link href="/dashboard">Home</Link>
          <span className="mx-2">›</span>
          <span style={{ color: '#163971', fontWeight: 600 }}>My Crops</span>
        </div>

        {/* Page intro */}
        <div className="section-box mb-5">
          <div className="section-heading">🌾 My Crops — Select What You Grow</div>
          <div className="section-content" style={{ color: '#555', fontSize: 13 }}>
            Select the crops you grow on your farm. This helps KisanSahayak recommend the most
            relevant government schemes and boosts your eligibility score for crop-specific schemes
            like PMFBY, NFSM, and e-NAM.
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#888' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
            <div style={{ fontSize: 14 }}>Loading your crop profile…</div>
          </div>
        ) : (
          <>
            {/* Crop grid */}
            <div className="section-box mb-5">
              <div className="section-heading">Select Your Crops (select all that apply)</div>
              <div className="section-content">
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))',
                  gap: 10,
                }}>
                  {CROPS.map(crop => {
                    const isSelected = selected.includes(crop.name)
                    return (
                      <button
                        key={crop.name}
                        onClick={() => toggle(crop.name)}
                        style={{
                          background: isSelected ? '#e7f5ec' : '#f9fafc',
                          border: `2px solid ${isSelected ? '#1a6e35' : '#d0d7e2'}`,
                          borderRadius: 6,
                          padding: '12px 10px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'border-color 0.15s, background 0.15s',
                          fontFamily: 'inherit',
                        }}
                      >
                        <div style={{
                          fontSize: 13, fontWeight: 700,
                          color: isSelected ? '#1a6e35' : '#163971',
                          marginBottom: 6,
                        }}>
                          {isSelected ? '✓ ' : ''}{crop.name}
                        </div>
                        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                          {crop.schemes.map(s => (
                            <span key={s} style={{
                              fontSize: 10, fontWeight: 600,
                              background: isSelected ? '#c6ecd2' : '#e7eef8',
                              color: isSelected ? '#1a6e35' : '#163971',
                              padding: '2px 5px',
                              borderRadius: 3,
                            }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Selected summary */}
                <div style={{
                  marginTop: 12, paddingTop: 10,
                  borderTop: '1px solid #e0e6ef',
                  fontSize: 13, color: '#555',
                }}>
                  {selected.length === 0
                    ? 'No crops selected — click a crop card to select it.'
                    : (
                      <span>
                        <strong style={{ color: '#163971' }}>
                          {selected.length} crop{selected.length > 1 ? 's' : ''} selected:
                        </strong>{' '}
                        {selected.join(', ')}
                      </span>
                    )
                  }
                </div>
              </div>
            </div>

            {/* Scheme boost preview */}
            {boostedSchemes.length > 0 && (
              <div className="section-box mb-5">
                <div className="section-heading" style={{ background: '#e8f0fe', color: '#1a3a8f', borderBottom: '1px solid #c5d5f5' }}>
                  ⚡ Schemes Boosted by Your Crop Selection
                </div>
                <div className="section-content">
                  <p style={{ fontSize: 13, color: '#555', marginBottom: 10 }}>
                    These schemes will receive a relevance boost in your ranking:
                  </p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {boostedSchemes.map(s => (
                      <span key={s} style={{
                        background: '#e7eef8',
                        color: '#163971',
                        border: '1px solid #c5ceda',
                        fontSize: 13, fontWeight: 600,
                        padding: '4px 12px',
                        borderRadius: 4,
                      }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="error-box mb-4">⚠ {error}</div>
            )}

            {/* Save section */}
            <div className="section-box">
              <div className="section-heading">Save Crop Profile</div>
              <div className="section-content" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <button
                  onClick={handleSave}
                  disabled={saving || selected.length === 0}
                  className="btn-primary"
                  style={{
                    opacity: saving || selected.length === 0 ? 0.5 : 1,
                    cursor: saving || selected.length === 0 ? 'not-allowed' : 'pointer',
                    padding: '9px 24px',
                  }}
                >
                  {saving
                    ? 'Saving…'
                    : `Save Crop Profile${selected.length > 0 ? ` (${selected.length} selected)` : ''}`
                  }
                </button>

                {saved && (
                  <span style={{ fontSize: 13, color: '#1a6e35', fontWeight: 600 }}>
                    ✓ Saved successfully!{' '}
                    <Link href="/schemes" style={{ color: '#0a4fa3', fontWeight: 600 }}>
                      View updated scheme rankings →
                    </Link>
                  </span>
                )}

                {selected.length === 0 && !saving && (
                  <span style={{ fontSize: 12, color: '#999' }}>
                    Select at least one crop above to save your profile
                  </span>
                )}
              </div>
            </div>

            {/* Notice bar */}
            <div className="notice-bar mt-4">
              ℹ Your crop selection improves scheme recommendations but does not override hard
              eligibility rules (land size, income limit, caste category). Visit{' '}
              <Link href="/schemes" style={{ color: '#8a6500', fontWeight: 600 }}>
                Schemes
              </Link>{' '}
              to see your updated rankings after saving.
            </div>
          </>
        )}
      </main>
    </div>
  )
}