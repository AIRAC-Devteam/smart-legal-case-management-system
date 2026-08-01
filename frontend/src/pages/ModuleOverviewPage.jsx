import { CheckCircle2, Layers3, Sparkles } from 'lucide-react'

export default function ModuleOverviewPage({ title, description, features = [] }) {
  return (
    <div className="page-wrap">
      <header className="page-header">
        <div>
          <span className="eyebrow">نمای دموی ماژول</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </header>

      <section className="module-hero-card">
        <div className="module-hero-icon"><Layers3 size={34} /></div>
        <div>
          <h2>ساختار آماده توسعه و اتصال به پرونده‌ها</h2>
          <p>
            این ماژول در نسخه نمایشی با معماری، مسیرهای دسترسی و سناریوهای کلیدی
            آماده شده و می‌تواند در فاز بعد به گردش‌کار عملیاتی سازمان متصل شود.
          </p>
        </div>
        <span className="module-demo-chip"><Sparkles size={15} /> Demo Ready</span>
      </section>

      <div className="feature-grid">
        {features.map((feature) => (
          <article className="feature-card" key={feature}>
            <CheckCircle2 size={20} />
            <span>{feature}</span>
          </article>
        ))}
      </div>
    </div>
  )
}
