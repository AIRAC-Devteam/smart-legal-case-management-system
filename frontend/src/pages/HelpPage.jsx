import { BookOpenCheck, FileSignature, ScanLine, ShieldCheck } from 'lucide-react'

const steps = [
  ['بارگذاری سند', 'فایل PDF یا تصویر ابلاغیه، دادخواست، اظهارنامه یا دادنامه را بارگذاری کنید.'],
  ['بازبینی اطلاعات', 'خروجی استخراج هوشمند را با سند اصلی تطبیق دهید و موارد لازم را اصلاح کنید.'],
  ['تشکیل پرونده', 'اطلاعات تأییدشده را ذخیره کنید تا پرونده رسمی سامانه ایجاد شود.'],
  ['تولید لایحه', 'در صفحه پرونده، پیش‌نویس لایحه را تولید کنید؛ هر تولید به‌عنوان یک نسخه ذخیره می‌شود.'],
  ['بررسی حقوقی', 'متن را ویرایش کرده و وضعیت آن را از پیش‌نویس به در حال بررسی یا تأییدشده تغییر دهید.'],
]

export default function HelpPage() {
  return (
    <div className="page-wrap">
      <header className="page-header">
        <div>
          <span className="eyebrow">راهنمای استفاده و دمو</span>
          <h1>راهنمای سامانه حقوقی هوشمند</h1>
          <p>مسیر پیشنهادی برای اجرای یک دموی کامل و قابل فهم برای مدیران و کارشناسان</p>
        </div>
      </header>

      <section className="demo-guide-grid">
        <article className="guide-highlight">
          <span className="guide-icon"><ScanLine /></span>
          <h2>سناریوی پیشنهادی دمو</h2>
          <p>یک سند واقعی آزمایشی را از مرحله بارگذاری تا تولید، ذخیره و بررسی لایحه نمایش دهید.</p>
        </article>
        <article className="guide-highlight">
          <span className="guide-icon"><FileSignature /></span>
          <h2>نقطه تمایز اصلی</h2>
          <p>تمام نسخه‌های تولیدشده از بین نمی‌روند و در مخزن پیش‌نویس‌ها قابل پیگیری هستند.</p>
        </article>
        <article className="guide-highlight">
          <span className="guide-icon"><ShieldCheck /></span>
          <h2>کنترل انسانی</h2>
          <p>هیچ متن هوش مصنوعی بدون بازبینی و تأیید کارشناس حقوقی نهایی تلقی نمی‌شود.</p>
        </article>
      </section>

      <section className="form-card help-steps-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">گردش‌کار</span>
            <h2>پنج مرحله اصلی سامانه</h2>
          </div>
        </div>
        <div className="help-steps">
          {steps.map(([title, text], index) => (
            <div className="help-step" key={title}>
              <span>{(index + 1).toLocaleString('fa-IR')}</span>
              <div><strong>{title}</strong><p>{text}</p></div>
            </div>
          ))}
        </div>
      </section>

      {/* <section className="form-card demo-checklist">
        <div className="section-heading">
          <div>
            <span className="eyebrow">چک‌لیست قبل از ارائه</span>
            <h2>آمادگی برای نمایش سامانه</h2>
          </div>
        </div>
        {[
          'Backend و Frontend هم‌زمان اجرا شده باشند.',
          'کلید Gemini در فایل محیطی Backend تنظیم شده باشد.',
          'حداقل یک سند نمونه بدون اطلاعات واقعی حساس آماده باشد.',
          'یک پرونده و یک پیش‌نویس از قبل برای نمایش گزارش‌ها وجود داشته باشد.',
        ].map((item) => (
          <div className="check-row" key={item}><BookOpenCheck size={19} /><span>{item}</span></div>
        ))}
      </section> */}
    </div>
  )
}
