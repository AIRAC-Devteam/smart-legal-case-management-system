import { useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  Paperclip,
  Trash2,
} from 'lucide-react'

import CaseAttachmentForm from './CaseAttachmentForm'
import { deleteCaseAttachment, uploadCaseAttachment } from '../api/client'

const DEFAULT_MAX_ATTACHMENTS = 5

const STATUS_LABELS = {
  uploaded: 'بارگذاری شد',
  processing: 'در حال پردازش',
  completed: 'آماده استفاده',
  failed: 'پردازش ناموفق',
}

export default function CaseAttachments({
  caseId,
  attachments,
  onChange,
  disabled = false,
  maxAttachments = DEFAULT_MAX_ATTACHMENTS,
}) {
  const [removingId, setRemovingId] = useState(null)
  const [error, setError] = useState('')

  const addAttachment = async ({ file, title, description }) => {
    setError('')
    try {
      const result = await uploadCaseAttachment(caseId, file, { title, description })
      if (!result?.id) return
      onChange((previous) => {
        const withoutCurrent = previous.filter((item) => item.id !== result.id)
        return [...withoutCurrent, result]
      })
    } catch (err) {
      throw err
    }
  }

  const removeAttachment = async (attachmentId) => {
    setRemovingId(attachmentId)
    setError('')
    try {
      await deleteCaseAttachment(caseId, attachmentId)
      onChange((previous) => previous.filter((item) => item.id !== attachmentId))
    } catch (err) {
      setError(err.message || 'حذف پیوست انجام نشد.')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <section className="case-attachments" aria-labelledby="case-attachments-title">
      <div className="section-heading attachments-heading">
        <div>
          <span className="eyebrow">مدارک تکمیلی پرونده</span>
          <h3 id="case-attachments-title">افزونه‌ها</h3>
          <p>
            فایل، عنوان و توضیحات سند تکمیلی را ثبت کنید تا در تنظیم لایحه مورد استفاده قرار بگیرد.
          </p>
        </div>
        <span className="attachment-count" role="status">
          {attachments.length.toLocaleString('fa-IR')} از {maxAttachments.toLocaleString('fa-IR')} سند
        </span>
      </div>

      {attachments.length < maxAttachments ? (
        <CaseAttachmentForm onSubmit={addAttachment} disabled={disabled} />
      ) : (
        <div className="info-banner attachment-limit-message" role="status">
          سقف {maxAttachments.toLocaleString('fa-IR')} افزونه برای این پرونده تکمیل شده است.
        </div>
      )}

      {error && <div className="error-banner" role="alert">{error}</div>}

      {attachments.length > 0 && (
        <div className="case-attachments-list" aria-label="فهرست افزونه‌های انتخاب‌شده">
          <div className="attachments-list-heading">
            <strong>
              <Paperclip size={16} aria-hidden="true" /> افزونه‌های این پرونده
            </strong>
            <span>حذف از این فهرست، فایل را از پرونده و سرور حذف می‌کند.</span>
          </div>

          {attachments.map((attachment) => (
            <div className="case-attachment-item" key={attachment.id}>
              <div className="case-attachment-info">
                <span className="case-attachment-icon" aria-hidden="true">
                  <FileText size={19} />
                </span>
                <div>
                  <strong title={attachment.title || attachment.original_name || 'سند تکمیلی'}>
                    {attachment.title || attachment.original_name || 'سند تکمیلی'}
                  </strong>
                  {attachment.title && attachment.original_name && (
                    <small className="case-attachment-filename">فایل: {attachment.original_name}</small>
                  )}
                  {attachment.description && (
                    <p className="case-attachment-description">{attachment.description}</p>
                  )}
                  <span className={`case-attachment-status ${attachment.status || ''}`}>
                    {attachment.status === 'failed' ? (
                      <AlertCircle size={14} aria-hidden="true" />
                    ) : attachment.status === 'processing' ? (
                      <Loader2 className="spin" size={14} aria-hidden="true" />
                    ) : (
                      <CheckCircle2 size={14} aria-hidden="true" />
                    )}
                    {STATUS_LABELS[attachment.status] || 'وضعیت نامشخص'}
                  </span>
                </div>
              </div>

              <button
                className="btn ghost btn-sm danger-soft case-attachment-remove"
                type="button"
                onClick={() => removeAttachment(attachment.id)}
                disabled={disabled || removingId === attachment.id}
                aria-label={`حذف ${attachment.title || attachment.original_name || 'سند تکمیلی'} از فهرست`}
              >
                <Trash2 size={15} aria-hidden="true" />
                حذف از انتخاب
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
