import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpenText, FileText, Trash2 } from 'lucide-react'
import { getLegalSources, uploadLegalSource, retryLegalSource, deleteLegalSource, getLegalSourceText } from '../api/client'
import { formatDate } from '../utils/legal'
import '../styles/legal-repository.css'
import DocumentUploader from '../components/DocumentUploader'
import Modal from '../components/Modal'
const labels = { ready: 'آماده انتخاب', processing: 'در حال پردازش', failed: 'پردازش ناموفق' }

export default function LegalRepositoryPage() {
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [query, setQuery] = useState('')
  const [title, setTitle] = useState('')
  const [uploadedSource, setUploadedSource] = useState(null)
  const [preview, setPreview] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try { setSources(await getLegalSources()) } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const run = async (action) => {
    setBusy(true); setError(''); setMessage('')
    try { await action() } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }
  const handleSourceResult = (source) => {
    setUploadedSource(source)
    setSources(prev => {
      const exists = prev.some(item => item.id === source.id)
      return exists ? prev.map(item => item.id === source.id ? source : item) : [source, ...prev]
    })
    if (source.status === 'ready') {
      setTitle('')
      setMessage('سند آماده است. اکنون در صفحه پرونده می‌توانید آن را برای تهیه لایحه انتخاب کنید.')
    } else if (source.status === 'failed') {
      setMessage('فایل ذخیره شد، اما پردازش ناموفق بود. از دکمه تلاش مجدد استفاده کنید.')
    }
  }
  const filtered = sources.filter(s => `${s.title} ${s.original_name} ${s.summary}`.toLowerCase().includes(query.toLowerCase().trim()))

  return <div className="page-wrap wide legal-repository" dir="rtl">
    <header className="page-header"><div><span className="eyebrow">منابع حقوقی شما</span><h1><BookOpenText size={28} /> مخزن هوشمند قوانین</h1><p>اسناد قوانین را یک‌بار بارگذاری کنید و در تهیه لوایح پرونده‌های مختلف به کار ببرید.</p></div><Link className="btn primary" to="/cases">انتخاب پرونده و تهیه لایحه</Link></header>
    <section className="repository-guide" aria-label="روش استفاده از مخزن">
      <div><b>۱. بارگذاری قانون</b><p>فایل Word حاوی متن قوانین، آیین‌نامه یا بخشنامه را اضافه کنید.</p></div>
      <div><b>۲. شناخت و انتخاب سند</b><p> خلاصه‌ای از سند می‌سازد. در صفحه پرونده، منابع موردنیاز لایحه را خودتان انتخاب کنید.</p></div>
      <div><b>۳. تهیه پیش‌نویس</b><p> متن کامل منابع انتخابی و اطلاعات ذخیره‌شده پرونده را برای تنظیم لایحه دریافت می‌کند.</p></div>
    </section>
    {error && <div className="error-banner" role="alert">{error}</div>}
    {message && <div className="success-banner" role="status">{message}</div>}
    <div className="repository-columns">
      <section className="form-card repository-upload">
        <DocumentUploader
          document={uploadedSource}
          onDocumentChange={setUploadedSource}
          onResult={handleSourceResult}
          uploadFile={(file) => uploadLegalSource(file, title)}
          retryFile={retryLegalSource}
          allowedTypes={new Set(['application/vnd.openxmlformats-officedocument.wordprocessingml.document'])}
          allowedExtensions={['.docx']}
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          title={title}
          onTitleChange={setTitle}
          isComplete={(source) => source.status === 'ready'}
          showRetry={(source) => source.status === 'failed'}
          heading="افزودن سند قانونی"
          description="فایل Word را انتخاب کنید یا با Drag & Drop در این بخش رها کنید"
          fileHint="DOCX — حداکثر ۱۲ مگابایت و ۲۰۰٬۰۰۰ نویسه"
          chooseLabel="انتخاب فایل Word"
          retryLabel="تلاش مجدد"
          formatError="فایل Word با پسوند DOCX انتخاب کنید."
        />
        <small>خلاصه برای شناخت سند است؛ مبنای تولید لایحه متن کامل اسناد انتخابی است. متن استخراج‌شده را پیش از استفاده بررسی کنید؛ تصاویر و نمودارها خوانده نمی‌شوند.</small>
      </section>
      <section className="form-card repository-list">
        <div className="section-heading"><div><h2>اسناد مخزن</h2><p>{sources.length.toLocaleString('fa-IR')} سند · {sources.filter(s => s.status === 'ready').length.toLocaleString('fa-IR')} آماده انتخاب</p></div></div>
        <label className="field-block"><span className="field-label">جستجو در عنوان، نام فایل و خلاصه</span><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="نام قانون را بنویسید…" /></label>
        {loading ? <p role="status">در حال دریافت اسناد…</p> : !filtered.length ? <div className="empty-state"><FileText size={32} /><p>{sources.length ? 'سندی با این عبارت پیدا نشد.' : 'هنوز سندی بارگذاری نشده است. اولین قانون را از فرم کنار صفحه اضافه کنید.'}</p></div> : filtered.map(source => <article className="repository-source" key={source.id}>
          <div className="repository-source-heading"><h3>{source.title}</h3><span className={`source-status ${source.status}`}>{labels[source.status] || source.status}</span></div>
          <small>{source.original_name} · {formatDate(source.created_at)} · {source.character_count.toLocaleString('fa-IR')} نویسه</small>
          <p>{source.summary || source.error_message || 'پردازش سند در حال انجام است.'}</p>
          <div className="header-actions"><button className="btn ghost" disabled={busy} onClick={() => run(async () => { const data = await getLegalSourceText(source.id); setPreview({ title: source.title, text: data.text }) })}>مشاهده متن استخراج‌شده</button>
          {source.status === 'failed' && <button className="btn secondary" disabled={busy} onClick={() => run(async () => { const next = await retryLegalSource(source.id); setSources(prev => prev.map(s => s.id === next.id ? next : s)) })}>تلاش مجدد</button>}
          <button className="btn ghost danger-soft" disabled={busy} onClick={() => { if (window.confirm(`«${source.title}» از مخزن حذف شود؟ منابع ذخیره‌شده در لوایح قبلی حفظ می‌شوند.`)) run(async () => { await deleteLegalSource(source.id); setSources(prev => prev.filter(s => s.id !== source.id)) }) }}><Trash2 size={16} />حذف</button></div>
        </article>)}
      </section>
    </div>
    <Modal open={Boolean(preview)} onClose={() => setPreview(null)} title={preview?.title}>
      <pre className="source-preview">{preview?.text}</pre>
    </Modal>
  </div>
}
