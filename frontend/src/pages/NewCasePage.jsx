import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { createCase } from '../api/client'
import CaseForm from '../components/CaseForm'
import DocumentUploader from '../components/DocumentUploader'

function mapExtraction(extracted, document) {
  const parties = []
  if (extracted.plaintiff) parties.push(`خواهان/شاکی: ${extracted.plaintiff}`)
  if (extracted.defendant) parties.push(`خوانده/طرف شکایت: ${extracted.defendant}`)

  const desc = []
  const push = (label, value) => {
    if (value) desc.push(`${label}: ${value}`)
  }

  push('نوع سند', extracted.document_type)
  push('شماره ابلاغیه', extracted.notification_number)
  push('شماره بایگانی', extracted.archive_number)
  push(
    'نام مخاطب',
    [extracted.first_name, extracted.last_name].filter(Boolean).join(' '),
  )
  push('نوع ابلاغیه', extracted.notification_type)
  push('تاریخ حضور', extracted.hearing_date)
  push('ساعت حضور', extracted.hearing_time)
  push('محل حضور', extracted.hearing_location)
  push('علت حضور', extracted.hearing_reason)
  push('سازمان/مرجع صادرکننده', extracted.organization)
  push('صادرکننده', extracted.issuer_name)
  push('سمت صادرکننده', extracted.issuer_role)

  if (extracted.notification_text) {
    desc.push(`\nمتن سند:\n${extracted.notification_text}`)
  }

  return {
    case_name:
      extracted.plaintiff && extracted.defendant
        ? `${extracted.plaintiff} علیه ${extracted.defendant}`
        : '',
    case_number: extracted.case_number || '',
    creation_date: extracted.issue_date || extracted.notification_date || '',
    authority_category: extracted.branch || extracted.organization || '',
    subject_category: extracted.subject_category || '',
    case_type: extracted.case_type || '',
    classification: extracted.classification || 'normal',
    financial_status: extracted.financial_status || '',
    amount: extracted.amount || '',
    submitted_by: extracted.submitted_by || '',
    has_imprisonment:
      typeof extracted.has_imprisonment === 'boolean'
        ? extracted.has_imprisonment
        : null,
    case_status: extracted.case_status || '',
    province: extracted.province || '',
    city: extracted.city || '',
    plaintiff_defendant: parties.join('\n'),
    description: desc.join('\n'),
    notification_data: extracted,
    notification_document: document?.id || null,
  }
}

const initialForm = {
  case_name: '',
  internal_ref: '',
  case_number: '',
  creation_date: '',
  authority_category: '',
  subject_category: '',
  case_type: '',
  classification: 'normal',
  financial_status: '',
  amount: '',
  submitted_by: '',
  has_imprisonment: null,
  case_status: '',
  province: '',
  city: '',
  plaintiff_defendant: '',
  description: '',
  notification_data: {},
  notification_document: null,
}

export default function NewCasePage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [document, setDocument] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [extracted, setExtracted] = useState(false)

  const handleExtractionComplete = (extractedData, uploadedDocument) => {
    setDocument(uploadedDocument)
    setForm((previous) => ({
      ...previous,
      ...mapExtraction(extractedData, uploadedDocument),
      internal_ref: previous.internal_ref || '',
    }))
    setExtracted(true)
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const payload = {
        ...form,
        amount: form.amount === '' || form.amount == null ? null : form.amount,
      }

      const createdCase = await createCase(payload)
      navigate(`/cases/${createdCase.id}`, { replace: true })
    } catch (err) {
      setError(err.message || 'تشکیل پرونده انجام نشد.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-wrap">
      <header className="page-header">
        <div>
          <span className="eyebrow">ثبت هوشمند</span>
          <h1>تشکیل پرونده جدید</h1>
          <p>
            سند را بارگذاری کنید، نتیجه استخراج را بازبینی کنید و سپس پرونده
            را ثبت نهایی کنید.
          </p>
        </div>
      </header>

      <DocumentUploader
        document={document}
        onDocumentChange={setDocument}
        onExtracted={handleExtractionComplete}
      />

      {extracted && (
        <div className="success-banner inline-status">
          <CheckCircle2 size={18} />
          اطلاعات سند استخراج شد. قبل از ثبت نهایی، فیلدها را بررسی کنید.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <CaseForm form={form} onChange={setForm} />

        {error && <div className="error-banner">{error}</div>}

        <div className="form-actions sticky-actions">
          <button type="submit" className="btn primary btn-lg" disabled={saving}>
            {saving ? 'در حال تشکیل پرونده…' : 'تأیید و تشکیل پرونده'}
          </button>
        </div>
      </form>
    </div>
  )
}
