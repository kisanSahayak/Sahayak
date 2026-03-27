
export interface FarmerProfile {
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
  primary_crops: string[]
}


const CROP_SCHEME_MAP: Record<string, string[]> = {
  'Wheat':                        ['PMFBY', 'NFSM', 'KCC'],
  'Cotton':                       ['PMFBY', 'KCC'],
  'Sugarcane':                    ['PMFBY', 'KCC', 'e-NAM'],
  'Pulses (Dal)':                 ['PMFBY', 'NFSM', 'KCC'],
  'Maize':                        ['PMFBY', 'NFSM'],
  'Vegetables':                   ['PMFBY', 'PMKSY', 'e-NAM'],
  'Fruits / Horticulture':        ['PMFBY', 'PMKSY', 'e-NAM', 'KCC'],
  'Oilseeds (Soybean/Groundnut)': ['PMFBY', 'NFSM', 'KCC'],
  'Spices':                       ['PMFBY', 'PMKSY', 'e-NAM'],
}

export interface SchemeRules {
  short_name: string
  min_land_acres: number | null
  max_land_acres: number | null
  max_income: number | null
  allowed_categories: string[]
  allowed_states: string[]
  requires_land_proof: boolean
  requires_bank_account: boolean
  requires_income_cert: boolean
  requires_caste_cert: boolean
}

export interface TreeResult {}

export interface TreeNode {
  node: string
  type: 'hard_gate' | 'soft_node'
  passed: boolean
  reason: string
}

const KEY_DOCS = [
  'aadhaar',
  'land_record',
  'bank_passbook',
  'income_certificate',
  'caste_certificate',
]


export function runDecisionTree(
  farmer: FarmerProfile,
  scheme: SchemeRules
): TreeResult {
  const path: TreeNode[] = []
  const softNotes: string[] = []
  let treeBonus = 0

  
  if (scheme.allowed_states && scheme.allowed_states.length > 0) {
    const stateMatch = !!(farmer.state && scheme.allowed_states.includes(farmer.state))
    path.push({
      node: 'STATE_CHECK',
      type: 'hard_gate',
      passed: stateMatch,
      reason: stateMatch
        ? `Scheme available in ${farmer.state}`
        : `Scheme restricted to: ${scheme.allowed_states.join(', ')} — your state: ${farmer.state || 'unknown'}`,
    })
    if (!stateMatch) {
      return _fail(path, `Scheme not available in ${farmer.state || 'your state'}`, softNotes)
    }
  } else {
    path.push({
      node: 'STATE_CHECK',
      type: 'hard_gate',
      passed: true,
      reason: 'No state restriction — open nationally',
    })
  }

  
  if (scheme.allowed_categories && scheme.allowed_categories.length > 0) {
    const farmerCat = farmer.caste_category || 'General'
    const catMatch = scheme.allowed_categories.includes(farmerCat)
    path.push({
      node: 'CATEGORY_CHECK',
      type: 'hard_gate',
      passed: catMatch,
      reason: catMatch
        ? `Category ${farmerCat} matches scheme requirement`
        : `Scheme is for ${scheme.allowed_categories.join('/')} only — your category: ${farmerCat}`,
    })
    if (!catMatch) {
      return _fail(path, `Category ${farmerCat} not eligible for this scheme`, softNotes)
    }
  } else {
    path.push({
      node: 'CATEGORY_CHECK',
      type: 'hard_gate',
      passed: true,
      reason: 'Open to all categories (General, OBC, SC, ST)',
    })
  }

  
  if (scheme.min_land_acres !== null && scheme.min_land_acres > 0) {
    const landMinOk = farmer.land_area_acres >= scheme.min_land_acres
    path.push({
      node: 'LAND_MIN_CHECK',
      type: 'hard_gate',
      passed: landMinOk,
      reason: landMinOk
        ? `Land ${farmer.land_area_acres.toFixed(2)} acres ≥ minimum ${scheme.min_land_acres} acres`
        : `Land ${farmer.land_area_acres.toFixed(2)} acres is below minimum ${scheme.min_land_acres} acres`,
    })
    if (!landMinOk) {
      return _fail(path, `Insufficient land — need ${scheme.min_land_acres} acres`, softNotes)
    }
  }

  if (scheme.max_land_acres !== null && scheme.max_land_acres > 0) {
    const landMaxOk = farmer.land_area_acres <= scheme.max_land_acres
    path.push({
      node: 'LAND_MAX_CHECK',
      type: 'hard_gate',
      passed: landMaxOk,
      reason: landMaxOk
        ? `Land ${farmer.land_area_acres.toFixed(2)} acres ≤ maximum ${scheme.max_land_acres} acres`
        : `Land ${farmer.land_area_acres.toFixed(2)} acres exceeds maximum ${scheme.max_land_acres} acres`,
    })
    if (!landMaxOk) {
      return _fail(path, `Land exceeds scheme maximum of ${scheme.max_land_acres} acres`, softNotes)
    }
  }

  
  if (scheme.max_income !== null && scheme.max_income > 0) {
    if (farmer.annual_income !== null) {
      const incomeOk = farmer.annual_income <= scheme.max_income
      path.push({
        node: 'INCOME_CHECK',
        type: 'hard_gate',
        passed: incomeOk,
        reason: incomeOk
          ? `Income ₹${farmer.annual_income.toLocaleString('en-IN')} ≤ limit ₹${scheme.max_income.toLocaleString('en-IN')}`
          : `Income ₹${farmer.annual_income.toLocaleString('en-IN')} exceeds limit ₹${scheme.max_income.toLocaleString('en-IN')}`,
      })
      if (!incomeOk) {
        return _fail(
          path,
          `Income ₹${farmer.annual_income.toLocaleString('en-IN')} exceeds scheme limit`,
          softNotes
        )
      }
    } else {
      
      path.push({
        node: 'INCOME_CHECK',
        type: 'hard_gate',
        passed: true,
        reason: 'Income unknown — assumed eligible (upload income certificate to confirm)',
      })
    }
  } else {
    path.push({
      node: 'INCOME_CHECK',
      type: 'hard_gate',
      passed: true,
      reason: 'No income restriction for this scheme',
    })
  }

  

  
  if (farmer.is_bpl) {
    const bplBonus = 10
    treeBonus += bplBonus
    path.push({
      node: 'BPL_BOOST',
      type: 'soft_node',
      passed: true,
      reason: `BPL status confirmed — +${bplBonus} priority bonus applied`,
    })
    softNotes.push(`BPL priority boost: +${bplBonus} points`)
  } else {
    path.push({
      node: 'BPL_BOOST',
      type: 'soft_node',
      passed: false,
      reason: 'Not BPL — no priority boost',
    })
  }

  
  const uploadedKeyDocs = KEY_DOCS.filter(d => farmer.doc_types_uploaded.includes(d))
  const docRatio = uploadedKeyDocs.length / KEY_DOCS.length
  const docBonus = Math.round(5 * docRatio) 

  
  const missingRequired: string[] = []

  if (scheme.requires_land_proof && !farmer.has_land_doc && !farmer.has_verified_land) {
    missingRequired.push('Land Record')
  }
  if (scheme.requires_bank_account && !farmer.has_bank_account) {
    missingRequired.push('Bank Account')
  }
  if (scheme.requires_bank_account && farmer.has_bank_account && !farmer.has_aadhaar_linked_bank) {
    missingRequired.push('Aadhaar-Bank Linkage')
  }
  if (scheme.requires_income_cert && !farmer.income_certified) {
    missingRequired.push('Income Certificate')
  }
  if (scheme.requires_caste_cert && !farmer.caste_certified) {
    missingRequired.push('Caste Certificate')
  }

  const docsPassed = missingRequired.length === 0

  path.push({
    node: 'DOC_COMPLETENESS',
    type: 'soft_node',
    passed: docsPassed,
    reason: docsPassed
      ? `All required documents present (${uploadedKeyDocs.length}/${KEY_DOCS.length} key docs uploaded) — +${docBonus} points`
      : `Missing required: ${missingRequired.join(', ')} — partial score applied`,
  })

  if (docsPassed) {
    treeBonus += docBonus
    softNotes.push(`Document completeness bonus: +${docBonus} points`)
  } else {
    const partialBonus = Math.round(docBonus * 0.5)
    treeBonus += partialBonus
    softNotes.push(
      `Partial document bonus: +${partialBonus} points (missing: ${missingRequired.join(', ')})`
    )
  }

  
  if (farmer.primary_crops && farmer.primary_crops.length > 0) {
    
    const matchingCrops = farmer.primary_crops.filter(crop =>
      CROP_SCHEME_MAP[crop]?.includes(scheme.short_name)
    )

    if (matchingCrops.length > 0) {
      const cropBonus = Math.min(5, matchingCrops.length * 2) 
      treeBonus += cropBonus
      path.push({
        node: 'CROP_BOOST',
        type: 'soft_node',
        passed: true,
        reason: `Crop match: ${matchingCrops.join(', ')} → relevant for ${scheme.short_name} (+${cropBonus} pts)`,
      })
      softNotes.push(`Crop relevance boost: +${cropBonus} points (${matchingCrops.join(', ')})`)
    } else {
      path.push({
        node: 'CROP_BOOST',
        type: 'soft_node',
        passed: false,
        reason: `Your crops (${farmer.primary_crops.join(', ')}) are not specifically targeted by ${scheme.short_name}`,
      })
    }
  } else {
    path.push({
      node: 'CROP_BOOST',
      type: 'soft_node',
      passed: false,
      reason: 'No crops selected — visit My Crops page to get scheme recommendations',
    })
  }

  
  return {
    tree_eligible: true,
    tree_path: path,
    tree_bonus: Math.min(treeBonus, 20), 
    hard_fail_reason: null,
    soft_score_notes: softNotes,
  }
}


function _fail(
  path: TreeNode[],
  reason: string,
  softNotes: string[]
): TreeResult {
  return {
    tree_eligible: false,
    tree_path: path,
    tree_bonus: 0,
    hard_fail_reason: reason,
    soft_score_notes: softNotes,
  }
}