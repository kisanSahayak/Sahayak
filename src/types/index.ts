export interface User {
  id: string
  full_name: string
  phone: string
  email?: string
  aadhaar_last4?: string
  state?: string
  district?: string
  village?: string
  land_area_acres?: number
  role: 'farmer' | 'admin'
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  user_id: string
  doc_type: string
  file_name: string
  file_path: string
  file_size?: number
  mime_type?: string
  status: 'pending' | 'processing' | 'ocr_done' | 'verified' | 'rejected'
  ocr_text?: string
  ocr_data?: Record<string, unknown>
  admin_remarks?: string
  uploaded_at: string
  processed_at?: string
  verified_at?: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  is_read: boolean
  link?: string
  created_at: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export type DocumentType =
  | 'land_record'
  | 'aadhaar'
  | 'bank_passbook'
  | 'income_certificate'
  | 'caste_certificate'
  | 'photo'
  | 'other'

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  land_record: 'Land Record / Khatoni',
  aadhaar: 'Aadhaar Card',
  bank_passbook: 'Bank Passbook',
  income_certificate: 'Income Certificate',
  caste_certificate: 'Caste Certificate',
  photo: 'Passport Photo',
  other: 'Other Document',
}

export const STATUS_COLORS: Record<Document['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  ocr_done: 'bg-purple-100 text-purple-800',
  verified: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

export const STATUS_LABELS: Record<Document['status'], string> = {
  pending: 'Pending',
  processing: 'Processing',
  ocr_done: 'OCR Complete',
  verified: 'Verified',
  rejected: 'Rejected',
}