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
  const [phase, setPhase] = useState('idle')
  const [percent, setPercent] = useState(0)
  const [uploadingFile, setUploadingFile] = useState(null)
  const abortRef = useRef(null)

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

    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError('')
    setUploadingFile(file)
    setPercent(0)
    setPhase('uploading')

    try {
      const result = await uploadFile(file, title, {
        signal: controller.signal,
        onProgress: setPercent,
        onSent: () => {
          setPercent(100)
          setPhase('processing')
        },
      })
      applyResult(result)
    } catch (err) {
      if (err?.name !== 'AbortError') {
        setError(err.message || 'خطا در ارسال یا پردازش سند.')
      }
    } finally {
      abortRef.current = null
      setLoading(false)
      setPhase('idle')
      setUploadingFile(null)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const cancelUpload = (event) => {
    event.stopPropagation()
    abortRef.current?.abort()
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

      {phase !== 'idle' && uploadingFile ? (
        <UploadProgressCard
          file={uploadingFile}
          phase={phase}
          percent={percent}
          onCancel={cancelUpload}
        />
      ) : (
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
      )}

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

const faNumber = (value) => Number(value).toLocaleString('fa-IR')

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${faNumber(Math.max(1, Math.round(bytes / 1024)))} کیلوبایت`
  return `${Number((bytes / (1024 * 1024)).toFixed(1)).toLocaleString('fa-IR')} مگابایت`
}

function fileFormat(file) {
  const ext = file.name.includes('.') ? file.name.split('.').pop() : ''
  return (ext || file.type.split('/').pop() || '').toUpperCase()
}

function UploadProgressCard({ file, phase, percent, onCancel }) {
  const uploading = phase === 'uploading'

  return (
    <div className="upload-progress-card" role="status" aria-live="polite">
      <div className="upload-progress-top">
        <span className="upload-progress-badge">
          <i /> {uploading ? 'در حال بارگذاری فایل' : 'در حال پردازش با هوش مصنوعی'}
        </span>
        {uploading && (
          <button type="button" className="upload-cancel" onClick={onCancel}>
            لغو آپلود ×
          </button>
        )}
      </div>

      <div className="upload-progress-body">
        <div
          className={`upload-ring ${uploading ? '' : 'indeterminate'}`}
          style={{ '--pct': `${uploading ? percent : 28}%` }}
        >
          <span>{uploading ? `${faNumber(percent)}٪` : <Loader2 className="spin" size={30} />}</span>
        </div>

        <div className="upload-progress-file">
          <strong dir="auto">{file.name}</strong>
          <span>{formatSize(file.size)} • {fileFormat(file)}</span>
        </div>
        <span className="upload-progress-icon"><FileText size={26} /></span>
      </div>

      <div className="upload-progress-meta">
        <strong>{uploading ? 'در حال انتقال فایل…' : 'در حال استخراج اطلاعات از سند…'}</strong>
        {uploading && <span>{faNumber(percent)} از {faNumber(100)} درصد</span>}
      </div>
      <div className="upload-bar">
        <div
          className={uploading ? '' : 'indeterminate'}
          style={uploading ? { width: `${percent}%` } : undefined}
        />
      </div>
    </div>
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
