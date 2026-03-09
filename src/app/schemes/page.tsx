'use client'

import { useEffect, useState } from 'react'

// ── Types ────────────────────────────────────────────────
interface ScoreBreakdown {
  income_score: number
  land_score: number
  docs_score: number
  category_score: number
  total_score: number
  match_percent: number
}

interface RuleResult {
  rule: string
  passed: boolean
  impact: 'high' | 'medium' | 'low'
}

interface RankedScheme {
  scheme_id: string
  name: string
  short_name: string
  description: string
  benefits: string
  benefit_amount: string
  ministry: string
  application_url: string
  tier: number
  eligible: boolean
  score: ScoreBreakdown
  rules: RuleResult[]
  missing_docs: string[]
  what_to_do: string[]
}

interface ApiResponse {
  eligible_count: number
  partial_count: number
  total_schemes: number
  ranked_schemes: RankedScheme[]
}

// ── Helpers ──────────────────────────────────────────────
function matchLabel(pct: number, eligible: boolean): { label: string; color: string; bg: string } {
  if (eligible)           return { label: 'Fully Eligible',   color: '#166534', bg: '#dcfce7' }
  if (pct >= 70)          return { label: 'Almost There',     color: '#92400e', bg: '#fef3c7' }
  if (pct >= 40)          return { label: 'Partial Match',    color: '#1e40af', bg: '#dbeafe' }
  return                         { label: 'Not Eligible',     color: '#991b1b', bg: '#fee2e2' }
}

function scoreBarColor(pct: number, eligible: boolean): string {
  if (eligible) return '#16a34a'
  if (pct >= 70) return '#d97706'
  if (pct >= 40) return '#3b82f6'
  return '#ef4444'
}

// ── Score Pill ───────────────────────────────────────────
function ScorePill({ label, score, max, color }: { label: string; score: number; max: number; color: string }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 64 }}>
      <div style={{
        fontSize: 18, fontWeight: 700, color,
        fontFamily: "'DM Mono', monospace",
      }}>
        {score}<span style={{ fontSize: 11, color: '#9ca3af' }}>/{max}</span>
      </div>
      <div style={{ fontSize: 10, color: '#6b7280', marginTop: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
    </div>
  )
}

// ── Scheme Card ──────────────────────────────────────────
function SchemeCard({ scheme, rank }: { scheme: RankedScheme; rank: number }) {
  const [expanded, setExpanded] = useState(false)
  const { label, color, bg } = matchLabel(scheme.score.match_percent, scheme.eligible)
  const barColor = scoreBarColor(scheme.score.match_percent, scheme.eligible)

  const passedRules = scheme.rules.filter(r => r.passed)
  const failedRules = scheme.rules.filter(r => !r.passed)

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 12,
      overflow: 'hidden',
      boxShadow: scheme.eligible
        ? '0 0 0 2px #bbf7d0, 0 4px 16px rgba(22,163,74,0.08)'
        : '0 2px 8px rgba(0,0,0,0.06)',
      transition: 'box-shadow 0.2s',
    }}>
      {/* Top bar */}
      <div style={{
        height: 4,
        background: '#f3f4f6',
        position: 'relative',
      }}>
        <div style={{
          height: '100%',
          width: `${scheme.score.match_percent}%`,
          background: barColor,
          borderRadius: 2,
          transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>

      <div style={{ padding: '20px 24px 0' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
          {/* Rank badge */}
          <div style={{
            minWidth: 36, height: 36,
            borderRadius: 8,
            background: rank === 1 ? '#fef3c7' : rank === 2 ? '#f3f4f6' : '#f9fafb',
            border: `1px solid ${rank === 1 ? '#fcd34d' : '#e5e7eb'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700,
            color: rank === 1 ? '#92400e' : '#6b7280',
            fontFamily: "'DM Mono', monospace",
            flexShrink: 0,
          }}>
            #{rank}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h3 style={{
                margin: 0, fontSize: 15, fontWeight: 700,
                color: '#111827', lineHeight: 1.3,
                fontFamily: "'Noto Serif', serif",
              }}>
                {scheme.name}
              </h3>
              <span style={{
                fontSize: 11, fontWeight: 600,
                padding: '2px 8px', borderRadius: 20,
                background: bg, color,
                whiteSpace: 'nowrap',
              }}>
                {label}
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>
              {scheme.ministry}
              {scheme.tier && (
                <span style={{ marginLeft: 8, color: '#9ca3af' }}>• Tier {scheme.tier}</span>
              )}
            </div>
          </div>

          {/* Match % */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{
              fontSize: 26, fontWeight: 800,
              color: barColor,
              fontFamily: "'DM Mono', monospace",
              lineHeight: 1,
            }}>
              {scheme.score.match_percent}%
            </div>
            <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>match score</div>
          </div>
        </div>

        {/* Score breakdown pills */}
        <div style={{
          display: 'flex', gap: 0,
          borderTop: '1px solid #f3f4f6',
          borderBottom: '1px solid #f3f4f6',
          padding: '10px 0',
          marginBottom: 14,
        }}>
          {[
            { label: 'Income', score: scheme.score.income_score, max: 40 },
            { label: 'Land', score: scheme.score.land_score, max: 25 },
            { label: 'Docs', score: scheme.score.docs_score, max: 20 },
            { label: 'Category', score: scheme.score.category_score, max: 15 },
          ].map((s, i) => (
            <div key={s.label} style={{
              flex: 1,
              borderRight: i < 3 ? '1px solid #f3f4f6' : 'none',
              display: 'flex', justifyContent: 'center',
            }}>
              <ScorePill
                label={s.label}
                score={s.score}
                max={s.max}
                color={s.score === s.max ? '#16a34a' : s.score === 0 ? '#dc2626' : '#d97706'}
              />
            </div>
          ))}
        </div>

        {/* Description + benefit */}
        <p style={{ margin: '0 0 10px', fontSize: 13, color: '#4b5563', lineHeight: 1.6 }}>
          {scheme.description}
        </p>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: '#f0fdf4', border: '1px solid #bbf7d0',
          borderRadius: 6, padding: '5px 10px',
          fontSize: 13, color: '#15803d', fontWeight: 600,
          marginBottom: 16,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          {scheme.benefit_amount}
        </div>

        {/* Missing docs alert */}
        {scheme.missing_docs.length > 0 && (
          <div style={{
            background: '#fffbeb', border: '1px solid #fcd34d',
            borderRadius: 8, padding: '10px 14px', marginBottom: 14,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 6 }}>
              📋 Missing Documents
            </div>
            {scheme.missing_docs.map((doc, i) => (
              <div key={i} style={{ fontSize: 12, color: '#78350f', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <span style={{ color: '#d97706' }}>›</span> {doc}
              </div>
            ))}
          </div>
        )}

        {/* What to do */}
        {scheme.what_to_do.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            {scheme.what_to_do.map((step, i) => (
              <div key={i} style={{
                fontSize: 12, color: scheme.eligible ? '#166534' : '#1e40af',
                display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 4,
              }}>
                <span style={{ fontSize: 14, marginTop: -1 }}>{scheme.eligible ? '✓' : '→'}</span>
                {step}
              </div>
            ))}
          </div>
        )}

        {/* Expand/collapse rules */}
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            width: '100%', background: 'none', border: 'none',
            borderTop: '1px solid #f3f4f6',
            padding: '10px 0',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', fontSize: 12, color: '#6b7280',
            fontFamily: 'inherit',
          }}
        >
          <span>
            <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ {passedRules.length} passed</span>
            {failedRules.length > 0 && (
              <span style={{ color: '#dc2626', fontWeight: 600, marginLeft: 10 }}>✗ {failedRules.length} failed</span>
            )}
          </span>
          <span style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>
            ▾
          </span>
        </button>

        {expanded && (
          <div style={{ paddingBottom: 16 }}>
            {scheme.rules.map((rule, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                padding: '5px 0',
                borderBottom: i < scheme.rules.length - 1 ? '1px solid #f9fafb' : 'none',
              }}>
                <span style={{
                  fontSize: 13, flexShrink: 0, marginTop: 1,
                  color: rule.passed ? '#16a34a' : '#dc2626',
                }}>
                  {rule.passed ? '✓' : '✗'}
                </span>
                <span style={{
                  fontSize: 12, color: rule.passed ? '#374151' : '#dc2626',
                  lineHeight: 1.5,
                }}>
                  {rule.rule}
                  {rule.impact === 'high' && !rule.passed && (
                    <span style={{
                      marginLeft: 6, fontSize: 10, fontWeight: 600,
                      color: '#dc2626', background: '#fee2e2',
                      padding: '1px 5px', borderRadius: 4,
                    }}>REQUIRED</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Apply button */}
      {scheme.eligible && (
        <div style={{ padding: '0 24px 20px' }}>
          <a
            href={scheme.application_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block', textAlign: 'center',
              background: '#166534', color: '#fff',
              padding: '10px', borderRadius: 8,
              fontSize: 13, fontWeight: 600,
              textDecoration: 'none',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#15803d')}
            onMouseLeave={e => (e.currentTarget.style.background = '#166534')}
          >
            Apply Now →
          </a>
        </div>
      )}
    </div>
  )
}

// ── Filter Bar ───────────────────────────────────────────
type FilterType = 'all' | 'eligible' | 'partial'

function FilterBar({
  active, onChange, eligible, partial, total
}: {
  active: FilterType
  onChange: (f: FilterType) => void
  eligible: number
  partial: number
  total: number
}) {
  const tabs: { key: FilterType; label: string; count: number; color: string }[] = [
    { key: 'all',      label: 'All Schemes',     count: total,   color: '#374151' },
    { key: 'eligible', label: 'Fully Eligible',  count: eligible, color: '#166534' },
    { key: 'partial',  label: 'Almost There',    count: partial,  color: '#92400e' },
  ]
  return (
    <div style={{
      display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap',
    }}>
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          style={{
            padding: '6px 14px', borderRadius: 20,
            border: active === t.key ? `2px solid ${t.color}` : '2px solid #e5e7eb',
            background: active === t.key ? t.color : '#fff',
            color: active === t.key ? '#fff' : '#6b7280',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: 'inherit',
            transition: 'all 0.15s',
          }}
        >
          {t.label}
          <span style={{
            background: active === t.key ? 'rgba(255,255,255,0.25)' : '#f3f4f6',
            color: active === t.key ? '#fff' : '#374151',
            borderRadius: 10, padding: '0 6px', fontSize: 11, fontWeight: 700,
          }}>
            {t.count}
          </span>
        </button>
      ))}
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────
export default function SchemesPage() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')

  useEffect(() => {
    fetch('/api/schemes/ranked')
      .then(r => r.json())
      .then(res => {
        if (res.success) setData(res.data)
        else setError(res.error || 'Failed to load schemes')
      })
      .catch(() => setError('Network error — please try again'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = data?.ranked_schemes.filter(s => {
    if (filter === 'eligible') return s.eligible
    if (filter === 'partial')  return !s.eligible && s.score.match_percent >= 40
    return true
  }) ?? []

  return (
    <div className="page-wrapper">
      <main className="content-area py-6">

        {/* Breadcrumb */}
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>
          <a href="/dashboard" style={{ color: '#6b7280', textDecoration: 'none' }}>Home</a> › <span style={{ fontWeight: 600, color: '#374151' }}>Schemes</span>
        </div>

        {/* Page header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{
            fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 6px',
            fontFamily: "'Noto Serif', serif",
          }}>
            Government Schemes for Farmers
          </h1>
          <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
            Schemes are ranked by how well they match your profile. Upload more documents to improve your score.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280' }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>⏳</div>
            <div style={{ fontSize: 14 }}>Analysing your profile against all schemes…</div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: '#fee2e2', border: '1px solid #fca5a5',
            borderRadius: 8, padding: 16, color: '#991b1b', fontSize: 14,
          }}>
            {error}
          </div>
        )}

        {/* Content */}
        {data && !loading && (
          <>
            {/* Summary banner */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
              marginBottom: 24,
            }}>
              {[
                { label: 'Fully Eligible', value: data.eligible_count, color: '#166534', bg: '#f0fdf4', border: '#bbf7d0', icon: '✅' },
                { label: 'Almost There', value: data.partial_count, color: '#92400e', bg: '#fffbeb', border: '#fcd34d', icon: '⚡' },
                { label: 'Total Schemes', value: data.total_schemes, color: '#1e3a5f', bg: '#eff6ff', border: '#bfdbfe', icon: '📋' },
              ].map(s => (
                <div key={s.label} style={{
                  background: s.bg, border: `1px solid ${s.border}`,
                  borderRadius: 10, padding: '14px 16px',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <span style={{ fontSize: 20 }}>{s.icon}</span>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "'DM Mono', monospace" }}>
                      {s.value}
                    </div>
                    <div style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Filter bar */}
            <FilterBar
              active={filter}
              onChange={setFilter}
              eligible={data.eligible_count}
              partial={data.partial_count}
              total={data.total_schemes}
            />

            {/* Scheme cards */}
            {filtered.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '40px 0', color: '#6b7280',
              }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>🔍</div>
                <div style={{ fontSize: 14 }}>No schemes found for this filter.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {filtered.map((scheme, i) => {
                  // rank is global position in full ranked list
                  const globalRank = (data.ranked_schemes.findIndex(s => s.scheme_id === scheme.scheme_id)) + 1
                  return <SchemeCard key={scheme.scheme_id} scheme={scheme} rank={globalRank} />
                })}
              </div>
            )}
          </>
        )}

      </main>
    </div>
  )
}