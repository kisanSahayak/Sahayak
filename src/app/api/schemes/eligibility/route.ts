import { NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  // Fetch all farmer data in parallel
  const [profile, landHoldings, bankDetails, category, documents] = await Promise.all([
    queryOne<{
      full_name: string
      state: string
      land_area_acres: number
    }>(
      'SELECT full_name, state, land_area_acres FROM users WHERE id = $1',
      [user.userId]
    ),
    query<{
      total_area_acres: number
      is_verified: boolean
    }>(
      'SELECT total_area_acres, is_verified FROM land_holdings WHERE user_id = $1',
      [user.userId]
    ),
    query<{
      account_number: string
      is_aadhaar_linked: boolean
      is_verified: boolean
    }>(
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
    query<{
      doc_type: string
      status: string
      ocr_data: Record<string, unknown>
    }>(
      `SELECT doc_type, status, ocr_data FROM documents
       WHERE user_id = $1 AND status IN ('ocr_done', 'verified')`,
      [user.userId]
    ),
  ])

  // Build unified farmer data object
  const farmerData = _buildFarmerData(profile, landHoldings, bankDetails, category, documents)

  // Fetch all active schemes
  const schemes = await query<{
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
  }>(
    'SELECT * FROM schemes WHERE is_active = true ORDER BY tier ASC'
  )

  // Check eligibility for each scheme
  const results = schemes.map((scheme) => {
    const { eligible, passed_rules, failed_rules, missing_docs } =
      _checkEligibility(farmerData, scheme)

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
      passed_rules,
      failed_rules,
      missing_docs,
    }
  })

  // Save eligible schemes as notifications (only new ones)
  for (const result of results.filter((r) => r.eligible)) {
    const existing = await query(
      `SELECT id FROM notifications
       WHERE user_id = $1 AND title = $2`,
      [user.userId, `You may be eligible for ${result.short_name}`]
    )
    if (existing.length === 0) {
      await query(
        `INSERT INTO notifications (user_id, title, message, type, link)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          user.userId,
          `You may be eligible for ${result.short_name}`,
          `Based on your documents, you appear eligible for ${result.name}. Benefits: ${result.benefit_amount}`,
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
      results,
      eligible_count: results.filter((r) => r.eligible).length,
      total_schemes: results.length,
    },
  })
}


// -------------------------------------------------------
// BUILD FARMER DATA
// -------------------------------------------------------

function _buildFarmerData(
  profile: Record<string, unknown> | null,
  landHoldings: Record<string, unknown>[],
  bankDetails: Record<string, unknown>[],
  category: Record<string, unknown> | null,
  documents: Record<string, unknown>[]
) {
  // Total land area from land_holdings table
  const totalLandAcres = landHoldings.reduce(
    (sum, h) => sum + Number(h.total_area_acres || 0), 0
  )
  const hasVerifiedLand = landHoldings.some((h) => h.is_verified)

  // Bank account
  const hasBank = bankDetails.length > 0
  const hasAadhaarLinkedBank = bankDetails.some((b) => b.is_aadhaar_linked)

  // Get income — prefer certified OCR value over manually entered
  let annualIncome = category?.annual_income as number | null
  let incomeCertified = category?.income_certified as boolean || false
  for (const doc of documents) {
    if (doc.doc_type === 'income_certificate') {
      const extracted = (doc.ocr_data as Record<string, unknown>)?.extracted as Record<string, unknown>
      if (extracted?.annual_income) {
        annualIncome = parseFloat(extracted.annual_income as string)
        incomeCertified = true
      }
    }
  }

  // Get caste — prefer certified OCR value
  let casteCategory = category?.caste_category as string | null
  let casteCertified = category?.caste_certified as boolean || false
  for (const doc of documents) {
    if (doc.doc_type === 'caste_certificate') {
      const extracted = (doc.ocr_data as Record<string, unknown>)?.extracted as Record<string, unknown>
      if (extracted?.category) {
        casteCategory = extracted.category as string
        casteCertified = true
      }
    }
  }

  // Land record document
  const hasLandDoc = documents.some((d) => d.doc_type === 'land_record')

  return {
    state: profile?.state as string || null,
    land_area_acres: totalLandAcres,
    has_verified_land: hasVerifiedLand,
    has_land_doc: hasLandDoc,
    has_bank_account: hasBank,
    has_aadhaar_linked_bank: hasAadhaarLinkedBank,
    annual_income: annualIncome,
    income_certified: incomeCertified,
    caste_category: casteCategory,
    caste_certified: casteCertified,
    is_bpl: category?.is_bpl as boolean || false,
    farmer_type: category?.farmer_type as string || 'owner',
  }
}


// -------------------------------------------------------
// ELIGIBILITY CHECKER
// -------------------------------------------------------

function _checkEligibility(
  farmerData: ReturnType<typeof _buildFarmerData>,
  scheme: {
    min_land_acres: number
    max_land_acres: number
    max_income: number
    allowed_categories: string[]
    allowed_states: string[]
    requires_land_proof: boolean
    requires_bank_account: boolean
    requires_income_cert: boolean
    requires_caste_cert: boolean
  }
) {
  const passed_rules: string[] = []
  const failed_rules: string[] = []
  const missing_docs: string[] = []

  // 1. Land area check
  if (scheme.min_land_acres) {
    if (farmerData.land_area_acres >= scheme.min_land_acres) {
      passed_rules.push(`Owns ${farmerData.land_area_acres.toFixed(2)} acres of land (minimum ${scheme.min_land_acres} required)`)
    } else {
      failed_rules.push(`Minimum land area of ${scheme.min_land_acres} acres required`)
    }
  }

  if (scheme.max_land_acres && farmerData.land_area_acres > scheme.max_land_acres) {
    failed_rules.push(`Land area exceeds maximum limit of ${scheme.max_land_acres} acres`)
  }

  // 2. Land proof document check
  if (scheme.requires_land_proof) {
    if (farmerData.has_land_doc || farmerData.has_verified_land) {
      passed_rules.push('Land record document available')
    } else {
      failed_rules.push('Land record document required')
      missing_docs.push('Land Record / Khatauni / 7-12 Extract')
    }
  }

  // 3. Bank account check
  if (scheme.requires_bank_account) {
    if (farmerData.has_bank_account) {
      passed_rules.push('Active bank account found')
      if (farmerData.has_aadhaar_linked_bank) {
        passed_rules.push('Bank account is Aadhaar-linked for DBT')
      } else {
        failed_rules.push('Bank account must be linked to Aadhaar for Direct Benefit Transfer')
      }
    } else {
      failed_rules.push('Bank account required for Direct Benefit Transfer')
      missing_docs.push('Bank Passbook / Cancelled Cheque')
    }
  }

  // 4. Income check
  if (scheme.max_income) {
    if (farmerData.annual_income === null) {
      // Benefit of doubt — assume eligible but flag it
      passed_rules.push('Income not verified — assumed eligible (upload income certificate to confirm)')
    } else if (farmerData.annual_income <= scheme.max_income) {
      passed_rules.push(`Annual income Rs. ${farmerData.annual_income.toLocaleString('en-IN')} is within the limit of Rs. ${scheme.max_income.toLocaleString('en-IN')}`)
    } else {
      failed_rules.push(`Annual income exceeds the limit of Rs. ${scheme.max_income.toLocaleString('en-IN')}`)
    }
  }

  // 5. Income certificate check
  if (scheme.requires_income_cert) {
    if (farmerData.income_certified) {
      passed_rules.push('Income certificate verified')
    } else {
      failed_rules.push('Certified income certificate required')
      missing_docs.push('Income Certificate from Tehsildar')
    }
  }

  // 6. Caste category check
  if (scheme.allowed_categories && scheme.allowed_categories.length > 0) {
    const farmerCategory = farmerData.caste_category || 'General'
    if (scheme.allowed_categories.includes(farmerCategory)) {
      passed_rules.push(`Category ${farmerCategory} is eligible for this scheme`)
    } else {
      failed_rules.push(`This scheme is only for ${scheme.allowed_categories.join(', ')} category farmers`)
    }
  }

  // 7. Caste certificate check
  if (scheme.requires_caste_cert) {
    if (farmerData.caste_certified) {
      passed_rules.push('Caste certificate verified')
    } else {
      failed_rules.push('Certified caste certificate required')
      missing_docs.push('Caste Certificate from competent authority')
    }
  }

  // 8. State restriction check
  if (scheme.allowed_states && scheme.allowed_states.length > 0) {
    if (farmerData.state && scheme.allowed_states.includes(farmerData.state)) {
      passed_rules.push(`Scheme available in ${farmerData.state}`)
    } else {
      failed_rules.push(`This scheme is only available in: ${scheme.allowed_states.join(', ')}`)
    }
  }

  const eligible = failed_rules.length === 0

  return { eligible, passed_rules, failed_rules, missing_docs }
}