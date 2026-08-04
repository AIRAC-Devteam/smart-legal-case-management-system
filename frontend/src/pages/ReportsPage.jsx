import { useEffect, useMemo, useState } from 'react'
import { BarChart3, CheckCircle2, FileSignature, Files, ShieldAlert,FolderOpen,LockKeyhole, } from 'lucide-react'
import { getCases, getDefenseDrafts } from '../api/client'
import {
  CASE_TYPE_LABELS,
  DRAFT_STATUS_LABELS,
  FINANCIAL_LABELS,
  formatDate,
} from '../utils/legal'
import DashboardMetricCard, {
  DashboardMetricGrid,
} from '../components/DashboardMetricCard'

import { buildDailySeries } from '../utils/metricSeries'
export default function ReportsPage() {
  const [cases, setCases] = useState([])
  const [drafts, setDrafts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [caseData, draftData] = await Promise.all([getCases(), getDefenseDrafts()])
        setCases(caseData)
        setDrafts(draftData)
      } catch (err) {
        setError(err.message || 'دریافت گزارش‌ها انجام نشد.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const data = useMemo(() => {
    const caseTypes = countBy(cases, 'case_type', CASE_TYPE_LABELS)
    const financial = countBy(cases, 'financial_status', FINANCIAL_LABELS)
    const draftStatuses = countBy(drafts, 'status', DRAFT_STATUS_LABELS)
    const readiness = cases.length
      ? Math.round((cases.filter((item) => item.defense_drafts_count > 0).length / cases.length) * 100)
      : 0

    return {
      caseTypes,
      financial,
      draftStatuses,
      readiness,
      approved: drafts.filter((item) => item.status === 'approved').length,
      confidential: cases.filter((item) => item.classification === 'confidential').length,
    }
  }, [cases, drafts])
  const reportStats = useMemo(() => {
  const approvedDrafts = drafts.filter(
    (draft) => draft.status === 'approved',
  )

  const confidentialCases = cases.filter(
    (item) => item.classification === 'confidential',
  )

  return {
    totalCases: cases.length,
    totalDrafts: drafts.length,
    approvedDrafts: approvedDrafts.length,
    confidentialCases: confidentialCases.length,
  }
}, [cases, drafts])
const reportSeries = useMemo(() => {
  const approvedDrafts = drafts.filter(
    (draft) => draft.status === 'approved',
  )

  const confidentialCases = cases.filter(
    (item) => item.classification === 'confidential',
  )

  return {
    cases: buildDailySeries(cases),

    drafts: buildDailySeries(drafts),

    approved: buildDailySeries(approvedDrafts),

    confidential: buildDailySeries(confidentialCases),
  }
}, [cases, drafts])
  const activity = useMemo(() => [
    ...cases.slice(0, 5).map((item) => ({
      id: `case-${item.id}`,
      type: 'case',
      title: `پرونده «${item.case_name || 'بدون عنوان'}» ثبت یا ویرایش شد`,
      date: item.updated_at,
    })),
    ...drafts.slice(0, 5).map((item) => ({
      id: `draft-${item.id}`,
      type: 'draft',
      title: `نسخه ${item.version.toLocaleString('fa-IR')} لایحه «${item.title || 'دفاعیه'}» ذخیره شد`,
      date: item.updated_at,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 7), [cases, drafts])

  return (
    <div className="page-wrap wide">
      <header className="page-header">
        <div>
          <span className="eyebrow">داشبورد مدیریتی</span>
          <h1>گزارشات</h1>
          <p>تصویر لحظه‌ای از ترکیب دعاوی، آمادگی دفاع و وضعیت بررسی لوایح</p>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <section className="metric-grid report-metrics">
        <DashboardMetricGrid>
  <DashboardMetricCard
    label="کل پرونده‌ها"
    value={reportStats.totalCases}
    total={reportStats.totalCases}
    icon={FolderOpen}
    sparkline={reportSeries.cases}
    footer="پرونده‌های ثبت‌شده در سامانه"
    footerValue={reportStats.totalCases}
    tone="teal"
  />

  <DashboardMetricCard
    label="کل نسخه‌های لایحه"
    value={reportStats.totalDrafts}
    total={reportStats.totalDrafts}
    icon={FileSignature}
    sparkline={reportSeries.drafts}
    footer="تمام نسخه‌های تولیدشده"
    footerValue={reportStats.totalDrafts}
    tone="blue"
  />

  <DashboardMetricCard
    label="لوایح تأییدشده"
    value={reportStats.approvedDrafts}
    total={reportStats.totalDrafts}
    icon={CheckCircle2}
    sparkline={reportSeries.approved}
    footer="سهم از کل نسخه‌های لایحه"
    footerValue={`${reportStats.totalDrafts
      ? Math.round(
          (reportStats.approvedDrafts /
            reportStats.totalDrafts) *
            100,
        )
      : 0}٪`}
    tone="green"
  />

  <DashboardMetricCard
    label="پرونده محرمانه"
    value={reportStats.confidentialCases}
    total={reportStats.totalCases}
    icon={LockKeyhole}
    sparkline={reportSeries.confidential}
    footer="سهم از کل پرونده‌ها"
    footerValue={`${reportStats.totalCases
      ? Math.round(
          (reportStats.confidentialCases /
            reportStats.totalCases) *
            100,
        )
      : 0}٪`}
    tone="red"
  />
</DashboardMetricGrid>
      </section>

      {loading ? (
        <div className="state-card">در حال محاسبه گزارش‌ها…</div>
      ) : (
        <>
          <section className="report-grid">
            <ChartCard title="ترکیب نوع دعاوی" items={data.caseTypes} total={cases.length} />
            <ChartCard title="وضعیت مالی پرونده‌ها" items={data.financial} total={cases.length} />
            <ChartCard title="وضعیت پیش‌نویس‌های لایحه" items={data.draftStatuses} total={drafts.length} />
            <article className="report-card readiness-card">
              <div className="panel-heading"><div><span className="eyebrow">شاخص کلیدی</span><h2>آمادگی دفاع</h2></div><BarChart3 size={22} /></div>
              <div className="readiness-ring" style={{ '--progress': `${data.readiness * 3.6}deg` }}>
                <div><strong>{data.readiness.toLocaleString('fa-IR')}٪</strong><span>پرونده‌های دارای لایحه</span></div>
              </div>
              <p>نسبت پرونده‌هایی که حداقل یک پیش‌نویس دفاعیه برای آن‌ها ثبت شده است.</p>
            </article>
          </section>

          <section className="report-card activity-card">
            <div className="panel-heading"><div><span className="eyebrow">ردپای فعالیت</span><h2>آخرین رویدادها</h2></div></div>
            <div className="activity-timeline">
              {activity.map((item) => (
                <div className="activity-row" key={item.id}>
                  <span className={`activity-dot activity-${item.type}`} />
                  <div><strong>{item.title}</strong><small>{formatDate(item.date)}</small></div>
                </div>
              ))}
              {activity.length === 0 && <div className="compact-empty">هنوز فعالیتی ثبت نشده است.</div>}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function countBy(items, key, labels) {
  const counts = {}
  items.forEach((item) => {
    const value = item[key] || 'unknown'
    counts[value] = (counts[value] || 0) + 1
  })
  return Object.entries(counts).map(([value, count]) => ({
    value,
    label: labels[value] || 'نامشخص',
    count,
  })).sort((a, b) => b.count - a.count)
}

function ChartCard({ title, items, total }) {
  const max = Math.max(...items.map((item) => item.count), 1)
  return (
    <article className="report-card">
      <div className="panel-heading"><div><span className="eyebrow">توزیع آماری</span><h2>{title}</h2></div></div>
      <div className="bar-chart-list">
        {items.map((item) => (
          <div className="bar-chart-row" key={item.value}>
            <div><span>{item.label}</span><strong>{item.count.toLocaleString('fa-IR')}</strong></div>
            <div className="bar-track"><span style={{ width: `${(item.count / max) * 100}%` }} /></div>
            <small>{total ? Math.round((item.count / total) * 100).toLocaleString('fa-IR') : 0}٪</small>
          </div>
        ))}
        {items.length === 0 && <div className="compact-empty">داده‌ای برای نمایش وجود ندارد.</div>}
      </div>
    </article>
  )
}

function ReportMetric({ icon: Icon, label, value }) {
  return <div className="metric-card"><span className="metric-icon"><Icon size={22} /></span><div><strong>{Number(value || 0).toLocaleString('fa-IR')}</strong><span>{label}</span></div></div>
}
