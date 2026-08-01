import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  FileSignature,
  Save,
  Search,
  Trash2,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  deleteDefenseDraft,
  getDefenseDrafts,
  updateDefenseDraft,
} from '../api/client'
import {
  DRAFT_STATUS_LABELS,
  draftStatusClass,
  formatDate,
} from '../utils/legal'

const statusOptions = [
  { value: 'all', label: 'همه' },
  { value: 'draft', label: 'پیش‌نویس' },
  { value: 'under_review', label: 'در حال بررسی' },
  { value: 'approved', label: 'تأییدشده' },
  { value: 'archived', label: 'بایگانی‌شده' },
]

export default function DefenseDraftsPage() {
  const [drafts, setDrafts] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [editor, setEditor] = useState(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await getDefenseDrafts()
        setDrafts(data)
        if (data.length) {
          setSelectedId(data[0].id)
          setEditor(toEditor(data[0]))
        }
      } catch (err) {
        setError(err.message || 'دریافت پیش‌نویس‌ها انجام نشد.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return drafts.filter((draft) => {
      const statusMatches = statusFilter === 'all' || draft.status === statusFilter
      const searchMatches = !normalized || [
        draft.title,
        draft.full_text,
        draft.case_detail?.case_name,
        draft.case_detail?.case_number,
        draft.case_detail?.internal_ref,
      ].some((value) => String(value || '').toLowerCase().includes(normalized))
      return statusMatches && searchMatches
    })
  }, [drafts, query, statusFilter])

  const stats = useMemo(() => ({
    all: drafts.length,
    draft: drafts.filter((item) => item.status === 'draft').length,
    under_review: drafts.filter((item) => item.status === 'under_review').length,
    approved: drafts.filter((item) => item.status === 'approved').length,
  }), [drafts])

  const selectDraft = (draft) => {
    setSelectedId(draft.id)
    setEditor(toEditor(draft))
    setError('')
    setMessage('')
    setCopied(false)
  }

  const saveDraft = async () => {
    if (!selectedId || !editor) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const updated = await updateDefenseDraft(selectedId, {
        title: editor.title,
        full_text: editor.full_text,
        status: editor.status,
      })
      setDrafts((previous) => previous.map((item) => item.id === updated.id ? updated : item))
      setEditor(toEditor(updated))
      setMessage('تغییرات پیش‌نویس ذخیره شد.')
    } catch (err) {
      setError(err.message || 'ذخیره پیش‌نویس انجام نشد.')
    } finally {
      setSaving(false)
    }
  }

  const removeDraft = async () => {
    if (!selectedId) return
    if (!window.confirm('این نسخه از پیش‌نویس حذف شود؟')) return
    setError('')
    try {
      await deleteDefenseDraft(selectedId)
      const remaining = drafts.filter((item) => item.id !== selectedId)
      setDrafts(remaining)
      setSelectedId(remaining[0]?.id || null)
      setEditor(remaining[0] ? toEditor(remaining[0]) : null)
    } catch (err) {
      setError(err.message || 'حذف پیش‌نویس انجام نشد.')
    }
  }

  const copyText = async () => {
    if (!editor?.full_text) return
    try {
      await navigator.clipboard.writeText(editor.full_text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setError('کپی متن در مرورگر انجام نشد.')
    }
  }

  return (
    <div className="page-wrap wide">
      <header className="page-header">
        <div>
          <span className="eyebrow">مخزن مرکزی لوایح</span>
          <h1>پیش‌نویس‌های تولیدشده با هوش مصنوعی</h1>
          <p>هر بار تولید لایحه، به‌صورت خودکار به‌عنوان یک نسخه مستقل در این بخش ذخیره می‌شود.</p>
        </div>
      </header>

      <section className="metric-grid draft-metrics">
        <MiniMetric label="کل نسخه‌ها" value={stats.all} />
        <MiniMetric label="پیش‌نویس" value={stats.draft} tone="neutral" />
        <MiniMetric label="در حال بررسی" value={stats.under_review} tone="warning" />
        <MiniMetric label="تأییدشده" value={stats.approved} tone="success" />
      </section>

      <div className="draft-toolbar-main">
        <div className="search-box">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="جستجو در عنوان، متن، شماره یا نام پرونده…"
          />
        </div>
        <div className="filter-chips">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`filter-chip ${statusFilter === option.value ? 'active' : ''}`}
              onClick={() => setStatusFilter(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {message && <div className="success-banner inline-status"><CheckCircle2 size={18} />{message}</div>}

      {loading ? (
        <div className="state-card">در حال دریافت پیش‌نویس‌ها…</div>
      ) : drafts.length === 0 ? (
        <div className="empty-state large-empty">
          <FileSignature size={38} />
          <strong>هنوز پیش‌نویسی ذخیره نشده است</strong>
          <span>از صفحه جزئیات یکی از پرونده‌ها، لایحه دفاعیه تولید کنید.</span>
          <Link className="btn primary" to="/cases">مشاهده پرونده‌ها</Link>
        </div>
      ) : (
        <section className="draft-workspace">
          <div className="draft-list-panel">
            <div className="draft-list-heading">
              <strong>{filtered.length.toLocaleString('fa-IR')} نسخه</strong>
              <span>مرتب‌شده بر اساس آخرین ایجاد</span>
            </div>
            <div className="draft-list">
              {filtered.map((draft) => (
                <button
                  key={draft.id}
                  type="button"
                  className={`draft-list-item ${selectedId === draft.id ? 'active' : ''}`}
                  onClick={() => selectDraft(draft)}
                >
                  <div className="draft-item-top">
                    <strong>{draft.title || 'پیش‌نویس لایحه دفاعیه'}</strong>
                    <span className={draftStatusClass(draft.status)}>{DRAFT_STATUS_LABELS[draft.status]}</span>
                  </div>
                  <p>{draft.case_detail?.case_name || 'پرونده بدون عنوان'}</p>
                  <div className="draft-item-meta">
                    <span>نسخه {draft.version.toLocaleString('fa-IR')}</span>
                    <span>{formatDate(draft.updated_at, false)}</span>
                  </div>
                </button>
              ))}
              {filtered.length === 0 && <div className="compact-empty">موردی با این فیلتر پیدا نشد.</div>}
            </div>
          </div>

          <div className="draft-editor-panel">
            {editor ? (
              <>
                <div className="draft-editor-header">
                  <div>
                    <span className="eyebrow">نسخه {editor.version.toLocaleString('fa-IR')}</span>
                    <h2>{editor.case_detail?.case_name || 'پرونده بدون عنوان'}</h2>
                    <p>شماره پرونده: {editor.case_detail?.case_number || 'ثبت نشده'}</p>
                  </div>
                  <Link className="btn ghost btn-sm" to={`/cases/${editor.case}`}>
                    <ExternalLink size={16} /> مشاهده پرونده
                  </Link>
                </div>

                <div className="form-grid two draft-meta-form">
                  <label className="field-block">
                    <span className="field-label">عنوان پیش‌نویس</span>
                    <input value={editor.title} onChange={(event) => setEditor((prev) => ({ ...prev, title: event.target.value }))} />
                  </label>
                  <label className="field-block">
                    <span className="field-label">وضعیت بررسی</span>
                    <select value={editor.status} onChange={(event) => setEditor((prev) => ({ ...prev, status: event.target.value }))}>
                      {statusOptions.slice(1).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                </div>

                <label className="field-block draft-full-editor">
                  <span className="field-label">متن کامل لایحه</span>
                  <textarea
                    rows={24}
                    value={editor.full_text}
                    onChange={(event) => setEditor((prev) => ({ ...prev, full_text: event.target.value }))}
                  />
                </label>

                <div className="legal-review-note">
                  این متن باید پیش از استفاده رسمی توسط کارشناس حقوقی بررسی و تأیید شود.
                </div>

                <div className="draft-editor-actions">
                  <button type="button" className="btn ghost" onClick={copyText}><Copy size={16} />{copied ? 'کپی شد' : 'کپی متن'}</button>
                  <button type="button" className="btn secondary danger-soft" onClick={removeDraft}><Trash2 size={16} />حذف نسخه</button>
                  <button type="button" className="btn primary" onClick={saveDraft} disabled={saving}><Save size={17} />{saving ? 'در حال ذخیره…' : 'ذخیره تغییرات'}</button>
                </div>
              </>
            ) : (
              <div className="empty-state"><FileSignature size={34} /><span>یک پیش‌نویس را انتخاب کنید.</span></div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

function toEditor(draft) {
  return {
    ...draft,
    title: draft.title || '',
    full_text: draft.full_text || '',
    status: draft.status || 'draft',
  }
}

function MiniMetric({ label, value, tone = 'primary' }) {
  return (
    <div className={`mini-metric tone-${tone}`}>
      <strong>{Number(value || 0).toLocaleString('fa-IR')}</strong>
      <span>{label}</span>
    </div>
  )
}
