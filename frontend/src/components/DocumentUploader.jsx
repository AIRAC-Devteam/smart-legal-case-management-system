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
  onResult,
  uploadFile = uploadDocument,
  retryFile = reextractDocument,
  allowedTypes = ALLOWED_TYPES,
  allowedExtensions = [],
  accept = 'image/jpeg,image/png,image/webp,application/pdf',
  title,
  onTitleChange,
  isComplete = (result) => result.status === 'completed',
  isFailure = (result) => result.status === 'failed',
  showRetry = () => true,
  heading = 'بارگذاری سند قضایی',
  description = 'فایل را انتخاب کنید یا با Drag & Drop در این بخش رها کنید',
  fileHint = 'JPG، PNG، WEBP یا PDF — حداکثر ۱۲ مگابایت',
  chooseLabel = 'انتخاب فایل',
  retryLabel = 'پردازش مجدد',
  formatError = 'فرمت مجاز: JPG، PNG، WEBP و PDF.',
  disabled = false,
}) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const applyResult = (result) => {
    onDocumentChange?.(result)
    onResult?.(result)

    if (isComplete(result)) {
      onExtracted?.(result.extracted_data || {}, result)
      return
    }

    if (isFailure(result)) {
      setError(result.error_message || 'پردازش سند انجام نشد.')
    }
  }

  const processFile = async (file) => {
    if (!file || disabled) return

    const hasAllowedType = allowedTypes.has(file.type)
    const hasAllowedExtension = allowedExtensions.some((extension) =>
      file.name.toLowerCase().endsWith(extension.toLowerCase()),
    )

    if (!hasAllowedType && !hasAllowedExtension) {
      setError(formatError)
      return
    }

    if (file.size > MAX_FILE_BYTES) {
      setError('حداکثر حجم فایل ۱۲ مگابایت است.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await uploadFile(file, title)
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
    if (!document?.id || disabled) return

    setLoading(true)
    setError('')

    try {
      const result = await retryFile(document.id)
      applyResult(result)
    } catch (err) {
      setError(err.message || 'پردازش مجدد انجام نشد.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="upload-section">
      {title !== undefined && onTitleChange && (
        <label className="field-block">
          <span className="field-label">عنوان سند (اختیاری)</span>
          <input
            maxLength={255}
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="مثلاً قانون آیین دادرسی مدنی"
            disabled={loading || disabled}
          />
        </label>
      )}

      <div
        className={`upload-box ${dragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
        role={disabled ? undefined : 'button'}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(event) => {
          if ((event.key === 'Enter' || event.key === ' ') && !loading && !disabled) {
            inputRef.current?.click()
          }
        }}
        onDragOver={(event) => {
          event.preventDefault()
          if (disabled) return
          setDragging(true)
        }}
        onDragLeave={() => !disabled && setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          if (disabled) return
          setDragging(false)
          processFile(event.dataTransfer.files?.[0])
        }}
        onClick={() => !loading && !disabled && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          hidden
          disabled={disabled}
          onChange={(event) => processFile(event.target.files?.[0])}
        />

        <div className="scan-icon">
          {loading ? (
            <Loader2 className="spin" size={34} />
          ) : (
            <ScanLine size={36} />
          )}
        </div>

        <h2>{heading}</h2>
        <p>{loading ? 'در حال ارسال و پردازش سند…' : description}</p>
        <small>{fileHint}</small>

        {!loading && !document && (
          <span className="upload-cta">
            <UploadCloud size={18} /> {chooseLabel}
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
              <span>وضعیت: {statusLabel(document.status)}</span>
            </div>
          </div>

          {showRetry(document) && (
            <button
              className="btn ghost"
              type="button"
              onClick={reExtract}
              disabled={loading || disabled}
            >
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
              {retryLabel}
            </button>
          )}
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
    ready: 'آماده انتخاب',
    failed: 'ناموفق',
  }
  return labels[status] || status || 'نامشخص'
}
