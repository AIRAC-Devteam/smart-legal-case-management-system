import {
  ArrowLeft,
  CheckCircle2,
  FileSearch2,
  Files,
  ScanLine,
  ShieldCheck,
} from 'lucide-react'
import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="page-wrap">
      <section className="home-hero">
        <div className="hero-copy">
          <span className="eyebrow light">سامانه هوشمند واحد حقوقی</span>
          <h1>از سند قضایی تا پرونده قابل پیگیری، در یک جریان واحد</h1>
          <p>
            سند را بارگذاری کنید، اطلاعات استخراج‌شده را بررسی کنید، پرونده را
            ثبت کنید و سپس پیش‌نویس لایحه دفاعیه را از روی داده‌های تأییدشده بسازید.
          </p>
          <div className="hero-actions">
            <Link className="btn hero-primary" to="/cases/new">
              <ScanLine size={19} /> تشکیل پرونده جدید
            </Link>
            <Link className="btn hero-secondary" to="/cases">
              <Files size={19} /> مشاهده پرونده‌ها
            </Link>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-icon-card main"><FileSearch2 size={42} /></div>
          <div className="hero-icon-card one"><CheckCircle2 size={24} /></div>
          <div className="hero-icon-card two"><ShieldCheck size={24} /></div>
        </div>
      </section>

      <div className="home-cards">
        <Link className="home-card" to="/cases/new">
          <div className="home-icon"><ScanLine /></div>
          <div>
            <h3>تشکیل پرونده جدید</h3>
            <p>آپلود تصویر یا PDF و تکمیل خودکار فرم با بازبینی انسانی</p>
          </div>
          <ArrowLeft size={20} />
        </Link>

        <Link className="home-card" to="/cases">
          <div className="home-icon"><Files /></div>
          <div>
            <h3>پرونده‌های ثبت‌شده</h3>
            <p>جستجو، مشاهده، ویرایش و تهیه پیش‌نویس لایحه دفاعیه</p>
          </div>
          <ArrowLeft size={20} />
        </Link>
      </div>

      <section className="workflow-strip">
        <div><span>۱</span><strong>بارگذاری سند</strong></div>
        <i />
        <div><span>۲</span><strong>استخراج و بازبینی</strong></div>
        <i />
        <div><span>۳</span><strong>ثبت پرونده</strong></div>
        <i />
        <div><span>۴</span><strong>تهیه پیش‌نویس لایحه</strong></div>
      </section>
    </div>
  )
}
