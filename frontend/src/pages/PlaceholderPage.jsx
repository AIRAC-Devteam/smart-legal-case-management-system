export default function PlaceholderPage({ title }) {
  return (
    <div className="page-wrap">
      <header className="page-header">
        <div>
          <span className="eyebrow">در حال توسعه</span>
          <h1>{title}</h1>
          <p>زیرساخت این بخش در ناوبری سامانه آماده شده است.</p>
        </div>
      </header>
      <div className="placeholder-card">
        این بخش در فاز بعدی توسعه تکمیل می‌شود.
      </div>
    </div>
  )
}
