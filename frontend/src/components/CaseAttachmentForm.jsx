import { useRef, useState } from 'react'
import { FileText, Loader2, UploadCloud, X } from 'lucide-react'

const MAX_FILE_BYTES = 12 * 1024 * 1024
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
])

export default function CaseAttachmentForm({ onSubmit, disabled = false }) {
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dragging, setDragging] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const validateAndSelect = (nextFile) => {
    if (!nextFile || disabled || submitting) return

    if (!ALLOWED_TYPES.has((nextFile.type || '').toLowerCase())) {
      setError('فرمت مجاز افزونه: JPG، PNG، WEBP و PDF است.')
      return
    }
    if (nextFile.size > MAX_FILE_BYTES) {
      setError('حداکثر حجم هر افزونه ۱۲ مگابایت است.')
      return
    }

    setFile(nextFile)
    setError('')
    if (!title.trim()) {
      setTitle(nextFile.name.replace(/\.[^.]+$/, '').slice(0, 255))
    }
  }

  const clearFile = () => {
    setFile(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (disabled || submitting) return

    if (!file) {
      setError('ابتدا فایل افزونه را انتخاب کنید.')
      return
    }
    if (!title.trim()) {
      setError('عنوان افزونه را وارد کنید.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      await onSubmit({
        file,
        title: title.trim(),
        description: description.trim(),
      })
      setFile(null)
      setTitle('')
      setDescription('')
      if (inputRef.current) inputRef.current.value = ''
    } catch (err) {
      setError(err.message || 'ثبت افزونه انجام نشد.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="case-attachment-form" onSubmit={handleSubmit}>
      <div className="attachment-form-grid">
        
        <div className="attachment-meta-fields">
          <label className="field-block">
            <span className="field-label">عنوان افزونه <b className="required-mark">*</b></span>
            <input
              value={title}
              maxLength={255}
              placeholder="مثلاً قرارداد همکاری آزمون و ارزیابی"
              disabled={disabled || submitting}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <label className="field-block">
            <span className="field-label">توضیحات افزونه</span>
            <textarea
              rows={4}
              value={description}
              maxLength={4000}
              placeholder="توضیح کوتاهی درباره کاربرد این سند در پرونده بنویسید…"
              disabled={disabled || submitting}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
        </div>
        
        <div
          className={`attachment-file-picker ${dragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
          role={disabled ? undefined : 'button'}
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled}
          onKeyDown={(event) => {
            if ((event.key === 'Enter' || event.key === ' ') && !disabled && !submitting) {
              inputRef.current?.click()
            }
          }}
          onClick={() => !disabled && !submitting && inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault()
            if (!disabled && !submitting) setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            validateAndSelect(event.dataTransfer.files?.[0])
          }}
        >
          <input
            ref={inputRef}
            hidden
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            disabled={disabled || submitting}
            onChange={(event) => validateAndSelect(event.target.files?.[0])}
          />
          <span className="attachment-picker-icon"><UploadCloud size={25} /></span>
          <strong>{file ? 'تغییر فایل افزونه' : 'انتخاب فایل افزونه'}</strong>
          <small>JPG، PNG، WEBP یا PDF — حداکثر ۱۲ مگابایت</small>
        </div>

        
      </div>

      {file && (
        <div className="attachment-selected-file">
          <div>
            <FileText size={18} />
            <span><strong>{file.name}</strong><small>{formatBytes(file.size)}</small></span>
          </div>
          <button
            type="button"
            className="btn ghost btn-sm"
            onClick={clearFile}
            disabled={disabled || submitting}
            aria-label="حذف فایل انتخاب‌شده"
          >
            <X size={15} /> حذف فایل
          </button>
        </div>
      )}

      {error && <div className="error-banner" role="alert">{error}</div>}

      <div className="attachment-form-actions">
        <span>فایل پس از زدن دکمه «ثبت افزونه» به پرونده اضافه می‌شود.</span>
        <button
          type="submit"
          className="btn primary"
          disabled={disabled || submitting || !file || !title.trim()}
        >
          {submitting ? <Loader2 className="spin" size={17} /> : <UploadCloud size={17} />}
          {submitting ? 'در حال ثبت…' : 'ثبت افزونه'}
        </button>
      </div>
    </form>
  )
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return ''
  if (bytes < 1024) return `${bytes.toLocaleString('fa-IR')} بایت`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
