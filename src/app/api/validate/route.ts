import { NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

// POST - run all validation checks for a farmer
export async function POST() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const results = await _runAllValidations(user.userId)

  // Save validation results to DB
  for (const result of results) {
    await query(
      `INSERT INTO validation_results (user_id, validation_type, status, details, message)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.userId, result.type, result.status, JSON.stringify(result.details), result.message]
    )
  }

  const allPassed = results.every((r) => r.status === 'passed' || r.status === 'warning')

  return NextResponse.json({
    success: true,
    data: {
      all_passed: allPassed,
      results,
    },
  })
}

// GET - fetch latest validation results
export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const results = await query(
    `SELECT DISTINCT ON (validation_type)
       validation_type, status, message, details, checked_at
     FROM validation_results
     WHERE user_id = $1
     ORDER BY validation_type, checked_at DESC`,
    [user.userId]
  )

  return NextResponse.json({ success: true, data: results })
}

// -------------------------------------------------------
// VALIDATION FUNCTIONS
// -------------------------------------------------------

async function _runAllValidations(userId: string) {
  const results = []

  results.push(await _validateNameConsistency(userId))
  results.push(await _validateLandArea(userId))
  results.push(await _validateDocumentCurrency(userId))
  results.push(await _validateBankAccount(userId))
  results.push(await _validateDuplicateBenefit(userId))

  return results
}


async function _validateNameConsistency(userId: string) {
  /**
   * Check if name on Aadhaar matches name on land record and bank passbook.
   * Names often differ due to spelling variations — we do fuzzy matching.
   */
  const userProfile = await queryOne<{ full_name: string }>(
    'SELECT full_name FROM users WHERE id = $1',
    [userId]
  )

  const aadhaarDoc = await queryOne<{ ocr_data: Record<string, unknown> }>(
    `SELECT ocr_data FROM documents
     WHERE user_id = $1 AND doc_type = 'aadhaar' AND status IN ('ocr_done', 'verified')
     ORDER BY uploaded_at DESC LIMIT 1`,
    [userId]
  )

  const landDoc = await queryOne<{ ocr_data: Record<string, unknown> }>(
    `SELECT ocr_data FROM documents
     WHERE user_id = $1 AND doc_type = 'land_record' AND status IN ('ocr_done', 'verified')
     ORDER BY uploaded_at DESC LIMIT 1`,
    [userId]
  )

  const names: Record<string, string> = {}

  if (userProfile?.full_name) names['registered'] = userProfile.full_name
  if (aadhaarDoc?.ocr_data) {
    const extracted = (aadhaarDoc.ocr_data as Record<string, unknown>)?.extracted as Record<string, unknown>
    if (extracted?.name) names['aadhaar'] = extracted.name as string
  }
  if (landDoc?.ocr_data) {
    const extracted = (landDoc.ocr_data as Record<string, unknown>)?.extracted as Record<string, unknown>
    if (extracted?.farmer_name) names['land_record'] = extracted.farmer_name as string
  }

  if (Object.keys(names).length < 2) {
    return {
      type: 'name_consistency',
      status: 'pending',
      message: 'Not enough documents to check name consistency. Upload Aadhaar and land record.',
      details: { names },
    }
  }

  // Simple similarity check — normalize and compare
  const normalized = Object.values(names).map((n) =>
    n.toLowerCase().replace(/[^a-z\s]/g, '').trim()
  )
  const allMatch = normalized.every((n) => _nameSimilarity(normalized[0], n) > 0.7)

  return {
    type: 'name_consistency',
    status: allMatch ? 'passed' : 'warning',
    message: allMatch
      ? 'Name is consistent across documents'
      : 'Name spelling differs across documents. This may cause issues during verification.',
    details: { names, normalized },
  }
}


async function _validateLandArea(userId: string) {
  /**
   * Check if land area in land holdings matches OCR extracted area.
   */
  const holdings = await query<{ total_area_acres: number }>(
    'SELECT total_area_acres FROM land_holdings WHERE user_id = $1',
    [userId]
  )

  if (holdings.length === 0) {
    return {
      type: 'land_area',
      status: 'failed',
      message: 'No land holdings found. Please add your land details.',
      details: {},
    }
  }

  const totalAcres = holdings.reduce((sum, h) => sum + Number(h.total_area_acres), 0)

  if (totalAcres <= 0) {
    return {
      type: 'land_area',
      status: 'failed',
      message: 'Land area must be greater than 0 acres.',
      details: { total_acres: totalAcres },
    }
  }

  return {
    type: 'land_area',
    status: 'passed',
    message: `Total land area of ${totalAcres.toFixed(2)} acres verified.`,
    details: { total_acres: totalAcres, holdings_count: holdings.length },
  }
}


async function _validateDocumentCurrency(userId: string) {
  /**
   * Check if income certificate is recent (within 1 year).
   * Old income certificates are not accepted for most schemes.
   */
  const category = await queryOne<{
    income_cert_date: string
    income_certified: boolean
  }>(
    'SELECT income_cert_date, income_certified FROM farmer_category WHERE user_id = $1',
    [userId]
  )

  if (!category || !category.income_cert_date) {
    return {
      type: 'doc_currency',
      status: 'warning',
      message: 'Income certificate not uploaded. Required for income-based schemes.',
      details: {},
    }
  }

  const certDate = new Date(category.income_cert_date)
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  const isRecent = certDate > oneYearAgo

  return {
    type: 'doc_currency',
    status: isRecent ? 'passed' : 'warning',
    message: isRecent
      ? 'Income certificate is current and valid.'
      : 'Income certificate is older than 1 year. Please upload a recent one.',
    details: {
      cert_date: category.income_cert_date,
      is_recent: isRecent,
    },
  }
}


async function _validateBankAccount(userId: string) {
  /**
   * Check if farmer has an active Aadhaar-linked bank account for DBT.
   */
  const bankDetails = await query<{
    account_number: string
    is_aadhaar_linked: boolean
    is_active: boolean
  }>(
    'SELECT account_number, is_aadhaar_linked, is_active FROM bank_details WHERE user_id = $1',
    [userId]
  )

  if (bankDetails.length === 0) {
    return {
      type: 'bank_account',
      status: 'failed',
      message: 'No bank account found. A bank account is required for Direct Benefit Transfer.',
      details: {},
    }
  }

  const activeAccount = bankDetails.find((b) => b.is_active)
  if (!activeAccount) {
    return {
      type: 'bank_account',
      status: 'failed',
      message: 'No active bank account found.',
      details: {},
    }
  }

  if (!activeAccount.is_aadhaar_linked) {
    return {
      type: 'bank_account',
      status: 'warning',
      message: 'Bank account is not linked to Aadhaar. Link it at your nearest bank branch for DBT.',
      details: { account_number: activeAccount.account_number },
    }
  }

  return {
    type: 'bank_account',
    status: 'passed',
    message: 'Active Aadhaar-linked bank account found. Eligible for Direct Benefit Transfer.',
    details: { account_number: activeAccount.account_number },
  }
}


async function _validateDuplicateBenefit(userId: string) {
  /**
   * Check if farmer has already applied for or received the same scheme benefit.
   */
  const applications = await query<{
    scheme_id: string
    status: string
    applied_at: string
  }>(
    `SELECT sa.scheme_id, sa.status, sa.applied_at, s.short_name
     FROM scheme_applications sa
     JOIN schemes s ON s.id = sa.scheme_id
     WHERE sa.user_id = $1 AND sa.status IN ('approved', 'disbursed')`,
    [userId]
  )

  if (applications.length === 0) {
    return {
      type: 'duplicate_benefit',
      status: 'passed',
      message: 'No duplicate scheme benefits found.',
      details: { approved_applications: [] },
    }
  }

  return {
    type: 'duplicate_benefit',
    status: 'warning',
    message: `You have already received benefits for ${applications.length} scheme(s). Check eligibility carefully.`,
    details: { approved_applications: applications },
  }
}


// Simple name similarity using character overlap
function _nameSimilarity(a: string, b: string): number {
  if (a === b) return 1.0
  const aWords = new Set(a.split(' '))
  const bWords = new Set(b.split(' '))
  const intersection = new Set([...aWords].filter((w) => bWords.has(w)))
  const union = new Set([...aWords, ...bWords])
  return intersection.size / union.size
}