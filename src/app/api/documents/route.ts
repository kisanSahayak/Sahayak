import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { query } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

// GET - list user's documents
export async function GET(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const documents = await query(
    `SELECT id, doc_type, file_name, file_size, mime_type, status, admin_remarks, uploaded_at, processed_at, verified_at
     FROM documents WHERE user_id = $1 ORDER BY uploaded_at DESC`,
    [user.userId]
  )

  return NextResponse.json({ success: true, data: documents })
}

// POST - upload a document
export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const doc_type = formData.get('doc_type') as string | null

    if (!file || !doc_type) {
      return NextResponse.json(
        { success: false, error: 'File and document type are required' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Only JPG, PNG, WebP and PDF files are allowed' },
        { status: 400 }
      )
    }

    // Validate file size (5MB max)
    const MAX_SIZE = 5 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }

    // Save file to disk
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', user.userId)
    await mkdir(uploadDir, { recursive: true })

    const fileExt = path.extname(file.name)
    const uniqueFileName = `${uuidv4()}${fileExt}`
    const filePath = path.join(uploadDir, uniqueFileName)

    const bytes = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(bytes))

    const relativePath = `/uploads/${user.userId}/${uniqueFileName}`

    // Save to DB
    const [doc] = await query<{ id: string; status: string }>(
      `INSERT INTO documents (user_id, doc_type, file_name, file_path, file_size, mime_type, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING id, status`,
      [user.userId, doc_type, file.name, relativePath, file.size, file.type]
    )

    // Create notification
    await query(
      `INSERT INTO notifications (user_id, title, message, type, link)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        user.userId,
        'Document Uploaded Successfully',
        `Your ${doc_type.replace('_', ' ')} has been uploaded and is pending verification.`,
        'info',
        '/dashboard',
      ]
    )

    // TODO: Trigger OCR service when ready
    // await triggerOCR(doc.id, relativePath)

    return NextResponse.json({
      success: true,
      message: 'Document uploaded successfully',
      data: { id: doc.id, status: doc.status },
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 })
  }
}