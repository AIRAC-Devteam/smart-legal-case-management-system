import { useEffect, useMemo, useState } from 'react'
import { Eye, FileSignature, Gavel, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getCases } from '../api/client'
import {
  CASE_TYPE_LABELS,
  CLASSIFICATION_LABELS,
  caseTypeLabel,
  formatAmount,
  formatDate,
} from '../utils/legal'

const typeFilters = [
  ['all', 'همه دعاوی'],
  ['legal', 'حقوقی'],
  ['criminal', 'کیفری'],
  ['administrative', 'اداری'],
  ['quasi_judicial', 'شبه قضایی'],
]

export default function LawsuitsPage() {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')

  useEffect(() => {
    const load = async () => {
      try {
        setCases(await getCases())
      } catch (err) {
        setError(err.message || 'دریافت دعاوی انجام نشد.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return cases.filter((item) => {
      const typeMatches = type === 'all' || item.case_type === type
      const queryMatches = !q || [
        item.case_name,
        item.case_number,
        item.subject_category,
        item.authority_category,
        item.plaintiff_defendant,
      ].some((value) => String(value || '').toLowerCase().includes(q))
      return typeMatches && queryMatches
    })
  }, [cases, query, type])

  const stats = useMemo(() => ({
    total: cases.length,
    financial: cases.filter((item) => item.financial_status === 'financial').length,
    confidential: cases.filter((item) => item.classification === 'confidential').length,
    withDraft: cases.filter((item) => item.defense_drafts_count > 0).length,
  }), [cases])

  return (
    <div className="page-wrap wide">
      <header className="page-header">
        <div>
          <span className="eyebrow">پرتفوی حقوقی</span>
          <h1>دعاوی</h1>
          <p>نمای مدیریتی پرونده‌ها بر اساس نوع دعوی، وضعیت مالی و آمادگی دفاع</p>
        </div>
      </header>

      <section className="metric-grid">
        <LawsuitMetric label="کل دعاوی" value={stats.total} />
        <LawsuitMetric label="دعاوی مالی" value={stats.financial} />
        <LawsuitMetric label="پرونده محرمانه" value={stats.confidential} />
        <LawsuitMetric label="دارای پیش‌نویس دفاع" value={stats.withDraft} />
      </section>

      <div className="lawsuit-controls">
        <div className="search-box">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="جستجو در دعاوی…" />
        </div>
        <div className="filter-chips">
          {typeFilters.map(([value, label]) => (
            <button key={value} className={`filter-chip ${type === value ? 'active' : ''}`} onClick={() => setType(value)}>{label}</button>
          ))}
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="table-card">
        {loading ? (
          <div className="empty-state">در حال دریافت دعاوی…</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><Gavel size={34} /><strong>دعوی‌ای یافت نشد</strong></div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>پرونده</th>
                  <th>نوع دعوی</th>
                  <th>موضوع و مرجع</th>
                  <th>ارزش مالی</th>
                  <th>طبقه‌بندی</th>
                  <th>آمادگی دفاع</th>
                  <th>آخرین تغییر</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.case_name || 'بدون عنوان'}</strong>
                      <small className="table-subtext">{item.case_number || 'بدون شماره'}</small>
                    </td>
                    <td><span className="soft-chip">{caseTypeLabel(item.case_type)}</span></td>
                    <td>
                      <strong>{item.subject_category || 'موضوع ثبت نشده'}</strong>
                      <small className="table-subtext">{item.authority_category || 'مرجع ثبت نشده'}</small>
                    </td>
                    <td>{item.financial_status === 'financial' ? formatAmount(item.amount) : 'غیرمالی'}</td>
                    <td>{CLASSIFICATION_LABELS[item.classification] || '—'}</td>
                    <td>
                      {item.defense_drafts_count > 0 ? (
                        <span className="status-badge status-approved"><FileSignature size={13} /> {item.defense_drafts_count.toLocaleString('fa-IR')} نسخه</span>
                      ) : (
                        <span className="status-badge status-draft">بدون پیش‌نویس</span>
                      )}
                    </td>
                    <td>{formatDate(item.updated_at, false)}</td>
                    <td><Link className="icon-btn" to={`/cases/${item.id}`} title="مشاهده"><Eye size={17} /></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function LawsuitMetric({ label, value }) {
  return <div className="metric-card compact-metric"><span className="metric-icon"><Gavel size={20} /></span><div><strong>{Number(value || 0).toLocaleString('fa-IR')}</strong><span>{label}</span></div></div>
}
