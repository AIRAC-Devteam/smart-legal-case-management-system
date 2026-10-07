import { useEffect, useState } from 'react'
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { createCase, getCase, updateCase } from '../api/client'
import CaseForm from '../components/CaseForm'
import CaseWorkflowStepper from '../components/CaseWorkflowStepper'
import DocumentUploader from '../components/DocumentUploader'

function mapExtraction(extracted, document) {
  const parties = []
  if (extracted.plaintiff) parties.push(`خواهان/شاکی: ${extracted.plaintiff}`)
  if (extracted.defendant) parties.push(`خوانده/طرف شکایت: ${extracted.defendant}`)

  const desc = []
  const push = (label, value) => {
    if (value) desc.push(`${label}: ${value}`)
  }

  //push('نوع سند', extracted.document_type)
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

function toForm(caseData) {
  if (!caseData) return initialForm
  return Object.fromEntries(
    Object.keys(initialForm).map((key) => [
      key,
      key === 'amount'
        ? (caseData[key] ?? '')
        : (caseData[key] ?? initialForm[key]),
    ]),
  )
}

export default function NewCasePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const [form, setForm] = useState(initialForm)
  const [document, setDocument] = useState(null)
  const [workflowStep, setWorkflowStep] = useState(isEditing ? 2 : 1)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEditing)
  const [error, setError] = useState('')
  const [extracted, setExtracted] = useState(false)

  useEffect(() => {
    if (!isEditing) return

    let active = true
    const loadCase = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await getCase(id)
        if (!active) return
        setForm(toForm(data))
        setDocument(data.notification_document_detail || null)
        setExtracted(Boolean(data.notification_document_detail))
        setWorkflowStep(data.workflow_step || 2)
      } catch (err) {
        if (active) setError(err.message || 'دریافت اطلاعات پرونده انجام نشد.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadCase()
    return () => {
      active = false
    }
  }, [id, isEditing])

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

      const savedCase = isEditing
        ? await updateCase(id, payload)
        : await createCase(payload)

      navigate(`/cases/${savedCase.id}`, { replace: true })
    } catch (err) {
      setError(err.message || (isEditing ? 'ذخیره تغییرات انجام نشد.' : 'تشکیل پرونده انجام نشد.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="page-wrap">
        <CaseWorkflowStepper
          activeStep={1}
          unlockedStep={Math.max(2, workflowStep)}
          caseId={id}
          lockForwardFromCurrent
        />
        <div className="state-card workflow-loading"><Loader2 className="spin" size={24} /> در حال دریافت اطلاعات پرونده…</div>
      </div>
    )
  }

  return (
    <div className="page-wrap">
      <CaseWorkflowStepper
        activeStep={1}
        unlockedStep={isEditing ? Math.max(2, workflowStep) : 1}
        caseId={id || null}
        lockForwardFromCurrent={isEditing}
      />

      <header className="page-header">
        <div>
          {isEditing && (
            <button className="back-link button-link" onClick={() => navigate(`/cases/${id}`)}>
              <ArrowRight size={16} /> بازگشت به بازبینی پرونده
            </button>
          )}
          <h1>{isEditing ? 'ویرایش اطلاعات پرونده' : 'تشکیل پرونده جدید'}</h1>
          <p>
            {isEditing
              ? 'اطلاعات را اصلاح کنید و ذخیره را بزنید؛ پس از هر ویرایش، پرونده دوباره وارد مرحله تأیید می‌شود.'
              : 'سند را بارگذاری کنید، نتیجه استخراج را بازبینی کنید و سپس پرونده را برای مرحله تأیید ثبت کنید.'}
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
          اطلاعات سند در فرم قرار گرفت. قبل از ادامه، فیلدها را بررسی کنید.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <CaseForm form={form} onChange={setForm} />

        {error && <div className="error-banner">{error}</div>}

        <div className="form-actions sticky-actions case-flow-actions">
          {isEditing && (
            <button
              type="button"
              className="btn secondary btn-lg"
              onClick={() => navigate(`/cases/${id}`)}
              disabled={saving}
            >
              انصراف و بازگشت
            </button>
          )}
          <button type="submit" className="btn primary btn-lg" disabled={saving}>
            {saving
              ? 'در حال ذخیره…'
              : isEditing
                ? 'ذخیره و بازگشت به تأیید'
                : 'ثبت پرونده و ادامه'}
          </button>
        </div>
      </form>
    </div>
  )
}
