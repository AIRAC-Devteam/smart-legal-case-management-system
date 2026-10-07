import { useEffect, useMemo, useState } from 'react'
import { Eye, FileText, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getLegalSources, getLegalSourceText, recommendLegalSources } from '../api/client'
import Modal from './Modal'
import '../styles/legal-repository.css'

const PRIORITY_LABELS = {
  high: 'زیاد',
  medium: 'متوسط',
  low: 'کم',
}

const STATUS_LABELS = {
  ready: 'آماده انتخاب',
  failed: 'پردازش ناموفق؛ به مخزن مراجعه کنید',
  processing: 'در حال پردازش',
}

export default function LegalSourceSelector({
  caseId,
  selected,
  onChange,
  attachmentIds = [],
  disabled,
}) {
  const [sources, setSources] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [recommendations, setRecommendations] = useState([])
  const [recommendationLoading, setRecommendationLoading] = useState(false)
  const [recommendationError, setRecommendationError] = useState('')
  const [preview, setPreview] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState('')

  const applyRecommendations = async (availableSources, currentAttachmentIds) => {
    if (!caseId) return

    setRecommendationLoading(true)
    setRecommendationError('')
    try {
      const data = await recommendLegalSources(caseId, currentAttachmentIds)
      const availableIds = new Set(
        availableSources.filter((source) => source.status === 'ready').map((source) => source.id),
      )
      const validRecommendations = (data.recommendations || []).filter(
        (item) => availableIds.has(item.source_id),
      )
      const validSelected = (data.selected_source_ids || []).filter(
        (sourceId) => availableIds.has(sourceId),
      )
      setRecommendations(validRecommendations)
      onChange([...new Set(validSelected)])
    } catch (err) {
      setRecommendationError(err.message || 'پیشنهاد هوشمند منابع انجام نشد.')
    } finally {
      setRecommendationLoading(false)
    }
  }

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getLegalSources()
      setSources(data)
      onChange(selected.filter((id) => data.some((source) => source.id === id && source.status === 'ready')))
      await applyRecommendations(data, attachmentIds)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openPreview = async (source) => {
    setPreview({ source, text: '' })
    setPreviewLoading(true)
    setPreviewError('')
    try {
      const data = await getLegalSourceText(source.id)
      setPreview((previous) => previous?.source?.id === source.id
        ? { ...previous, text: data?.text || '' }
        : previous)
    } catch (err) {
      setPreviewError(err.message || 'دریافت متن سند انجام نشد.')
    } finally {
      setPreviewLoading(false)
    }
  }

  const readySources = useMemo(
    () => sources.filter((source) => source.status === 'ready'),
    [sources],
  )
  const total = sources
    .filter((source) => selected.includes(source.id))
    .reduce((sum, source) => sum + source.character_count, 0)
  const filtered = sources.filter((source) =>
    `${source.title} ${source.original_name}`.toLowerCase().includes(query.trim().toLowerCase()),
  )
  const allSelected = readySources.length > 0 && readySources.every((source) => selected.includes(source.id))
  const recommendationBySourceId = new Map(recommendations.map((item) => [item.source_id, item]))

  const toggleAll = (checked) => {
    onChange(checked ? readySources.map((source) => source.id) : [])
  }

  return (
    <>
      <fieldset className="legal-source-selector" disabled={disabled}>
        <legend>منابع قانونی این لایحه</legend>
        

        {loading ? (
          <p role="status">در حال دریافت منابع…</p>
        ) : error ? (
          <p className="error-banner" role="alert">{error}</p>
        ) : (
          <>
            {sources.length > 0 && (
              <label className="field-block">
                <span className="field-label">جستجوی سند</span>
                <input type="search" placeholder="مثلاً: قوانین آزمون، آیین‌نامه..." value={query} onChange={(event) => setQuery(event.target.value)} />
              </label>
            )}

            {readySources.length > 0 && (
              <div className="source-selection-toolbar">
                <label className={`source-option source-option-all ${allSelected ? 'selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(event) => toggleAll(event.target.checked)}
                  />
                  <span>
                    <strong>همه موارد</strong>
                    <small>انتخاب تمام منابع آماده ({readySources.length.toLocaleString('fa-IR')} سند)</small>
                  </span>
                </label>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => applyRecommendations(sources, attachmentIds)}
                  disabled={recommendationLoading}
                >
                  {recommendationLoading ? 'در حال بررسی پرونده…' : 'پیشنهاد مجدد هوشمند'}
                </button>
              </div>
            )}

            {recommendationError && (
              <p className="error-banner" role="alert">
                {recommendationError} انتخاب دستی منابع همچنان فعال است.
              </p>
            )}

            <div className="source-options">
              {filtered.map((source) => {
                const recommendation = recommendationBySourceId.get(source.id)
                const isSelected = selected.includes(source.id)
                return (
                  <div className={`source-option source-option-card ${isSelected ? 'selected' : ''}`} key={source.id}>
                    <label className="source-option-select">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={source.status !== 'ready'}
                        onChange={(event) => onChange(
                          event.target.checked
                            ? [...selected, source.id]
                            : selected.filter((id) => id !== source.id),
                        )}
                      />
                      <span className="source-option-copy">
                        <strong>{source.title}</strong>
                        <small>
                          {source.original_name} · {STATUS_LABELS[source.status] || source.status}
                        </small>
                        {recommendation && (
                          <small className={`source-recommendation ${recommendation.priority || 'medium'}`}>
                            پیشنهاد هوشمند · اولویت {PRIORITY_LABELS[recommendation.priority] || 'متوسط'}
                            {recommendation.reason ? ` — ${recommendation.reason}` : ''}
                          </small>
                        )}
                        {source.summary && <small className="source-option-summary">{source.summary}</small>}
                      </span>
                    </label>
                    <div className="source-option-actions">
                      <button
                        type="button"
                        className="btn ghost btn-sm"
                        onClick={() => openPreview(source)}
                        disabled={previewLoading && preview?.source?.id === source.id}
                      >
                        {previewLoading && preview?.source?.id === source.id
                          ? <Loader2 className="spin" size={15} />
                          : <Eye size={15} />}
                        مشاهده جزئیات
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {!filtered.length && (
              <p>{sources.length ? 'نتیجه‌ای پیدا نشد.' : 'مخزن خالی است. ابتدا سند قانونی اضافه کنید.'}</p>
            )}
          </>
        )}

        <p role="status">
          <b>{selected.length.toLocaleString('fa-IR')} منبع انتخاب‌شده</b> · {total.toLocaleString('fa-IR')} از ۴۰۰٬۰۰۰ نویسه مجاز (حداکثر ۳۰ سند)
        </p>
        {total > 400000 || selected.length > 30 ? (
          <p className="error-banner">منابع کمتری انتخاب کنید؛ این انتخاب از سقف مجاز بیشتر است.</p>
        ) : !selected.length ? (
          <p className="info-banner">بدون انتخاب منبع، پیش‌نویس فقط با اطلاعات پرونده و بدون افزودن استناد قانونی تهیه می‌شود.</p>
        ) : null}
      <div className="header-actions">
          <Link to="/legal-repository" className="btn ghost">رفتن به مخزن و افزودن سند</Link>
        </div>
      </fieldset>


      <Modal
        open={Boolean(preview)}
        onClose={() => {
          setPreview(null)
          setPreviewError('')
        }}
        title={preview?.source?.title || 'جزئیات منبع قانونی'}
      >
        {preview && (
          <div className="legal-source-modal" dir="rtl">
            <div className="legal-source-modal-meta">
              <div>
                <span>نام فایل</span>
                <strong>{preview.source.original_name || '—'}</strong>
              </div>
              <div>
                <span>وضعیت</span>
                <strong>{STATUS_LABELS[preview.source.status] || preview.source.status || '—'}</strong>
              </div>
              <div>
                <span>حجم متن</span>
                <strong>{(preview.source.character_count || 0).toLocaleString('fa-IR')} نویسه</strong>
              </div>
            </div>

            {preview.source.summary && (
              <section className="legal-source-modal-section">
                <h3>خلاصه سند</h3>
                <p>{preview.source.summary}</p>
              </section>
            )}

            <section className="legal-source-modal-section">
              <h3><FileText size={17} /> متن کامل استخراج‌شده</h3>
              {previewLoading ? (
                <div className="modal-loading"><Loader2 className="spin" size={22} /> در حال دریافت متن سند…</div>
              ) : previewError ? (
                <div className="error-banner" role="alert">{previewError}</div>
              ) : preview.text ? (
                <pre className="source-preview">{preview.text}</pre>
              ) : (
                <div className="info-banner">برای این سند هنوز متن قابل نمایش ثبت نشده است.</div>
              )}
            </section>
          </div>
        )}
      </Modal>
    </>
  )
}
