import { NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'


const WEIGHTS = {
  income: 40,
  land: 25,
  docs: 20,
  category: 15,
}


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

interface FarmerData {
  state: string | null
  land_area_acres: number
  has_verified_land: boolean
  has_land_doc: boolean
  has_bank_account: boolean
  has_aadhaar_linked_bank: boolean
  annual_income: number | null
  income_certified: boolean
  caste_category: string | null
  caste_certified: boolean
  is_bpl: boolean
  farmer_type: string
  
  doc_types_uploaded: string[]
}

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


export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const [profile, landHoldings, bankDetails, category, documents] = await Promise.all([
    queryOne<{ full_name: string; state: string; land_area_acres: number }>(
      'SELECT full_name, state, land_area_acres FROM users WHERE id = $1',
      [user.userId]
    ),
    query<{ total_area_acres: number; is_verified: boolean }>(
      'SELECT total_area_acres, is_verified FROM land_holdings WHERE user_id = $1',
      [user.userId]
    ),
    query<{ account_number: string; is_aadhaar_linked: boolean; is_verified: boolean }>(
      'SELECT account_number, is_aadhaar_linked, is_verified FROM bank_details WHERE user_id = $1 AND is_active = true',
      [user.userId]
    ),
    queryOne<{
      caste_category: string
      annual_income: number
      income_certified: boolean
      caste_certified: boolean
      is_bpl: boolean
      farmer_type: string
    }>(
      'SELECT caste_category, annual_income, income_certified, caste_certified, is_bpl, farmer_type FROM farmer_category WHERE user_id = $1',
      [user.userId]
    ),
    query<{ doc_type: string; status: string; ocr_data: Record<string, unknown> }>(
      `SELECT doc_type, status, ocr_data FROM documents
       WHERE user_id = $1 AND status IN ('ocr_done', 'verified')`,
      [user.userId]
    ),
  ])

  const farmerData = _buildFarmerData(profile, landHoldings, bankDetails, category, documents)

  const schemes = await query<Scheme>(
    'SELECT * FROM schemes WHERE is_active = true ORDER BY tier ASC'
  )

  const ranked: RankedScheme[] = schemes
    .map((scheme) => _scoreScheme(farmerData, scheme))
    .sort((a, b) => b.score.total_score - a.score.total_score)

  
  for (const result of ranked.filter((r) => r.eligible)) {
    const existing = await query(
      `SELECT id FROM notifications WHERE user_id = $1 AND title = $2`,
      [user.userId, `You may be eligible for ${result.short_name}`]
    )
    if (existing.length === 0) {
      await query(
        `INSERT INTO notifications (user_id, title, message, type, link) VALUES ($1, $2, $3, $4, $5)`,
        [
          user.userId,
          `You may be eligible for ${result.short_name}`,
          `Based on your profile, you appear eligible for ${result.name}. Benefits: ${result.benefit_amount}`,
          'success',
          '/schemes',
        ]
      )
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      farmer_data: farmerData,
      ranked_schemes: ranked,
      eligible_count: ranked.filter((r) => r.eligible).length,
      partial_count: ranked.filter((r) => !r.eligible && r.score.total_score >= 40).length,
      total_schemes: ranked.length,
    },
  })
}


function _buildFarmerData(
  profile: Record<string, unknown> | null,
  landHoldings: Record<string, unknown>[],
  bankDetails: Record<string, unknown>[],
  category: Record<string, unknown> | null,
  documents: Record<string, unknown>[]
): FarmerData {
  const totalLandAcres = landHoldings.reduce(
    (sum, h) => sum + Number(h.total_area_acres || 0), 0
  )
  const hasVerifiedLand = landHoldings.some((h) => h.is_verified)
  const hasBank = bankDetails.length > 0
  const hasAadhaarLinkedBank = bankDetails.some((b) => b.is_aadhaar_linked)

  let annualIncome = category?.annual_income as number | null
  let incomeCertified = (category?.income_certified as boolean) || false
  for (const doc of documents) {
    if (doc.doc_type === 'income_certificate') {
      const extracted = (doc.ocr_data as Record<string, unknown>)?.extracted as Record<string, unknown>
      if (extracted?.annual_income) {
        annualIncome = parseFloat(extracted.annual_income as string)
        incomeCertified = true
      }
    }
  }

  let casteCategory = category?.caste_category as string | null
  let casteCertified = (category?.caste_certified as boolean) || false
  for (const doc of documents) {
    if (doc.doc_type === 'caste_certificate') {
      const extracted = (doc.ocr_data as Record<string, unknown>)?.extracted as Record<string, unknown>
      if (extracted?.category) {
        casteCategory = extracted.category as string
        casteCertified = true
      }
    }
  }

  const docTypesUploaded = documents.map((d) => d.doc_type as string)

  return {
    state: (profile?.state as string) || null,
    land_area_acres: totalLandAcres,
    has_verified_land: hasVerifiedLand,
    has_land_doc: documents.some((d) => d.doc_type === 'land_record'),
    has_bank_account: hasBank,
    has_aadhaar_linked_bank: hasAadhaarLinkedBank,
    annual_income: annualIncome,
    income_certified: incomeCertified,
    caste_category: casteCategory,
    caste_certified: casteCertified,
    is_bpl: (category?.is_bpl as boolean) || false,
    farmer_type: (category?.farmer_type as string) || 'owner',
    doc_types_uploaded: docTypesUploaded,
  }
}


function _scoreScheme(farmer: FarmerData, scheme: Scheme): RankedScheme {
  const rules: RuleResult[] = []
  const missing_docs: string[] = []
  const what_to_do: string[] = []

  
  let income_score = 0
  if (!scheme.max_income) {
    
    income_score = WEIGHTS.income
  } else if (farmer.annual_income === null) {
    
    income_score = Math.round(WEIGHTS.income * 0.5)
    rules.push({ rule: 'Income not verified — upload income certificate to confirm eligibility', passed: false, impact: 'medium' })
    what_to_do.push('Upload your Income Certificate from Tehsildar to verify income')
  } else if (farmer.annual_income <= scheme.max_income) {
    
    const ratio = 1 - farmer.annual_income / scheme.max_income
    income_score = Math.round(WEIGHTS.income * (0.6 + 0.4 * ratio))
    rules.push({
      rule: `Income ₹${farmer.annual_income.toLocaleString('en-IN')} is within limit of ₹${scheme.max_income.toLocaleString('en-IN')}`,
      passed: true,
      impact: 'high',
    })
  } else {
    
    income_score = 0
    rules.push({
      rule: `Income ₹${farmer.annual_income.toLocaleString('en-IN')} exceeds scheme limit of ₹${scheme.max_income.toLocaleString('en-IN')}`,
      passed: false,
      impact: 'high',
    })
  }

  
  let land_score = 0
  let landFailed = false

  if (scheme.min_land_acres && farmer.land_area_acres < scheme.min_land_acres) {
    land_score = 0
    landFailed = true
    rules.push({
      rule: `Needs ${scheme.min_land_acres} acres minimum — you have ${farmer.land_area_acres.toFixed(2)} acres`,
      passed: false,
      impact: 'high',
    })
    what_to_do.push(`This scheme requires at least ${scheme.min_land_acres} acres of land`)
  } else if (scheme.max_land_acres && farmer.land_area_acres > scheme.max_land_acres) {
    land_score = 0
    landFailed = true
    rules.push({
      rule: `Land area ${farmer.land_area_acres.toFixed(2)} acres exceeds maximum of ${scheme.max_land_acres} acres`,
      passed: false,
      impact: 'high',
    })
  } else {
    
    land_score = WEIGHTS.land
    rules.push({
      rule: `Land area ${farmer.land_area_acres.toFixed(2)} acres qualifies`,
      passed: true,
      impact: 'high',
    })
  }

  
  if (scheme.requires_land_proof) {
    if (farmer.has_land_doc || farmer.has_verified_land) {
      land_score = Math.min(land_score + 0, WEIGHTS.land) 
      rules.push({ rule: 'Land record document on file', passed: true, impact: 'medium' })
    } else if (!landFailed) {
      land_score = Math.round(land_score * 0.6)
      rules.push({ rule: 'Land record document missing', passed: false, impact: 'medium' })
      missing_docs.push('Land Record / Khatauni / 7-12 Extract')
      what_to_do.push('Upload your Land Record (7-12 Extract or Khatauni) to complete eligibility')
    }
  }

  
  const KEY_DOCS = ['aadhaar', 'land_record', 'bank_passbook', 'income_certificate', 'caste_certificate']
  const uploaded = KEY_DOCS.filter((d) => farmer.doc_types_uploaded.includes(d))
  const docRatio = uploaded.length / KEY_DOCS.length
  let docs_score = Math.round(WEIGHTS.docs * docRatio)

  
  if (scheme.requires_bank_account) {
    if (!farmer.has_bank_account) {
      docs_score = Math.round(docs_score * 0.7)
      rules.push({ rule: 'No active bank account found', passed: false, impact: 'high' })
      missing_docs.push('Bank Passbook / Cancelled Cheque')
      what_to_do.push('Link an active bank account to your profile')
    } else if (!farmer.has_aadhaar_linked_bank) {
      docs_score = Math.round(docs_score * 0.85)
      rules.push({ rule: 'Bank account not linked to Aadhaar (DBT required)', passed: false, impact: 'medium' })
      what_to_do.push('Link your Aadhaar to your bank account for Direct Benefit Transfer (DBT)')
    } else {
      rules.push({ rule: 'Bank account active and Aadhaar-linked', passed: true, impact: 'high' })
    }
  }

  if (scheme.requires_income_cert && !farmer.income_certified) {
    docs_score = Math.round(docs_score * 0.85)
    rules.push({ rule: 'Certified income certificate required', passed: false, impact: 'medium' })
    if (!missing_docs.includes('Income Certificate from Tehsildar'))
      missing_docs.push('Income Certificate from Tehsildar')
  } else if (scheme.requires_income_cert) {
    rules.push({ rule: 'Income certificate verified', passed: true, impact: 'medium' })
  }

  if (scheme.requires_caste_cert && !farmer.caste_certified) {
    docs_score = Math.round(docs_score * 0.85)
    rules.push({ rule: 'Caste certificate required', passed: false, impact: 'medium' })
    if (!missing_docs.includes('Caste Certificate from competent authority'))
      missing_docs.push('Caste Certificate from competent authority')
  } else if (scheme.requires_caste_cert) {
    rules.push({ rule: 'Caste certificate verified', passed: true, impact: 'medium' })
  }

  
  let category_score = 0
  let categoryFailed = false

  if (!scheme.allowed_categories || scheme.allowed_categories.length === 0) {
    
    category_score = WEIGHTS.category
    rules.push({ rule: 'Open to all farmer categories', passed: true, impact: 'low' })
  } else {
    const farmerCat = farmer.caste_category || 'General'
    if (scheme.allowed_categories.includes(farmerCat)) {
      category_score = WEIGHTS.category
      rules.push({ rule: `Category ${farmerCat} is eligible for this scheme`, passed: true, impact: 'high' })
    } else {
      category_score = 0
      categoryFailed = true
      rules.push({
        rule: `Scheme is for ${scheme.allowed_categories.join(', ')} only — your category: ${farmerCat}`,
        passed: false,
        impact: 'high',
      })
    }
  }

  
  if (scheme.allowed_states && scheme.allowed_states.length > 0) {
    if (farmer.state && scheme.allowed_states.includes(farmer.state)) {
      rules.push({ rule: `Available in ${farmer.state}`, passed: true, impact: 'low' })
    } else {
      category_score = 0
      categoryFailed = true
      rules.push({
        rule: `Not available in your state (${farmer.state || 'unknown'})`,
        passed: false,
        impact: 'high',
      })
    }
  }

  
  const total_score = income_score + land_score + docs_score + category_score
  const match_percent = Math.min(100, total_score)

  
  const hardFails = rules.filter(
    (r) => !r.passed && r.impact === 'high' && (landFailed || categoryFailed || income_score === 0)
  )
  const eligible = rules.filter((r) => !r.passed && r.impact === 'high').length === 0

  
  if (eligible && what_to_do.length === 0) {
    what_to_do.push(`Click "Apply Now" to begin your ${scheme.short_name} application`)
  }

  void hardFails 

  return {
    scheme_id: scheme.id,
    name: scheme.name,
    short_name: scheme.short_name,
    description: scheme.description,
    benefits: scheme.benefits,
    benefit_amount: scheme.benefit_amount,
    ministry: scheme.ministry,
    application_url: scheme.application_url,
    tier: scheme.tier,
    eligible,
    score: {
      income_score,
      land_score,
      docs_score,
      category_score,
      total_score,
      match_percent,
    },
    rules,
    missing_docs,
    what_to_do,
  }
}