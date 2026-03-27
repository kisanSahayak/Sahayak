import { NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { runDecisionTree, FarmerProfile } from '@/lib/schemeDecisionTree'

const WEIGHTS = { income: 40, land: 25, docs: 20, category: 15 }

interface Scheme {
  id: string
  name: string
  short_name: string
  description: string
  benefits: string
  ministry: string
  min_land_acres: number
  max_land_acres: number
  max_income: number
  allowed_categories: string[]
  allowed_states: string[]
  requires_land_proof: boolean
  requires_bank_account: boolean
  requires_income_cert: boolean
  requires_caste_cert: boolean
  benefit_amount: string
  application_url: string
  tier: number
}

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const [profile, landHoldings, bankDetails, category, documents] = await Promise.all([
    queryOne<{ full_name: string; state: string; land_area_acres: number }>(
      'SELECT full_name, state, land_area_acres FROM users WHERE id = $1', [user.userId]
    ),
    query<{ total_area_acres: number; is_verified: boolean }>(
      'SELECT total_area_acres, is_verified FROM land_holdings WHERE user_id = $1', [user.userId]
    ),
    query<{ account_number: string; is_aadhaar_linked: boolean; is_verified: boolean }>(
      'SELECT account_number, is_aadhaar_linked, is_verified FROM bank_details WHERE user_id = $1 AND is_active = true', [user.userId]
    ),
    queryOne<{ caste_category: string; annual_income: number; income_certified: boolean; caste_certified: boolean; is_bpl: boolean; farmer_type: string; primary_crops: string[] }>(
  'SELECT caste_category, annual_income, income_certified, caste_certified, is_bpl, farmer_type, primary_crops FROM farmer_category WHERE user_id = $1', [user.userId]
),
    query<{ doc_type: string; status: string; ocr_data: Record<string, unknown> }>(
      `SELECT doc_type, status, ocr_data FROM documents WHERE user_id = $1 AND status IN ('ocr_done', 'verified')`, [user.userId]
    ),
  ])

  const farmer = _buildFarmerProfile(profile, landHoldings, bankDetails, category, documents, cropData)
  const schemes = await query<Scheme>('SELECT * FROM schemes WHERE is_active = true ORDER BY tier ASC')

  const ranked = schemes
    .map((scheme) => _scoreScheme(farmer, scheme))
    .sort((a, b) => b.score.total_score - a.score.total_score)

  for (const result of ranked.filter((r) => r.eligible)) {
    const existing = await query(
      `SELECT id FROM notifications WHERE user_id = $1 AND title = $2`,
      [user.userId, `You may be eligible for ${result.short_name}`]
    )
    if (existing.length === 0) {
      await query(
        `INSERT INTO notifications (user_id, title, message, type, link) VALUES ($1, $2, $3, $4, $5)`,
        [user.userId, `You may be eligible for ${result.short_name}`,
          `Based on your profile, you appear eligible for ${result.name}. Benefits: ${result.benefit_amount}`,
          'success', '/schemes']
      )
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      farmer_data: farmer,
      ranked_schemes: ranked,
      eligible_count: ranked.filter((r) => r.eligible).length,
      partial_count: ranked.filter((r) => !r.eligible && r.score.total_score >= 40).length,
      total_schemes: ranked.length,
    },
  })
}

function _buildFarmerProfile(
  profile: Record<string, unknown> | null,
  landHoldings: Record<string, unknown>[],
  bankDetails: Record<string, unknown>[],
  category: Record<string, unknown> | null,
  documents: Record<string, unknown>[],
  cropData: Record<string, unknown> | null
): FarmerProfile {
  let annualIncome = category?.annual_income as number | null
  let incomeCertified = (category?.income_certified as boolean) || false
  let casteCategory = category?.caste_category as string | null
  let casteCertified = (category?.caste_certified as boolean) || false

  for (const doc of documents) {
    if (doc.doc_type === 'income_certificate') {
      const extracted = (doc.ocr_data as Record<string, unknown>)?.extracted as Record<string, unknown>
      if (extracted?.annual_income) { annualIncome = parseFloat(extracted.annual_income as string); incomeCertified = true }
    }
    if (doc.doc_type === 'caste_certificate') {
      const extracted = (doc.ocr_data as Record<string, unknown>)?.extracted as Record<string, unknown>
      if (extracted?.category) { casteCategory = extracted.category as string; casteCertified = true }
    }
  }

  return {
    state: (profile?.state as string) || null,
    land_area_acres: landHoldings.reduce((sum, h) => sum + Number(h.total_area_acres || 0), 0),
    has_verified_land: landHoldings.some((h) => h.is_verified),
    has_land_doc: documents.some((d) => d.doc_type === 'land_record'),
    has_bank_account: bankDetails.length > 0,
    has_aadhaar_linked_bank: bankDetails.some((b) => b.is_aadhaar_linked),
    annual_income: annualIncome,
    income_certified: incomeCertified,
    caste_category: casteCategory,
    caste_certified: casteCertified,
    is_bpl: (category?.is_bpl as boolean) || false,
    farmer_type: (category?.farmer_type as string) || 'owner',
    doc_types_uploaded: documents.map((d) => d.doc_type as string),
    primary_crops: (category?.primary_crops as string[]) || [],
  }
}

function _scoreScheme(farmer: FarmerProfile, scheme: Scheme) {
  const tree = runDecisionTree(farmer, { short_name: scheme.short_name, ...scheme })

  const rules = tree.tree_path.map((n) => ({
    rule: n.reason,
    passed: n.passed,
    impact: n.type === 'hard_gate' ? 'high' as const : 'low' as const,
  }))

  const missing_docs = _getMissingDocs(farmer, scheme)

  if (!tree.tree_eligible) {
    const p = _partialScore(farmer, scheme)
    return {
      scheme_id: scheme.id, name: scheme.name, short_name: scheme.short_name,
      description: scheme.description, benefits: scheme.benefits,
      benefit_amount: scheme.benefit_amount, ministry: scheme.ministry,
      application_url: scheme.application_url, tier: scheme.tier,
      eligible: false,
      score: { income_score: p.income, land_score: p.land, docs_score: p.docs, category_score: p.category, tree_bonus: 0, total_score: p.total, match_percent: p.total },
      tree: { path: tree.tree_path, hard_fail_reason: tree.hard_fail_reason, soft_notes: [] },
      rules, missing_docs,
      what_to_do: tree.hard_fail_reason ? [tree.hard_fail_reason] : [],
    }
  }

  const income_score   = _incomeScore(farmer, scheme)
  const land_score     = _landScore(farmer, scheme)
  const docs_score     = _docsScore(farmer, scheme)
  const category_score = WEIGHTS.category // tree validated category — always full
  const tree_bonus     = tree.tree_bonus
  const total_score    = Math.min(100, income_score + land_score + docs_score + category_score + tree_bonus)

  return {
    scheme_id: scheme.id, name: scheme.name, short_name: scheme.short_name,
    description: scheme.description, benefits: scheme.benefits,
    benefit_amount: scheme.benefit_amount, ministry: scheme.ministry,
    application_url: scheme.application_url, tier: scheme.tier,
    eligible: true,
    score: { income_score, land_score, docs_score, category_score, tree_bonus, total_score, match_percent: total_score },
    tree: { path: tree.tree_path, hard_fail_reason: null, soft_notes: tree.soft_score_notes },
    rules, missing_docs,
    what_to_do: tree.soft_score_notes.length > 0
      ? tree.soft_score_notes
      : [`Click "Apply Now" to begin your ${scheme.short_name} application`],
  }
}

function _incomeScore(farmer: FarmerProfile, scheme: Scheme): number {
  if (!scheme.max_income) return WEIGHTS.income
  if (farmer.annual_income === null) return Math.round(WEIGHTS.income * 0.5)
  const ratio = 1 - farmer.annual_income / scheme.max_income
  return Math.round(WEIGHTS.income * (0.6 + 0.4 * ratio))
}

function _landScore(farmer: FarmerProfile, scheme: Scheme): number {
  let score = WEIGHTS.land
  if (scheme.requires_land_proof && !farmer.has_land_doc && !farmer.has_verified_land) {
    score = Math.round(score * 0.6)
  }
  return score
}

function _docsScore(farmer: FarmerProfile, scheme: Scheme): number {
  const KEY_DOCS = ['aadhaar', 'land_record', 'bank_passbook', 'income_certificate', 'caste_certificate']
  const uploaded = KEY_DOCS.filter((d) => farmer.doc_types_uploaded.includes(d))
  let score = Math.round(WEIGHTS.docs * (uploaded.length / KEY_DOCS.length))
  if (scheme.requires_bank_account && !farmer.has_aadhaar_linked_bank) score = Math.round(score * 0.85)
  if (scheme.requires_income_cert && !farmer.income_certified) score = Math.round(score * 0.85)
  if (scheme.requires_caste_cert && !farmer.caste_certified) score = Math.round(score * 0.85)
  return score
}

function _partialScore(farmer: FarmerProfile, scheme: Scheme) {
  const income = scheme.max_income && farmer.annual_income && farmer.annual_income > scheme.max_income
    ? 0 : Math.round(WEIGHTS.income * 0.4)
  const land = (scheme.min_land_acres && farmer.land_area_acres < scheme.min_land_acres) ||
    (scheme.max_land_acres && farmer.land_area_acres > scheme.max_land_acres)
    ? 0 : Math.round(WEIGHTS.land * 0.5)
  const KEY_DOCS = ['aadhaar', 'land_record', 'bank_passbook', 'income_certificate', 'caste_certificate']
  const docs = Math.round(WEIGHTS.docs * (KEY_DOCS.filter(d => farmer.doc_types_uploaded.includes(d)).length / KEY_DOCS.length) * 0.5)
  const farmerCat = farmer.caste_category || 'General'
  const category = scheme.allowed_categories?.length > 0 && !scheme.allowed_categories.includes(farmerCat)
    ? 0 : Math.round(WEIGHTS.category * 0.5)
  return { income, land, docs, category, total: Math.min(60, income + land + docs + category) }
}

function _getMissingDocs(farmer: FarmerProfile, scheme: Scheme): string[] {
  const missing: string[] = []
  if (scheme.requires_land_proof && !farmer.has_land_doc && !farmer.has_verified_land) missing.push('Land Record / Khatauni / 7-12 Extract')
  if (scheme.requires_bank_account && !farmer.has_bank_account) missing.push('Bank Passbook / Cancelled Cheque')
  if (scheme.requires_bank_account && farmer.has_bank_account && !farmer.has_aadhaar_linked_bank) missing.push('Aadhaar–Bank Account Linkage')
  if (scheme.requires_income_cert && !farmer.income_certified) missing.push('Income Certificate from Tehsildar')
  if (scheme.requires_caste_cert && !farmer.caste_certified) missing.push('Caste Certificate from competent authority')
  return missing
}