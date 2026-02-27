'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { DOCUMENT_TYPE_LABELS } from '@/types'

type DocumentType = keyof typeof DOCUMENT_TYPE_LABELS

export default function UploadPage() {
  const [docType, setDocType] = useState<DocumentType | ''>('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const f = acceptedFiles[0]
    if (!f) return
    setFile(f)
    setResult(null)
    if (f.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(f))
    } else {
      setPreview(null)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 5 * 1024 * 1024,
    onDropRejected: (r) => {
      if (r[0]?.errors[0]?.code === 'file-too-large') {
        setResult({ success: false, message: 'File too large. Max 5MB allowed.' })
      } else {
        setResult({ success: false, message: 'Invalid file. Only JPG, PNG, WebP, PDF up to 5MB.' })
      }
    },
  })

  const handleUpload = async () => {
    if (!file || !docType) return
    setUploading(true)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('doc_type', docType)

    const res = await fetch('/api/documents', { method: 'POST', body: formData })
    const data = await res.json()
    setUploading(false)

    if (data.success) {
      setResult({ success: true, message: 'Document uploaded successfully! It is now pending verification.' })
      setFile(null)
      setPreview(null)
      setDocType('')
    } else {
      setResult({ success: false, message: data.error || 'Upload failed. Please try again.' })
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gray-100">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200 px-4 py-2">
          <div className="max-w-7xl mx-auto text-xs text-gov-text-light">
            <Link href="/" className="hover:text-gov-blue">Home</Link>
            <span className="mx-2">›</span>
            <Link href="/dashboard" className="hover:text-gov-blue">Dashboard</Link>
            <span className="mx-2">›</span>
            <span className="text-gov-blue font-semibold">Upload Documents</span>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Upload Form */}
            <div className="lg:col-span-2">
              <div className="gov-card overflow-hidden">
                <div className="bg-gov-blue px-6 py-4">
                  <h1 className="text-white font-bold text-lg">UPLOAD DOCUMENT</h1>
                  <p className="text-blue-200 text-xs mt-0.5">Upload your documents for scheme eligibility verification</p>
                </div>

                <div className="p-6 space-y-6">
                  {/* Result message */}
                  {result && (
                    <div className={`rounded px-4 py-3 text-sm border ${result.success
                      ? 'bg-green-50 border-green-300 text-green-800'
                      : 'bg-red-50 border-red-300 text-red-700'
                    }`}>
                      {result.success ? '✅' : '⚠'} {result.message}
                      {result.success && (
                        <div className="mt-2">
                          <Link href="/dashboard" className="underline text-green-700">View in Dashboard →</Link>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Document Type Select */}
                  <div>
                    <label className="gov-label">Document Type *</label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value as DocumentType)}
                      className="gov-input"
                    >
                      <option value="">-- Select Document Type --</option>
                      {Object.entries(DOCUMENT_TYPE_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Dropzone */}
                  <div>
                    <label className="gov-label">Upload File *</label>
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                        isDragActive
                          ? 'border-gov-blue bg-blue-50'
                          : file
                          ? 'border-green-400 bg-green-50'
                          : 'border-gray-300 bg-gray-50 hover:border-gov-blue hover:bg-blue-50'
                      }`}
                    >
                      <input {...getInputProps()} />

                      {file ? (
                        <div>
                          {preview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={preview} alt="Preview" className="max-h-40 mx-auto mb-3 rounded shadow" />
                          ) : (
                            <div className="text-5xl mb-3">📄</div>
                          )}
                          <p className="font-semibold text-gov-green text-sm">{file.name}</p>
                          <p className="text-xs text-gov-text-light mt-1">{formatSize(file.size)}</p>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null) }}
                            className="text-xs text-red-500 hover:underline mt-2"
                          >
                            Remove file
                          </button>
                        </div>
                      ) : isDragActive ? (
                        <div>
                          <div className="text-5xl mb-3">📥</div>
                          <p className="text-gov-blue font-semibold">Drop the file here</p>
                        </div>
                      ) : (
                        <div>
                          <div className="text-5xl mb-3">📤</div>
                          <p className="text-gov-text font-semibold">Drag & drop file here</p>
                          <p className="text-gov-text-light text-sm mt-1">or click to browse</p>
                          <p className="text-xs text-gray-400 mt-3">JPG, PNG, WebP, PDF &bull; Max 5MB</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={!file || !docType || uploading}
                    className="gov-btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Uploading & Processing...
                      </>
                    ) : (
                      ' Upload Document'
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar: Instructions */}
            <div className="space-y-4">
              <div className="gov-card">
                <div className="border-b-2 border-gov-blue px-5 py-3">
                  <h2 className="font-bold text-gov-blue text-sm uppercase">UPLOAD GUIDELINES</h2>
                </div>
                <ul className="p-5 space-y-3">
                  {[
                    { icon: '✓', text: 'Upload clear, readable scans or photos', color: 'text-gov-green' },
                    { icon: '✓', text: 'File size must be less than 5MB', color: 'text-gov-green' },
                    { icon: '✓', text: 'Accepted formats: JPG, PNG, WebP, PDF', color: 'text-gov-green' },
                    { icon: '✗', text: 'Do not upload blurry or damaged documents', color: 'text-red-500' },
                    { icon: '✗', text: 'Do not upload expired documents', color: 'text-red-500' },
                    { icon: '✗', text: 'Do not upload documents of others', color: 'text-red-500' },
                  ].map((item, i) => (
                    <li key={i} className="flex gap-2 text-xs text-gov-text">
                      <span className={`font-bold ${item.color}`}>{item.icon}</span>
                      {item.text}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="gov-card">
                <div className="border-b-2 border-gov-blue px-5 py-3">
                  <h2 className="font-bold text-gov-blue text-sm uppercase">REQUIRED DOCUMENTS</h2>
                </div>
                <ul className="p-5 space-y-2">
                  {Object.values(DOCUMENT_TYPE_LABELS).slice(0, 5).map((label) => (
                    <li key={label} className="text-xs text-gov-text flex items-center gap-2">
                      <span className="text-gov-orange">▸</span> {label}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-300 rounded p-4 text-xs text-yellow-800">
                <p className="font-bold mb-1"> Privacy Notice</p>
                <p>Your documents are encrypted and stored securely. They are only accessible to authorized government officials.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}