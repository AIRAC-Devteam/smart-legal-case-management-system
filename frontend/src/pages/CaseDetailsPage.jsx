import { useEffect, useState } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileText,
  Pencil,
  RefreshCw,
  Save,
  X,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import {
  generateDefenseDraft,
  getCase,
  updateCase,
} from '../api/client'
import CaseForm from '../components/CaseForm'

const labels = {
  case_type: {
    legal: 'حقوقی',
    criminal: 'کیفری',
    quasi_judicial: 'شبه قضایی',
    administrative: 'اداری',
  },
  classification: { normal: 'عادی', confidential: 'محرمانه' },
  financial_status: { financial: 'مالی', non_financial: 'غیر مالی' },
  submitted_by: { organization: 'سازمان/شرکت', other: 'دیگری' },
  case_status: { primary: 'اصلی', secondary: 'فرعی' },
}

function toEditForm(data) {
  return {
    ...data,
    amount: data?.amount ?? '',
  }
}

export default function CaseDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [caseData, setCaseData] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')

  const [generatingDefense, setGeneratingDefense] = useState(false)
  const [defenseResult, setDefenseResult] = useState(null)
  const [defenseDraft, setDefenseDraft] = useState('')
  const [defenseError, setDefenseError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const loadCase = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await getCase(id)
        setCaseData(data)
        setEditForm(toEditForm(data))
      } catch (err) {
        setError(err.message || 'دریافت پرونده انجام نشد.')
      } finally {
        setLoading(false)
      }
    }

    loadCase()
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSavedMessage('')

    try {
      const payload = {
        ...editForm,
        amount:
          editForm.amount === '' || editForm.amount == null
            ? null
            : editForm.amount,
      }
      delete payload.id
      delete payload.created_at
      delete payload.updated_at
      delete payload.notification_document_detail

      const updated = await updateCase(caseData.id, payload)
      setCaseData(updated)
      setEditForm(toEditForm(updated))
      setEditing(false)
      setSavedMessage('تغییرات پرونده ذخیره شد.')
    } catch (err) {
      setError(err.message || 'ذخیره تغییرات انجام نشد.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditForm(toEditForm(caseData))
    setEditing(false)
  }

  const handleGenerateDefense = async () => {
    if (!caseData?.id) return

    setGeneratingDefense(true)
    setDefenseError('')
    setCopied(false)

    try {
      const result = await generateDefenseDraft(caseData.id)
      setDefenseResult(result.defense || null)
      setDefenseDraft(result.defense?.full_text || '')
    } catch (err) {
      setDefenseError(err.message || 'تولید لایحه دفاعیه انجام نشد.')
    } finally {
      setGeneratingDefense(false)
    }
  }

  const copyDraft = async () => {
    if (!defenseDraft) return
    try {
      await navigator.clipboard.writeText(defenseDraft)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setDefenseError('کپی متن در مرورگر انجام نشد.')
    }
  }

  if (loading) {
    return <div className="page-wrap"><div className="state-card">در حال دریافت پرونده…</div></div>
  }

  if (error && !caseData) {
    return (
      <div className="page-wrap">
        <div className="error-banner">{error}</div>
      </div>
    )
  }

  if (!caseData) return null

  return (
    <div className="page-wrap wide">
      <header className="page-header case-details-header">
        <div>
          <button className="back-link button-link" onClick={() => navigate('/cases')}>
            <ArrowRight size={16} /> بازگشت به پرونده‌ها
          </button>
          <span className="eyebrow">پرونده ثبت‌شده</span>
          <h1>{caseData.case_name || 'جزئیات پرونده'}</h1>
          <p>
            شماره پرونده: <strong>{caseData.case_number || 'ثبت نشده'}</strong>
          </p>
        </div>

        <div className="header-actions">
          {editing ? (
            <>
              <button className="btn secondary" type="button" onClick={handleCancelEdit} disabled={saving}>
                <X size={17} /> انصراف
              </button>
              <button className="btn primary" type="button" onClick={handleSave} disabled={saving}>
                <Save size={17} /> {saving ? 'در حال ذخیره…' : 'ذخیره تغییرات'}
              </button>
            </>
          ) : (
            <button className="btn secondary" type="button" onClick={() => setEditing(true)}>
              <Pencil size={17} /> ویرایش پرونده
            </button>
          )}
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}
      {savedMessage && (
        <div className="success-banner inline-status">
          <CheckCircle2 size={18} /> {savedMessage}
        </div>
      )}

      {editing ? (
        <CaseForm form={editForm} onChange={setEditForm} />
      ) : (
        <section className="form-card details-card">
          <div className="section-heading">
            <div>
              <h2>اطلاعات تأییدشده پرونده</h2>
              <p>لایحه دفاعیه بر اساس همین اطلاعات ذخیره‌شده در Backend تولید می‌شود.</p>
            </div>
            {caseData.notification_document_detail?.file_url && (
              <a
                className="btn ghost"
                href={caseData.notification_document_detail.file_url}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink size={16} /> مشاهده سند اصلی
              </a>
            )}
          </div>

          <div className="details-grid">
            <Detail label="کلاسه داخلی" value={caseData.internal_ref} />
            <Detail label="شماره پرونده" value={caseData.case_number} />
            <Detail label="تاریخ تشکیل" value={caseData.creation_date} />
            <Detail label="مرجع رسیدگی" value={caseData.authority_category} />
            <Detail label="موضوع" value={caseData.subject_category} />
            <Detail label="نوع دعوی" value={labels.case_type[caseData.case_type]} />
            <Detail label="طبقه‌بندی" value={labels.classification[caseData.classification]} />
            <Detail label="وضعیت مالی" value={labels.financial_status[caseData.financial_status]} />
            <Detail label="مبلغ" value={formatAmount(caseData.amount)} />
            <Detail label="مطرح شده توسط" value={labels.submitted_by[caseData.submitted_by]} />
            <Detail label="وضعیت دعوی" value={labels.case_status[caseData.case_status]} />
            <Detail
              label="حبس"
              value={
                caseData.has_imprisonment === true
                  ? 'دارد'
                  : caseData.has_imprisonment === false
                    ? 'ندارد'
                    : 'نامشخص'
              }
            />
            <Detail label="استان" value={caseData.province} />
            <Detail label="شهر" value={caseData.city} />
          </div>

          <div className="details-text-grid">
            <DetailText label="طرفین پرونده" value={caseData.plaintiff_defendant} />
            <DetailText label="توضیحات و اطلاعات سند" value={caseData.description} />
          </div>
        </section>
      )}

      <section className="form-card defense-card">
        <div className="section-heading defense-heading">
          <div>
            <span className="eyebrow">دستیار حقوقی</span>
            <h2>پیش‌نویس لایحه دفاعیه</h2>
            <p>
              تولید متن فقط بعد از تشکیل پرونده و بر اساس داده‌های تأییدشده انجام می‌شود.
            </p>
          </div>

          <button
            type="button"
            className="btn primary"
            onClick={handleGenerateDefense}
            disabled={generatingDefense || editing}
            title={editing ? 'ابتدا تغییرات پرونده را ذخیره کنید.' : ''}
          >
            {generatingDefense ? (
              <RefreshCw className="spin" size={18} />
            ) : (
              <FileText size={18} />
            )}
            {generatingDefense
              ? 'در حال تهیه لایحه…'
              : defenseDraft
                ? 'تولید مجدد لایحه'
                : 'تهیه لایحه با هوش مصنوعی'}
          </button>
        </div>

        {editing && (
          <div className="info-banner">
            ابتدا تغییرات پرونده را ذخیره کنید تا لایحه بر اساس آخرین داده‌های تأییدشده تولید شود.
          </div>
        )}

        {defenseError && <div className="error-banner">{defenseError}</div>}

        {defenseResult && (
          <div className="defense-analysis">
            <InfoSection title="خلاصه ادعای طرف مقابل" text={defenseResult.claim_summary} />
            <InfoSection title="خلاصه موضع دفاعی" text={defenseResult.defense_summary} />
            <ListSection title="محورهای پیشنهادی دفاع" items={defenseResult.defense_arguments} />
            <ListSection title="تقاضاهای پیشنهادی" items={defenseResult.requested_relief} />
            <ListSection title="اطلاعات و مدارک موردنیاز" items={defenseResult.missing_information} warning />
            <ListSection title="موارد نیازمند بررسی حقوقی" items={defenseResult.review_notes} warning />
          </div>
        )}

        {defenseDraft && (
          <div className="draft-editor">
            <div className="draft-toolbar">
              <label className="field-label">متن قابل ویرایش پیش‌نویس</label>
              <button type="button" className="btn ghost btn-sm" onClick={copyDraft}>
                <Copy size={15} /> {copied ? 'کپی شد' : 'کپی متن'}
              </button>
            </div>
            <textarea
              rows={28}
              value={defenseDraft}
              onChange={(event) => setDefenseDraft(event.target.value)}
            />
            <div className="legal-review-note">
              این متن صرفاً پیش‌نویس تولیدشده توسط هوش مصنوعی است و پیش از هرگونه استفاده رسمی باید توسط کارشناس حقوقی بررسی و تأیید شود.
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div className="detail-item">
      <span>{label}</span>
      <strong>{value || '—'}</strong>
    </div>
  )
}

function DetailText({ label, value }) {
  return (
    <div className="detail-text-item">
      <span>{label}</span>
      <div>{value || '—'}</div>
    </div>
  )
}

function InfoSection({ title, text }) {
  if (!text) return null
  return (
    <div className="analysis-item">
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  )
}

function ListSection({ title, items, warning = false }) {
  if (!items?.length) return null
  return (
    <div className={`analysis-item ${warning ? 'warning' : ''}`}>
      <h3>{title}</h3>
      <ul>
        {items.map((item, index) => <li key={`${title}-${index}`}>{item}</li>)}
      </ul>
    </div>
  )
}

function formatAmount(value) {
  if (value == null || value === '') return '—'
  const number = Number(value)
  if (!Number.isFinite(number)) return String(value)
  return `${number.toLocaleString('fa-IR')} ریال`
}
