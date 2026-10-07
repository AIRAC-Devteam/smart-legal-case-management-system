import { useEffect, useState } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  FileSignature,
  FileText,
  History,
  RefreshCw,
  Save,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import {
  generateDefenseDraft,
  getCase,
  getCaseDefenseDrafts,
  updateDefenseDraft,
} from '../api/client'
import CaseAttachments from '../components/CaseAttachments'
import CaseWorkflowStepper from '../components/CaseWorkflowStepper'
import LegalSourceSelector from '../components/LegalSourceSelector'
import {
  DRAFT_STATUS_LABELS,
  draftStatusClass,
  formatDate,
} from '../utils/legal'

function toDraftEditor(draft) {
  if (!draft) return null
  return {
    id: draft.id,
    title: draft.title || '',
    full_text: draft.full_text || '',
    status: draft.status || 'draft',
  }
}

export default function CaseDefensePage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [caseData, setCaseData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [drafts, setDrafts] = useState([])
  const [attachments, setAttachments] = useState([])
  const [selectedSources, setSelectedSources] = useState([])
  const [currentDraft, setCurrentDraft] = useState(null)
  const [draftEditor, setDraftEditor] = useState(null)
  const [generatingDefense, setGeneratingDefense] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [defenseError, setDefenseError] = useState('')
  const [draftMessage, setDraftMessage] = useState('')
  const [copied, setCopied] = useState(false)

  const activateDraft = (draft) => {
    setCurrentDraft(draft)
    setDraftEditor(toDraftEditor(draft))
    setDefenseError('')
    setDraftMessage('')
    setCopied(false)
  }

  useEffect(() => {
    let active = true
    const loadCase = async () => {
      setLoading(true)
      setError('')
      try {
        const [data, draftData] = await Promise.all([
          getCase(id),
          getCaseDefenseDrafts(id),
        ])
        if (!active) return
        setCaseData(data)
        setAttachments(data.attachments || [])
        setDrafts(draftData)
        if (draftData.length) activateDraft(draftData[0])
      } catch (err) {
        if (active) setError(err.message || 'دریافت اطلاعات مرحله لایحه انجام نشد.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadCase()
    return () => {
      active = false
    }
  }, [id])

  const handleGenerateDefense = async () => {
    if (!caseData?.id) return

    setGeneratingDefense(true)
    setDefenseError('')
    setDraftMessage('')
    setCopied(false)

    try {
      const result = await generateDefenseDraft(
        caseData.id,
        selectedSources,
        attachments.map((attachment) => attachment.id),
      )
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
    return <div className="page-wrap"><div className="state-card">در حال آماده‌سازی مرحله پیش‌نویس لایحه…</div></div>
  }

  if (error && !caseData) {
    return <div className="page-wrap"><div className="error-banner">{error}</div></div>
  }

  if (!caseData) return null

  const workflowStep = caseData.workflow_step || 2
  const defenseResult = currentDraft?.structured_data || null

  if (workflowStep < 3) {
    return (
      <div className="page-wrap wide">
        <CaseWorkflowStepper activeStep={2} unlockedStep={2} caseId={caseData.id} />
        <section className="form-card workflow-guard-card">
          <CheckCircle2 size={34} />
          <h2>تأیید اطلاعات پرونده هنوز انجام نشده است</h2>
          <p>برای ورود به مرحله پیش‌نویس لایحه، ابتدا اطلاعات پرونده را بازبینی و تأیید کنید.</p>
          <button type="button" className="btn primary" onClick={() => navigate(`/cases/${caseData.id}`)}>
            بازگشت به مرحله تأیید
          </button>
        </section>
      </div>
    )
  }

  return (
    <div className="page-wrap wide">
      <CaseWorkflowStepper activeStep={3} unlockedStep={3} caseId={caseData.id} />

      <header className="page-header case-details-header">
        <div>
          <button className="back-link button-link" onClick={() => navigate(`/cases/${caseData.id}`)}>
            <ArrowRight size={16} /> بازگشت به اطلاعات تأییدشده
          </button>
          <h1>پیش‌نویس لایحه دفاعیه</h1>
          <p>
            پرونده: <strong>{caseData.case_name || caseData.case_number || `شماره ${caseData.id}`}</strong>
          </p>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <section className="form-card defense-card defense-page-card">
        <div className="section-heading defense-heading">
          <div>
            <span className="eyebrow">دستیار حقوقی و تاریخچه نسخه‌ها</span>
            <h2>ساخت و مدیریت پیش‌نویس</h2>
            <p>پیوست‌ها و منابع قانونی را انتخاب کنید؛ هر بار تولید به‌عنوان نسخه‌ای جدید ذخیره می‌شود.</p>
          </div>
        </div>

        <CaseAttachments
          caseId={caseData.id}
          attachments={attachments}
          onChange={setAttachments}
          disabled={generatingDefense}
        />

        <LegalSourceSelector
          key={id}
          caseId={caseData.id}
          selected={selectedSources}
          onChange={setSelectedSources}
          attachmentIds={attachments.map((attachment) => attachment.id)}
          disabled={generatingDefense}
        />

        {defenseError && <div className="error-banner">{defenseError}</div>}
        {draftMessage && <div className="success-banner inline-status"><CheckCircle2 size={18} />{draftMessage}</div>}

        <div className="defense-submit-row">
          <div className="defense-submit-copy">
            <strong>آماده تهیه لایحه هستید؟</strong>
            <span>پس از انتخاب افزونه‌ها و منابع قانونی، پیش‌نویس جدید را تولید کنید.</span>
          </div>
          <button type="button" className="btn primary btn-lg" onClick={handleGenerateDefense} disabled={generatingDefense}>
            {generatingDefense ? <RefreshCw className="spin" size={18} /> : <FileText size={18} />}
            {generatingDefense ? 'در حال تهیه لایحه…' : drafts.length ? 'تولید نسخه جدید' : 'تهیه لایحه با هوش مصنوعی'}
          </button>
        </div>

        {currentDraft && <div className="info-banner">
          منابع ثبت‌شده نسخه {currentDraft.version.toLocaleString('fa-IR')}:{' '}
          {currentDraft.source_snapshot?.length ? currentDraft.source_snapshot.map((s) => s.title).join('، ') : 'بدون منبع از مخزن'}
          {currentDraft.attachment_snapshot?.length ? ` · پیوست‌ها: ${currentDraft.attachment_snapshot.map((attachment) => attachment.title || attachment.original_name).join('، ')}` : ''}
        </div>}

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
