import { useRef, useState } from 'react'
import {
  FileText,
  Loader2,
  RefreshCw,
  ScanLine,
  UploadCloud,
} from 'lucide-react'
import { reextractDocument, uploadDocument } from '../api/client'

const MAX_FILE_BYTES = 12 * 1024 * 1024

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
])

export default function DocumentUploader({
  onExtracted,
  document,
  onDocumentChange,
}) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const applyResult = (result) => {
    onDocumentChange?.(result)

    if (result.status === 'completed') {
      onExtracted?.(result.extracted_data || {}, result)
      return
    }

    setError(result.error_message || 'پردازش سند انجام نشد.')
  }

  const processFile = async (file) => {
    if (!file) return

    if (!ALLOWED_TYPES.has(file.type)) {
      setError('فرمت مجاز: JPG، PNG، WEBP و PDF.')
      return
    }

    if (file.size > MAX_FILE_BYTES) {
      setError('حداکثر حجم فایل ۱۲ مگابایت است.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await uploadDocument(file)
      applyResult(result)
    } catch (err) {
      setError(err.message || 'خطا در ارسال یا پردازش سند.')
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const reExtract = async (event) => {
    event.stopPropagation()
    if (!document?.id) return

    setLoading(true)
    setError('')

    try {
      const result = await reextractDocument(document.id)
      applyResult(result)
    } catch (err) {
      setError(err.message || 'پردازش مجدد انجام نشد.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="upload-section">
      <div
        className={`upload-box ${dragging ? 'dragging' : ''}`}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if ((event.key === 'Enter' || event.key === ' ') && !loading) {
            inputRef.current?.click()
          }
        }}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          processFile(event.dataTransfer.files?.[0])
        }}
        onClick={() => !loading && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          hidden
          onChange={(event) => processFile(event.target.files?.[0])}
        />

        <div className="scan-icon">
          {loading ? (
            <Loader2 className="spin" size={34} />
          ) : (
            <ScanLine size={36} />
          )}
        </div>

        <h2>بارگذاری سند قضایی</h2>
        <p>
          {loading
            ? 'در حال ارسال و استخراج اطلاعات با هوش مصنوعی…'
            : 'فایل را انتخاب کنید یا با Drag & Drop در این بخش رها کنید'}
        </p>
        <small>JPG، PNG، WEBP یا PDF — حداکثر ۱۲ مگابایت</small>

        {!loading && !document && (
          <span className="upload-cta">
            <UploadCloud size={18} /> انتخاب فایل
          </span>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      {document && (
        <div className="document-summary">
          <div className="document-meta">
            <span className="document-icon">
              <FileText size={20} />
            </span>
            <div>
              <strong>{document.original_name || 'سند بارگذاری‌شده'}</strong>
              <span>
                وضعیت: {statusLabel(document.status)}
                {document.extraction_engine
                  ? ` · موتور: ${document.extraction_engine}`
                  : ''}
              </span>
            </div>
          </div>

          <button
            className="btn ghost"
            type="button"
            onClick={reExtract}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            پردازش مجدد
          </button>
        </div>
      )}
    </section>
  )
}

function statusLabel(status) {
  const labels = {
    uploaded: 'بارگذاری شده',
    processing: 'در حال پردازش',
    completed: 'استخراج کامل شد',
    failed: 'ناموفق',
  }
  return labels[status] || status || 'نامشخص'
}
