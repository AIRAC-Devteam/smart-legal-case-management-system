import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Pencil,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { confirmCase, getCase } from '../api/client'
import CaseWorkflowStepper from '../components/CaseWorkflowStepper'
import {
  CASE_STATUS_LABELS,
  CASE_TYPE_LABELS,
  CLASSIFICATION_LABELS,
  FINANCIAL_LABELS,
  SUBMITTED_BY_LABELS,
  formatAmount,
} from '../utils/legal'

export default function CaseDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [caseData, setCaseData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const loadCase = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await getCase(id)
        if (active) setCaseData(data)
      } catch (err) {
        if (active) setError(err.message || 'دریافت پرونده انجام نشد.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadCase()
    return () => {
      active = false
    }
  }, [id])

  const handleConfirm = async () => {
    if (!caseData) return

    if ((caseData.workflow_step || 2) >= 3) {
      navigate(`/cases/${caseData.id}/defense`)
      return
    }

    setConfirming(true)
    setError('')
    try {
      const updated = await confirmCase(caseData.id)
      setCaseData(updated)
      navigate(`/cases/${caseData.id}/defense`)
    } catch (err) {
      setError(err.message || 'تأیید پرونده انجام نشد.')
    } finally {
      setConfirming(false)
    }
  }

  if (loading) {
    return <div className="page-wrap"><div className="state-card">در حال دریافت پرونده…</div></div>
  }

  if (error && !caseData) {
    return <div className="page-wrap"><div className="error-banner">{error}</div></div>
  }

  if (!caseData) return null

  const workflowStep = caseData.workflow_step || 2
  const isConfirmed = workflowStep >= 3
 function extractDescription(text) {
  if (!text) return ''

  // حذف نوع سند تا قبل از نام مخاطب
  text = text.replace(
    /نوع سند:\s*[^\n]*\n?/,
    ''
  )

  // حذف متن سند و هر چیزی بعد از آن
  text = text.replace(
    /متن\s*سند\s*:[\s\S]*/g,
    ''
  )

  return text.trim()
}
  return (
    <div className="page-wrap wide">
      <CaseWorkflowStepper
        activeStep={2}
        unlockedStep={workflowStep}
        caseId={caseData.id}
      />

      <header className="page-header case-details-header">
        <div>
          <button className="back-link button-link" onClick={() => navigate('/cases')}>
            <ArrowRight size={25} /> بازگشت به پرونده‌ها
          </button>
          <h1>{caseData.case_name || 'اطلاعات پرونده'}</h1>
          <p>شماره پرونده: <strong>{caseData.case_number || 'ثبت نشده'}</strong></p>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}
      {isConfirmed && (
        <div className="success-banner inline-status review-status-banner">
          <CheckCircle2 size={18} />
          این اطلاعات قبلاً تأیید شده‌اند؛ می‌توانید به مرحله پیش‌نویس لایحه ادامه دهید یا برای اصلاح، پرونده را ویرایش کنید.
        </div>
      )}

      <section className="form-card details-card case-review-card">
        <div className="section-heading">
          <div>
            <h2>اطلاعات تأییدشونده پرونده</h2>
            <p>اطلاعات زیر را بررسی کنید. پیش‌نویس لایحه فقط پس از تأیید شما در مرحله بعد نمایش داده می‌شود.</p>
          </div>
          {caseData.notification_document_detail?.file_url && (
            <a className="btn ghost" href={caseData.notification_document_detail.file_url} target="_blank" rel="noreferrer">
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
          <Detail label="نوع دعوی" value={CASE_TYPE_LABELS[caseData.case_type]} />
          <Detail label="طبقه‌بندی" value={CLASSIFICATION_LABELS[caseData.classification]} />
          <Detail label="وضعیت مالی" value={FINANCIAL_LABELS[caseData.financial_status]} />
          <Detail label="مبلغ" value={formatAmount(caseData.amount)} />
          <Detail label="مطرح شده توسط" value={SUBMITTED_BY_LABELS[caseData.submitted_by]} />
          <Detail label="وضعیت دعوی" value={CASE_STATUS_LABELS[caseData.case_status]} />
          <Detail label="حبس" value={caseData.has_imprisonment === true ? 'دارد' : caseData.has_imprisonment === false ? 'ندارد' : 'نامشخص'} />
          <Detail label="استان" value={caseData.province} />
          <Detail label="شهر" value={caseData.city} />
        </div>

        {/* <div className="details-text-grid">
          <DetailText label="طرفین پرونده" value={caseData.plaintiff_defendant} />
          <DetailText label="توضیحات و اطلاعات سند" value={caseData.description} />
        </div> */}
<div className="details-text-grid">
  <DetailText 
    label="طرفین پرونده" 
    value={caseData.plaintiff_defendant} 
  />

  <DetailText 
    label="توضیحات و اطلاعات سند" 
    value={extractDescription(caseData.description)} 
  />
</div>
<div className="document-text-box">
  <DetailText
    label="متن سند"
    value={caseData.notification_document_detail?.raw_text}
  />
</div>
        <div className="case-review-actions">
          <div className="case-review-actions-copy">
            <strong>اطلاعات پرونده صحیح است؟</strong>
            <span>با تأیید، مرحله پیش‌نویس لایحه برای این پرونده فعال می‌شود.</span>
          </div>
          <div className="case-review-buttons">
            <button
              type="button"
              className="btn secondary btn-lg"
              onClick={() => navigate(`/cases/${caseData.id}/edit`)}
              disabled={confirming}
            >
              <Pencil size={17} /> ویرایش پرونده
            </button>
            <button
              type="button"
              className="btn primary btn-lg"
              onClick={handleConfirm}
              disabled={confirming}
            >
              <CheckCircle2 size={18} />
              {confirming
                ? 'در حال تأیید…'
                : isConfirmed
                  ? 'ادامه به پیش‌نویس لایحه'
                  : 'تأیید اطلاعات و ادامه'}
              {!confirming && <ArrowLeft size={17} />}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

function Detail({ label, value }) {
  return <div className="detail-item"><span>{label}</span><strong>{value || '—'}</strong></div>
}

function DetailText({ label, value }) {
  return <div className="detail-text-item"><span>{label}</span><div>{value || '—'}</div></div>
}
