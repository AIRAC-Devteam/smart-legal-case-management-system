import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  FileSignature,
  PencilLine,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { getCases, getDefenseDrafts } from '../api/client'
import { DRAFT_STATUS_LABELS, formatDate } from '../utils/legal'
import DashboardMetricCard, {
  DashboardMetricGrid,
} from '../components/DashboardMetricCard'
export default function InboxPage() {
  const [cases, setCases] = useState([])
  const [drafts, setDrafts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [caseData, draftData] = await Promise.all([getCases(), getDefenseDrafts()])
        setCases(caseData)
        setDrafts(draftData)
      } catch (err) {
        setError(err.message || 'دریافت کارتابل انجام نشد.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const tasks = useMemo(() => buildTasks(cases, drafts), [cases, drafts])
const openTasks = tasks.filter((item) => item.type !== 'completed')

const visibleTasks =
  filter === 'all'
    ? openTasks
    : tasks.filter((item) => item.type === filter)
  const stats = {
    all: openTasks.length,
    defense: tasks.filter((item) => item.type === 'defense').length,
    review: tasks.filter((item) => item.type === 'review').length,
    incomplete: tasks.filter((item) => item.type === 'incomplete').length,
    completed: tasks.filter((item) => item.type === 'completed').length,
  }

  return (
    <div className="page-wrap wide">
      <header className="page-header">
        <div>
          <span className="eyebrow">مرکز اقدامات</span>
          <h1>کارتابل من</h1>
          <p>اقدامات مهم استخراج‌شده از وضعیت واقعی پرونده‌ها و پیش‌نویس‌های ثبت‌شده</p>
        </div>
      </header>

      <section className="metric-grid inbox-metrics">
        <DashboardMetricGrid>
  <DashboardMetricCard
    label="کل اقدامات باز"
    value={stats.all}
    total={stats.all}
    icon={ClipboardList}
    footer="اقدامات نیازمند رسیدگی"
    footerValue={stats.all}
    tone="teal"
  />

  <DashboardMetricCard
    label="نیازمند تولید لایحه"
    value={stats.defense}
    total={stats.all}
    icon={FileSignature}
    footer="پرونده‌های فاقد پیش‌نویس"
    footerValue={stats.defense}
    tone="orange"
  />

  <DashboardMetricCard
    label="در انتظار بررسی"
    value={stats.review}
    total={stats.all}
    icon={PencilLine}
    footer="پیش‌نویس‌های آماده بررسی"
    footerValue={stats.review}
    tone="blue"
  />

  <DashboardMetricCard
    label="اطلاعات ناقص"
    value={stats.incomplete}
    total={stats.all}
    icon={AlertTriangle}
    footer="پرونده‌های نیازمند تکمیل"
    footerValue={stats.incomplete}
    tone="red"
  />

  <DashboardMetricCard
    label="پرونده‌های کامل"
    value={stats.completed}
    total={cases.length}
    icon={CheckCircle2}
    footer="اطلاعات اصلی تکمیل‌شده"
    footerValue={stats.completed}
    tone="green"
  />
</DashboardMetricGrid>
      </section>

      <div className="filter-chips inbox-filters">
        {[
          ['all', 'همه'],
          ['defense', 'تولید لایحه'],
          ['review', 'بررسی لایحه'],
          ['incomplete', 'تکمیل پرونده'],
          ['completed', 'پرونده‌های کامل'],
        ].map(([value, label]) => (
          <button key={value} className={`filter-chip ${filter === value ? 'active' : ''}`} onClick={() => setFilter(value)}>{label}</button>
        ))}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <section className="task-list-card">
        {loading ? (
          <div className="empty-state">در حال آماده‌سازی کارتابل…</div>
        ) : visibleTasks.length === 0 ? (
          <div className="empty-state large-empty">
            <CheckCircle2 size={38} />
            <strong>اقدام بازی وجود ندارد</strong>
            <span>تمام موارد این دسته رسیدگی شده‌اند.</span>
          </div>
        ) : visibleTasks.map((task) => {
          const TaskIcon = task.icon
          return (
            <article className="task-row" key={task.id}>
              <span className={`task-icon priority-${task.priority}`}><TaskIcon size={20} /></span>
              <div className="task-copy">
                <div className="task-title-line">
                  <strong>{task.title}</strong>
                  <span className={`priority-chip priority-${task.priority}`}>{priorityLabel(task.priority)}</span>
                </div>
                <p>{task.description}</p>
                <small>{task.meta}</small>
              </div>
              <Link className="case-entry-button" to={task.to}>{task.action}</Link>
            </article>
          )
        })}
      </section>
    </div>
  )
}

function buildTasks(cases, drafts) {
  const tasks = []

  cases.forEach((item) => {
    if (!item.defense_drafts_count) {
      tasks.push({
        id: `defense-${item.id}`,
        type: 'defense',
        icon: FileSignature,
        priority: item.classification === 'confidential' || item.has_imprisonment ? 'high' : 'medium',
        title: `تهیه لایحه برای ${item.case_name || 'پرونده بدون عنوان'}`,
        description: 'برای این پرونده هنوز هیچ نسخه‌ای از پیش‌نویس لایحه تولید نشده است.',
        meta: `شماره پرونده: ${item.case_number || 'ثبت نشده'} · ثبت ${formatDate(item.created_at, false)}`,
        to: `/cases/${item.id}`,
        action: 'ورود به پرونده',
      })
    }
const notification = item.notification_data || {}
    const missing = [
  !item.case_name && 'نام پرونده',
  !item.case_number && 'شماره پرونده',
  !(notification.issue_date || item.creation_date) && 'تاریخ صدور',
  !item.plaintiff_defendant && 'طرفین پرونده',
  !item.subject_category && 'موضوع',
  !item.authority_category && 'مرجع رسیدگی',
  !item.case_type && 'نوع پرونده',
  !item.classification && 'طبقه‌بندی',
  !item.financial_status && 'وضعیت مالی',

  item.financial_status === 'financial' &&
    !item.amount &&
    'مبلغ پرونده',

  !item.submitted_by && 'ثبت‌کننده پرونده',

  item.has_imprisonment == null &&
    'وضعیت حبس',

  !item.case_status && 'وضعیت پرونده',
  !item.province && 'استان',
  !item.city && 'شهر',
].filter(Boolean)
    if (missing.length) {
      tasks.push({
        id: `incomplete-${item.id}`,
        type: 'incomplete',
        icon: AlertTriangle,
        priority: missing.length >= 3 ? 'high' : 'low',
        title: `تکمیل اطلاعات ${item.case_name || 'پرونده'}`,
        description: `فیلدهای ناقص: ${missing.join('، ')}`,
        meta: `آخرین ویرایش ${formatDate(item.updated_at, false)}`,
        to: `/cases/${item.id}`,
        action: 'تکمیل اطلاعات',
      })
    }else {
  tasks.push({
    id: `completed-${item.id}`,
    type: 'completed',
    icon: CheckCircle2,
    priority: 'low',
    title: `پرونده کامل: ${item.case_name || 'پرونده بدون عنوان'}`,
    description: 'اطلاعات اصلی این پرونده تکمیل شده است.',
    meta: `شماره پرونده: ${item.case_number || 'ثبت نشده'} · آخرین ویرایش ${formatDate(item.updated_at, false)}`,
    to: `/cases/${item.id}`,
    action: 'مشاهده پرونده',
  })
}
  })

  drafts.filter((draft) => ['draft', 'under_review'].includes(draft.status)).forEach((draft) => {
    tasks.push({
      id: `review-${draft.id}`,
      type: 'review',
      icon: PencilLine,
      priority: draft.case_detail?.classification === 'confidential' ? 'high' : 'medium',
      title: `بررسی نسخه ${draft.version.toLocaleString('fa-IR')} لایحه`,
      description: `${draft.title || 'پیش‌نویس لایحه'} برای ${draft.case_detail?.case_name || 'پرونده بدون عنوان'}`,
      meta: `${DRAFT_STATUS_LABELS[draft.status]} · آخرین تغییر ${formatDate(draft.updated_at, false)}`,
      to: '/defense-drafts',
      action: 'بررسی پیش‌نویس',
    })
  })

  const priorityOrder = { high: 0, medium: 1, low: 2 }
  return tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
}

function priorityLabel(value) {
  return { high: 'فوری', medium: 'مهم', low: 'عادی' }[value]
}

function ActionMetric({ label, value, icon: Icon }) {
  return (
    <div className="metric-card">
      <span className="metric-icon"><Icon size={22} /></span>
      <div><strong>{Number(value || 0).toLocaleString('fa-IR')}</strong><span>{label}</span></div>
    </div>
  )
}
