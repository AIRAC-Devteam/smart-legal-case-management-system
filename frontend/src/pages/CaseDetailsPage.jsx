import { useEffect, useState } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileSignature,
  FileText,
  History,
  Pencil,
  RefreshCw,
  Save,
  X,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import {
  generateDefenseDraft,
  getCase,
  getCaseDefenseDrafts,
  updateCase,
  updateDefenseDraft,
} from '../api/client'
import CaseForm from '../components/CaseForm'
import {
  CASE_STATUS_LABELS,
  CASE_TYPE_LABELS,
  CLASSIFICATION_LABELS,
  DRAFT_STATUS_LABELS,
  FINANCIAL_LABELS,
  SUBMITTED_BY_LABELS,
  draftStatusClass,
  formatAmount,
  formatDate,
} from '../utils/legal'

function toEditForm(data) {
  return {
    ...data,
    amount: data?.amount ?? '',
  }
}

function toDraftEditor(draft) {
  if (!draft) return null
  return {
    id: draft.id,
    title: draft.title || '',
    full_text: draft.full_text || '',
    status: draft.status || 'draft',
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

  const [drafts, setDrafts] = useState([])
  const [currentDraft, setCurrentDraft] = useState(null)
  const [draftEditor, setDraftEditor] = useState(null)
  const [generatingDefense, setGeneratingDefense] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [defenseError, setDefenseError] = useState('')
  const [draftMessage, setDraftMessage] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const loadCase = async () => {
      setLoading(true)
      setError('')
      try {
        const [data, draftData] = await Promise.all([
          getCase(id),
          getCaseDefenseDrafts(id),
        ])
        setCaseData(data)
        setEditForm(toEditForm(data))
        setDrafts(draftData)
        if (draftData.length) activateDraft(draftData[0])
      } catch (err) {
        setError(err.message || 'دریافت پرونده انجام نشد.')
      } finally {
        setLoading(false)
      }
    }

    loadCase()
  }, [id])

  const activateDraft = (draft) => {
    setCurrentDraft(draft)
    setDraftEditor(toDraftEditor(draft))
    setDefenseError('')
    setDraftMessage('')
    setCopied(false)
  }

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
      delete payload.defense_drafts_count
      delete payload.latest_defense_draft

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
    setDraftMessage('')
    setCopied(false)

    try {
      const result = await generateDefenseDraft(caseData.id)
      const createdDraft = result.draft
      setDrafts((previous) => [createdDraft, ...previous])
      activateDraft(createdDraft)
      setDraftMessage(
        `نسخه ${createdDraft.version.toLocaleString('fa-IR')} به‌صورت خودکار در مخزن پیش‌نویس‌ها ذخیره شد.`,
      )
      setCaseData((previous) => ({
        ...previous,
        defense_drafts_count: (previous.defense_drafts_count || 0) + 1,
        latest_defense_draft: createdDraft,
      }))
    } catch (err) {
      setDefenseError(err.message || 'تولید لایحه دفاعیه انجام نشد.')
    } finally {
      setGeneratingDefense(false)
    }
  }

  const saveCurrentDraft = async () => {
    if (!draftEditor?.id) return
    setSavingDraft(true)
    setDefenseError('')
    setDraftMessage('')

    try {
      const updated = await updateDefenseDraft(draftEditor.id, {
        title: draftEditor.title,
        full_text: draftEditor.full_text,
        status: draftEditor.status,
      })
      setCurrentDraft(updated)
      setDraftEditor(toDraftEditor(updated))
      setDrafts((previous) => previous.map((item) => item.id === updated.id ? updated : item))
      setDraftMessage('تغییرات متن و وضعیت پیش‌نویس ذخیره شد.')
    } catch (err) {
      setDefenseError(err.message || 'ذخیره پیش‌نویس انجام نشد.')
    } finally {
      setSavingDraft(false)
    }
  }

  const copyDraft = async () => {
    if (!draftEditor?.full_text) return
    try {
      await navigator.clipboard.writeText(draftEditor.full_text)
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
    return <div className="page-wrap"><div className="error-banner">{error}</div></div>
  }

  if (!caseData) return null

  const defenseResult = currentDraft?.structured_data || null

  return (
    <div className="page-wrap wide">
      <header className="page-header case-details-header">
        <div>
          <button className="back-link button-link" onClick={() => navigate('/cases')}>
            <ArrowRight size={16} /> بازگشت به پرونده‌ها
          </button>
          <span className="eyebrow">پرونده ثبت‌شده</span>
          <h1>{caseData.case_name || 'جزئیات پرونده'}</h1>
          <p>شماره پرونده: <strong>{caseData.case_number || 'ثبت نشده'}</strong></p>
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
      {savedMessage && <div className="success-banner inline-status"><CheckCircle2 size={18} /> {savedMessage}</div>}

      {editing ? (
        <CaseForm form={editForm} onChange={setEditForm} />
      ) : (
        <section className="form-card details-card">
          <div className="section-heading">
            <div>
              <h2>اطلاعات تأییدشده پرونده</h2>
              <p>تولید لایحه فقط بر اساس این داده‌های ذخیره‌شده در Backend انجام می‌شود.</p>
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

          <div className="details-text-grid">
            <DetailText label="طرفین پرونده" value={caseData.plaintiff_defendant} />
            <DetailText label="توضیحات و اطلاعات سند" value={caseData.description} />
          </div>
        </section>
      )}

      <section className="form-card defense-card">
        <div className="section-heading defense-heading">
          <div>
            <span className="eyebrow">دستیار حقوقی و تاریخچه نسخه‌ها</span>
            <h2>پیش‌نویس لایحه دفاعیه</h2>
            <p>هر بار تولید، به‌عنوان نسخه‌ای جدید ذخیره می‌شود و نسخه‌های قبلی از بین نمی‌روند.</p>
          </div>

          <div className="header-actions">
            <Link className="btn ghost" to="/defense-drafts"><FileSignature size={17} /> مخزن همه لوایح</Link>
            <button type="button" className="btn primary" onClick={handleGenerateDefense} disabled={generatingDefense || editing} title={editing ? 'ابتدا تغییرات پرونده را ذخیره کنید.' : ''}>
              {generatingDefense ? <RefreshCw className="spin" size={18} /> : <FileText size={18} />}
              {generatingDefense ? 'در حال تهیه لایحه…' : drafts.length ? 'تولید نسخه جدید' : 'تهیه لایحه با هوش مصنوعی'}
            </button>
          </div>
        </div>

        {editing && <div className="info-banner">ابتدا تغییرات پرونده را ذخیره کنید تا لایحه بر اساس آخرین داده‌های تأییدشده تولید شود.</div>}
        {defenseError && <div className="error-banner">{defenseError}</div>}
        {draftMessage && <div className="success-banner inline-status"><CheckCircle2 size={18} />{draftMessage}</div>}

        {drafts.length > 0 && (
          <div className="case-draft-layout">
            <aside className="version-history">
              <div className="version-history-title"><History size={18} /><strong>تاریخچه نسخه‌ها</strong></div>
              {drafts.map((draft) => (
                <button key={draft.id} type="button" className={`version-item ${currentDraft?.id === draft.id ? 'active' : ''}`} onClick={() => activateDraft(draft)}>
                  <div><strong>نسخه {draft.version.toLocaleString('fa-IR')}</strong><span className={draftStatusClass(draft.status)}>{DRAFT_STATUS_LABELS[draft.status]}</span></div>
                  <small>{formatDate(draft.created_at)}</small>
                </button>
              ))}
            </aside>

            <div className="version-content">
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

              {draftEditor && (
                <div className="draft-editor">
                  <div className="form-grid two draft-meta-form">
                    <label className="field-block">
                      <span className="field-label">عنوان پیش‌نویس</span>
                      <input value={draftEditor.title} onChange={(event) => setDraftEditor((previous) => ({ ...previous, title: event.target.value }))} />
                    </label>
                    <label className="field-block">
                      <span className="field-label">وضعیت بررسی</span>
                      <select value={draftEditor.status} onChange={(event) => setDraftEditor((previous) => ({ ...previous, status: event.target.value }))}>
                        {Object.entries(DRAFT_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </label>
                  </div>

                  <div className="draft-toolbar">
                    <label className="field-label">متن قابل ویرایش پیش‌نویس</label>
                    <button type="button" className="btn ghost btn-sm" onClick={copyDraft}><Copy size={15} /> {copied ? 'کپی شد' : 'کپی متن'}</button>
                  </div>
                  <textarea rows={28} value={draftEditor.full_text} onChange={(event) => setDraftEditor((previous) => ({ ...previous, full_text: event.target.value }))} />
                  <div className="legal-review-note">این متن صرفاً پیش‌نویس تولیدشده توسط هوش مصنوعی است و پیش از هرگونه استفاده رسمی باید توسط کارشناس حقوقی بررسی و تأیید شود.</div>
                  <div className="draft-save-row">
                    <span>آخرین ویرایش: {formatDate(currentDraft.updated_at)}</span>
                    <button type="button" className="btn primary" onClick={saveCurrentDraft} disabled={savingDraft}><Save size={17} />{savingDraft ? 'در حال ذخیره…' : 'ذخیره پیش‌نویس'}</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {!drafts.length && !generatingDefense && (
          <div className="empty-state defense-empty">
            <FileSignature size={38} />
            <strong>هنوز پیش‌نویسی برای این پرونده تولید نشده است</strong>
            <span>با دکمه بالا اولین نسخه را تولید کنید؛ نسخه به‌صورت خودکار ذخیره خواهد شد.</span>
          </div>
        )}
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

function InfoSection({ title, text }) {
  if (!text) return null
  return <div className="analysis-item"><h3>{title}</h3><p>{text}</p></div>
}

function ListSection({ title, items, warning = false }) {
  if (!items?.length) return null
  return (
    <div className={`analysis-item ${warning ? 'warning' : ''}`}>
      <h3>{title}</h3>
      <ul>{items.map((item, index) => <li key={`${title}-${index}`}>{item}</li>)}</ul>
    </div>
  )
}
