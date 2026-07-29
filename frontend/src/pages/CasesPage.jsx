import { useEffect, useMemo, useState } from 'react'
import { Eye, Plus, Search, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { deleteCase, listCases } from '../api/client'

export default function CasesPage() {
  const [cases, setCases] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        setCases(await listCases())
      } catch (err) {
        setError(err.message || 'دریافت پرونده‌ها انجام نشد.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return cases

    return cases.filter((item) =>
      [
        item.case_name,
        item.case_number,
        item.internal_ref,
        item.province,
        item.city,
        item.subject_category,
      ].some((value) => String(value || '').toLowerCase().includes(q)),
    )
  }, [cases, query])

  const remove = async (id) => {
    if (!window.confirm('این پرونده حذف شود؟ این عملیات قابل بازگشت نیست.')) return

    setError('')
    try {
      await deleteCase(id)
      setCases((previous) => previous.filter((item) => item.id !== id))
    } catch (err) {
      setError(err.message || 'حذف پرونده انجام نشد.')
    }
  }

  return (
    <div className="page-wrap wide">
      <header className="page-header">
        <div>
          <span className="eyebrow">مدیریت پرونده‌ها</span>
          <h1>پرونده‌های ایجادشده</h1>
          <p>مشاهده، جستجو و مدیریت پرونده‌های ثبت‌شده در سامانه</p>
        </div>
        <Link className="btn primary" to="/cases/new">
          <Plus size={18} /> پرونده جدید
        </Link>
      </header>

      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="جستجو بر اساس نام، شماره پرونده، کلاسه، موضوع یا شهر…"
          />
        </div>
        <span className="result-count">{filtered.length.toLocaleString('fa-IR')} پرونده</span>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="table-card">
        {loading ? (
          <div className="empty-state">در حال دریافت پرونده‌ها…</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Search size={30} />
            <strong>پرونده‌ای یافت نشد</strong>
            <span>عبارت جستجو را تغییر دهید یا پرونده جدید ثبت کنید.</span>
          </div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>شماره پرونده</th>
                  <th>نام پرونده</th>
                  <th>موضوع</th>
                  <th>کلاسه داخلی</th>
                  <th>موقعیت</th>
                  <th>تاریخ ثبت</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td className="mono-cell">{item.case_number || '—'}</td>
                    <td><strong>{item.case_name || 'بدون عنوان'}</strong></td>
                    <td>{item.subject_category || '—'}</td>
                    <td>{item.internal_ref || '—'}</td>
                    <td>{[item.province, item.city].filter(Boolean).join(' / ') || '—'}</td>
                    <td>{formatDate(item.created_at)}</td>
                    <td>
                      <div className="row-actions">
                        <Link className="icon-btn" title="مشاهده" to={`/cases/${item.id}`}>
                          <Eye size={17} />
                        </Link>
                        <button className="icon-btn danger" title="حذف" onClick={() => remove(item.id)}>
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
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

function formatDate(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}
