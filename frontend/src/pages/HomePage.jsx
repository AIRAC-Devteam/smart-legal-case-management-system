import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileSearch2,
  FileSignature,
  Files,
  FolderOpen,
  FolderPlus,
  MoreVertical,
  Plus,
  Scale,
  ScanLine,
  Search,
  Sparkles,
  UploadCloud,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { getCases, getDefenseDrafts } from '../api/client'
import {
  CASE_TYPE_LABELS,
  DRAFT_STATUS_LABELS,
  formatDate,
} from '../utils/legal'
import '../styles/home-dashboard.css'

const CHART_COLORS = ['#0f9f91', '#7d71e8', '#f0aa43', '#9aa6b2']

const KPI_DEFINITIONS = [
  { key: 'totalCases', label: 'کل پرونده‌ها', icon: BriefcaseBusiness, tone: 'teal' },
  { key: 'activeCases', label: 'پرونده‌های فعال', icon: FolderOpen, tone: 'mint' },
  { key: 'drafts', label: 'پیش‌نویس لوایح', icon: FileSignature, tone: 'teal' },
  { key: 'pendingReview', label: 'در انتظار بررسی', icon: Clock3, tone: 'amber' },
  { key: 'registeredNotices', label: 'ابلاغیه‌های ثبت‌شده', icon: Bell, tone: 'violet' },
  { key: 'approved', label: 'لوایح تأییدشده', icon: CheckCircle2, tone: 'green' },
]

const WORKFLOW_STEPS = [
  { number: 1, label: 'بارگذاری سند', icon: UploadCloud, to: '/cases/new' },
  { number: 2, label: 'استخراج و بازبینی', icon: FileSearch2, to: '/cases/new' },
  { number: 3, label: 'ثبت پرونده', icon: FolderPlus, to: '/cases' },
  { number: 4, label: 'تولید و ذخیره لایحه', icon: FileCheck2, to: '/defense-drafts' },
]

export default function HomePage() {
  const [cases, setCases] = useState([])
  const [drafts, setDrafts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    let mounted = true

    const loadDashboard = async () => {
      setLoading(true)
      setError('')

      const [caseResult, draftResult] = await Promise.allSettled([
        getCases(),
        getDefenseDrafts(),
      ])

      if (!mounted) return

      if (caseResult.status === 'fulfilled') {
        setCases(normalizeCollection(caseResult.value))
      }

      if (draftResult.status === 'fulfilled') {
        setDrafts(normalizeCollection(draftResult.value))
      }

      if (caseResult.status === 'rejected' && draftResult.status === 'rejected') {
        setError('دریافت اطلاعات داشبورد انجام نشد. اتصال Backend را بررسی کنید.')
      }

      setLoading(false)
    }

    loadDashboard()

    return () => {
      mounted = false
    }
  }, [])

  const dashboard = useMemo(() => {
    const pendingReview = drafts.filter((draft) =>
      ['draft', 'under_review'].includes(draft.status),
    ).length

    const approved = drafts.filter((draft) => draft.status === 'approved').length
    const registeredNotices = cases.filter(
      (item) => item.notification_document || item.notification_document_detail,
    ).length
    const activeCases = cases.filter((item) => {
      const latestStatus = item.latest_defense_draft?.status
      return latestStatus !== 'approved' && latestStatus !== 'archived'
    }).length

    return {
      totalCases: cases.length,
      activeCases,
      drafts: drafts.length,
      pendingReview,
      registeredNotices,
      approved,
    }
  }, [cases, drafts])

  const typeDistribution = useMemo(() => {
    const counts = cases.reduce((accumulator, item) => {
      const key = item.case_type || 'other'
      accumulator[key] = (accumulator[key] || 0) + 1
      return accumulator
    }, {})

    const preferredOrder = ['legal', 'criminal', 'quasi_judicial', 'administrative']
    const values = preferredOrder.map((key, index) => ({
      key,
      label: CASE_TYPE_LABELS[key] || 'سایر',
      value: counts[key] || 0,
      color: CHART_COLORS[index],
    }))

    const knownCount = values.reduce((sum, item) => sum + item.value, 0)
    const otherCount = Math.max(cases.length - knownCount, 0)

    if (otherCount > 0) {
      values.push({
        key: 'other',
        label: 'سایر',
        value: otherCount,
        color: '#c8d0d7',
      })
    }

    return values
  }, [cases])

  const subjectDistribution = useMemo(() => {
    const counts = cases.reduce((accumulator, item) => {
      const label = cleanText(item.subject_category) || 'سایر'
      accumulator[label] = (accumulator[label] || 0) + 1
      return accumulator
    }, {})

    return Object.entries(counts)
      .sort(([, first], [, second]) => second - first)
      .slice(0, 7)
      .map(([label, value]) => ({ label, value }))
  }, [cases])

  const monthlyTrend = useMemo(() => buildMonthlyTrend(cases), [cases])

  const recentActivities = useMemo(() => {
    const caseActivities = cases.map((item) => ({
      id: `case-${item.id}`,
      date: item.created_at,
      type: 'case',
      title: 'پرونده جدید ثبت شد',
      description: item.case_name || item.case_number || 'پرونده بدون عنوان',
      to: `/cases/${item.id}`,
    }))

    const draftActivities = drafts.map((item) => ({
      id: `draft-${item.id}`,
      date: item.created_at,
      type: 'draft',
      title: 'پیش‌نویس لایحه ذخیره شد',
      description:
        item.title || item.case_detail?.case_name || 'پیش‌نویس لایحه دفاعیه',
      to: `/cases/${item.case}`,
    }))

    return [...caseActivities, ...draftActivities]
      .filter((item) => item.date)
      .sort((first, second) => new Date(second.date) - new Date(first.date))
      .slice(0, 5)
  }, [cases, drafts])

  const filteredCases = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return cases.slice(0, 5)

    return cases
      .filter((item) =>
        [
          item.case_name,
          item.case_number,
          item.subject_category,
          item.authority_category,
          item.plaintiff_defendant,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query)),
      )
      .slice(0, 5)
  }, [cases, search])

  return (
    <div className="page-wrap wide legal-dashboard-page">
      <header className="legal-dashboard-header">
        <div className="legal-dashboard-title">
          <span className="eyebrow">نمای کلی سامانه</span>
          <h1>داشبورد مدیریتی</h1>
          <p>خلاصه‌ای از وضعیت پرونده‌ها، لوایح و فعالیت‌های واحد حقوقی</p>
        </div>

        <div className="legal-dashboard-actions">
          <Link className="btn primary" to="/cases/new">
            <Plus size={18} /> تشکیل پرونده جدید
          </Link>
          <Link className="btn secondary" to="/cases/new">
            <ScanLine size={18} /> اسکن ابلاغیه
          </Link>
        </div>
      </header>

      <section className="legal-dashboard-toolbar" aria-label="ابزارهای داشبورد">
        <label className="legal-dashboard-search">
          <Search size={18} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="جستجو در پرونده‌ها، موضوع یا شماره پرونده..."
          />
        </label>

        <div className="legal-dashboard-date">
          <CalendarDays size={17} />
          <span>{getDateRangeLabel()}</span>
        </div>
      </section>

      {error && <div className="error-banner">{error}</div>}

      {/* <WorkflowStrip /> */}

      <section className="legal-dashboard-kpis" aria-label="شاخص‌های کلیدی">
        {KPI_DEFINITIONS.map((definition) => (
          <KpiCard
            key={definition.key}
            {...definition}
            value={dashboard[definition.key]}
            loading={loading}
          />
        ))}
      </section>

      <section className="legal-dashboard-charts">
        <DashboardCard title="توزیع وضعیت پرونده‌ها" className="legal-donut-card widecard">
          <DonutChart data={typeDistribution} total={cases.length} loading={loading} />
        </DashboardCard>

        {/* className='widecard' */}
        <DashboardCard  title="پرونده‌ها بر اساس موضوع">
          <SubjectBars data={subjectDistribution} loading={loading} />
        </DashboardCard>
      </section>

      <section className="legal-dashboard-bottom-grid">
        
        <DashboardCard title="روند پرونده‌های جدید در ۶ ماه اخیر">
          <TrendChart data={monthlyTrend} loading={loading} />
        </DashboardCard>

        
        {/* <DashboardCard
          title="دستیار هوشمند حقوقی"
          icon={Sparkles}
          className="legal-ai-card"
        >
          <Link className="legal-ai-action" to="/defense-drafts">
            <span className="legal-ai-action-icon"><FileSignature size={22} /></span>
            <span>
              <strong>پیش‌نویس لوایح با هوش مصنوعی</strong>
              <small>مشاهده و مدیریت تمام نسخه‌های تولیدشده</small>
            </span>
            <ArrowLeft size={18} />
          </Link>

          <Link className="legal-ai-action" to="/cases">
            <span className="legal-ai-action-icon"><Scale size={22} /></span>
            <span>
              <strong>تحلیل هوشمند پرونده</strong>
              <small>بررسی اطلاعات و آماده‌سازی مسیر دفاع</small>
            </span>
            <ArrowLeft size={18} />
          </Link>
        </DashboardCard> */}

        {/* <DashboardCard title="تقویم جلسات و مهلت‌ها" icon={CalendarDays}>
          <MiniCalendar />
        </DashboardCard> */}

        <DashboardCard title="فعالیت‌های اخیر" icon={Activity}>
          <ActivityList items={recentActivities} loading={loading} />
        </DashboardCard>

        <DashboardCard
          title="آخرین پرونده‌ها"
          className="legal-recent-cases-card"
          action={<Link to="/cases">مشاهده همه</Link>}
        >
          <RecentCasesTable cases={filteredCases} loading={loading} />
        </DashboardCard>
      </section>
    </div>
  )
}

function WorkflowStrip() {
  return (
    <section className="legal-workflow" aria-label="گردش کار سامانه">
      {WORKFLOW_STEPS.map(({ number, label, icon: Icon, to }, index) => (
        <div className="legal-workflow-fragment" key={number}>
          <Link className="legal-workflow-step" to={to}>
            <span className="legal-workflow-number">{number.toLocaleString('fa-IR')}</span>
            <span className="legal-workflow-icon"><Icon size={24} /></span>
            <strong>{label}</strong>
          </Link>
          {index < WORKFLOW_STEPS.length - 1 && (
            <span className="legal-workflow-connector" aria-hidden="true">
              <i />
              <b />
            </span>
          )}
        </div>
      ))}
    </section>
  )
}

function KpiCard({ icon: Icon, label, value, loading, tone }) {
  return (
    <article className={`legal-kpi-card tone-${tone}`}>
      <span className="legal-kpi-icon"><Icon size={23} /></span>
      <div className="legal-kpi-copy">
        <span>{label}</span>
        <strong>{loading ? '…' : formatNumber(value)}</strong>
        <small><b>+۸٪</b> نسبت به ماه قبل</small>
      </div>
    </article>
  )
}

function DashboardCard({ title, icon: Icon, action, className = '', children }) {
  return (
    <article className={`legal-dashboard-card ${className}`}>
      <header className="legal-dashboard-card-header">
        <div>
          {Icon && <Icon size={19} />}
          <h2>{title}</h2>
        </div>
        {action || <MoreVertical size={18} />}
      </header>
      {children}
    </article>
  )
}

function DonutChart({ data, total, loading }) {
  const gradient = buildDonutGradient(data, total)

  return (
    <div className="legal-donut-layout">
      <div
        className={`legal-donut ${loading ? 'is-loading' : ''}`}
        style={{ '--legal-donut-gradient': gradient }}
      >
        <div className="legal-donut-center">
          <span>مجموع</span>
          <strong>{loading ? '…' : formatNumber(total)}</strong>
        </div>
      </div>

      <div className="legal-chart-legend">
        {data.map((item) => (
          <div key={item.key}>
            <i style={{ backgroundColor: item.color }} />
            <span>{item.label}</span>
            <strong>{formatNumber(item.value)}</strong>
            <small>{total ? `${Math.round((item.value / total) * 100).toLocaleString('fa-IR')}٪` : '۰٪'}</small>
          </div>
        ))}
      </div>
    </div>
  )
}

function TrendChart({ data, loading }) {
  const values = data.map((item) => item.value)
  const maxValue = Math.max(...values, 1)
  const points = data
    .map((item, index) => {
      const x = data.length === 1 ? 300 : 28 + (index * 544) / (data.length - 1)
      const y = 182 - (item.value / maxValue) * 138
      return `${x},${y}`
    })
    .join(' ')

  const areaPoints = `28,182 ${points} 572,182`

  return (
    <div className={`legal-trend-chart ${loading ? 'is-loading' : ''}`}>
      <svg viewBox="0 0 600 210" role="img" aria-label="روند پرونده‌های جدید">
        <defs>
          <linearGradient id="legalTrendArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#20b4a5" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#20b4a5" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {[44, 90, 136, 182].map((y) => (
          <line key={y} x1="28" x2="572" y1={y} y2={y} className="legal-chart-grid-line" />
        ))}

        <polygon points={areaPoints} fill="url(#legalTrendArea)" />
        <polyline points={points} className="legal-trend-line" />

        {data.map((item, index) => {
          const x = data.length === 1 ? 300 : 28 + (index * 544) / (data.length - 1)
          const y = 182 - (item.value / maxValue) * 138
          return <circle key={item.key} cx={x} cy={y} r="5" className="legal-trend-point" />
        })}
      </svg>

      <div className="legal-trend-labels">
        {data.map((item) => <span key={item.key}>{item.label}</span>)}
      </div>
    </div>
  )
}

function SubjectBars({ data, loading }) {
  const displayData = data.length
    ? data
    : [
        { label: 'حقوقی', value: 0 },
        { label: 'کیفری', value: 0 },
        { label: 'ثبتی', value: 0 },
        { label: 'خانواده', value: 0 },
        { label: 'اداری', value: 0 },
      ]

  const maxValue = Math.max(...displayData.map((item) => item.value), 1)

  return (
    <div className={`legal-subject-chart ${loading ? 'is-loading' : ''}`}>
      <div className="legal-subject-bars">
        {displayData.map((item) => (
          <div className="legal-subject-column" key={item.label}>
            <div className="legal-subject-bar-track">
              <span style={{ height: `${Math.max((item.value / maxValue) * 100, item.value ? 8 : 2)}%` }}>
                {item.value > 0 && <b>{formatNumber(item.value)}</b>}
              </span>
            </div>
            <small title={item.label}>{truncateText(item.label, 10)}</small>
          </div>
        ))}
      </div>
    </div>
  )
}

function MiniCalendar() {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstWeekday = new Date(year, month, 1).getDay()
  const saturdayOffset = (firstWeekday + 1) % 7
  const monthLabel = new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
  }).format(today)

  const cells = [
    ...Array.from({ length: saturdayOffset }, (_, index) => ({ empty: true, key: `empty-${index}` })),
    ...Array.from({ length: daysInMonth }, (_, index) => ({ day: index + 1, key: `day-${index + 1}` })),
  ]

  return (
    <div className="legal-mini-calendar">
      <div className="legal-mini-calendar-month">{monthLabel}</div>
      <div className="legal-mini-calendar-weekdays">
        {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="legal-mini-calendar-days">
        {cells.map((cell) => (
          <span
            key={cell.key}
            className={cell.day === today.getDate() ? 'is-today' : cell.empty ? 'is-empty' : ''}
          >
            {cell.day ? cell.day.toLocaleString('fa-IR') : ''}
          </span>
        ))}
      </div>
    </div>
  )
}

function ActivityList({ items, loading }) {
  if (loading) return <DashboardEmpty text="در حال دریافت فعالیت‌ها..." />
  if (!items.length) return <DashboardEmpty text="هنوز فعالیتی ثبت نشده است." />

  return (
    <div className="legal-activity-list">
      {items.map((item) => (
        <Link className={`legal-activity-row type-${item.type}`} to={item.to} key={item.id}>
          <i />
          <span>
            <strong>{item.title}</strong>
            <small>{item.description}</small>
          </span>
          <time>{relativeDate(item.date)}</time>
        </Link>
      ))}
    </div>
  )
}

function RecentCasesTable({ cases: recentCases, loading }) {
  if (loading) return <DashboardEmpty text="در حال دریافت پرونده‌ها..." />
  if (!recentCases.length) return <DashboardEmpty text="پرونده‌ای مطابق جستجو پیدا نشد." />

  return (
    <div className="legal-recent-table-wrap">
      <table className="legal-recent-table">
        <thead>
          <tr>
            <th>شماره پرونده</th>
            <th>موضوع</th>
            <th>وضعیت</th>
            <th>آخرین تغییر</th>
          </tr>
        </thead>
        <tbody>
          {recentCases.map((item) => {
            const status = getCaseDisplayStatus(item)
            return (
              <tr key={item.id}>
                <td>
                  <Link to={`/cases/${item.id}`}>{item.case_number || `#${item.id}`}</Link>
                </td>
                <td>{item.subject_category || item.case_name || 'بدون موضوع'}</td>
                <td><span className={`legal-status status-${status.key}`}>{status.label}</span></td>
                <td>{formatDate(item.updated_at || item.created_at, false)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function DashboardEmpty({ text }) {
  return <div className="legal-dashboard-empty">{text}</div>
}

function normalizeCollection(value) {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.results)) return value.results
  return []
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('fa-IR')
}

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function truncateText(value, limit) {
  if (!value || value.length <= limit) return value
  return `${value.slice(0, limit)}…`
}

function buildDonutGradient(data, total) {
  if (!total) return '#edf1f2 0 100%'

  let cursor = 0
  const segments = data.map((item) => {
    const start = cursor
    const end = cursor + (item.value / total) * 100
    cursor = end
    return `${item.color} ${start}% ${end}%`
  })

  return segments.join(', ')
}

function buildMonthlyTrend(cases) {
  const now = new Date()

  return Array.from({ length: 6 }, (_, index) => {
    const monthOffset = index - 5
    const date = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
    const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1)
    const value = cases.filter((item) => {
      const createdAt = new Date(item.created_at)
      return createdAt >= date && createdAt < nextMonth
    }).length

    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: new Intl.DateTimeFormat('fa-IR', { month: 'short' }).format(date),
      value,
    }
  })
}

function relativeDate(value) {
  if (!value) return '—'

  const date = new Date(value)
  const now = new Date()
  const diffHours = Math.floor((now - date) / (1000 * 60 * 60))

  if (diffHours < 1) return 'لحظاتی پیش'
  if (diffHours < 24) return `${diffHours.toLocaleString('fa-IR')} ساعت پیش`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'دیروز'
  if (diffDays < 7) return `${diffDays.toLocaleString('fa-IR')} روز پیش`

  return formatDate(value, false)
}

function getCaseDisplayStatus(item) {
  const latestStatus = item.latest_defense_draft?.status

  if (latestStatus === 'approved') return { key: 'approved', label: 'تأییدشده' }
  if (latestStatus === 'under_review') return { key: 'review', label: 'در بررسی' }
  if (latestStatus === 'draft') return { key: 'draft', label: 'پیش‌نویس لایحه' }
  if (item.defense_drafts_count > 0) return { key: 'draft', label: 'دارای لایحه' }

  return { key: 'active', label: 'در جریان' }
}

function getDateRangeLabel() {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 30)

  const formatter = new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  return `${formatter.format(start)} تا ${formatter.format(end)}`
}
