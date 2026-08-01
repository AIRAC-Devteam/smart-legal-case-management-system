import {
  BookOpenText,
  BriefcaseBusiness,
  Building2,
  Database,
  FilePlus2,
  FileSignature,
  Files,
  Gavel,
  HelpCircle,
  Home,
  Inbox,
  PieChart,
} from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import logoImg from '../assets/logowhite.png'

const items = [
  { to: '/', label: 'صفحه نخست', icon: Home },
  { to: '/cases/new', label: 'تشکیل پرونده', icon: FilePlus2 },
  { to: '/cases', label: 'پرونده‌های ایجادشده', icon: Files },
  { to: '/defense-drafts', label: 'پیش‌نویس لوایح', icon: FileSignature, badge: 'AI' },
  { to: '/inbox', label: 'کارتابل من', icon: Inbox },
  { to: '/lawsuits', label: 'دعاوی', icon: Gavel },
  { to: '/contracts', label: 'تعهدات و قراردادها', icon: BookOpenText },
  { to: '/properties', label: 'املاک', icon: Building2 },
  { to: '/databanks', label: 'بانک‌های اطلاعاتی', icon: Database },
  { to: '/reports', label: 'گزارشات', icon: PieChart },
  { to: '/help', label: 'راهنما', icon: HelpCircle },
]

function isPathActive(pathname, to) {
  if (to === '/') return pathname === '/'
  if (to === '/cases') {
    return pathname === '/cases' || /^\/cases\/\d+\/?$/.test(pathname)
  }
  return pathname === to || pathname.startsWith(`${to}/`)
}

export default function Sidebar() {
  const { pathname } = useLocation()

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <img src={logoImg} alt="نشان جهاد دانشگاهی" />
        </div>

        <div className="brand-copy">
          <strong style={{color:"black"}}>سامانه حقوقی جهاد دانشگاهی</strong>
          <small>مدیریت هوشمند پرونده‌ها</small>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="منوی اصلی">
        {items.map(({ to, label, icon: Icon, badge }) => {
          const active = isPathActive(pathname, to)
          return (
            <NavLink
  key={to}
  to={to}
  end={to === '/' || to === '/cases'}
  className={({ isActive }) =>
    `nav-item ${isActive ? 'active' : ''}`
  }
>
              <span className="nav-icon"><Icon size={21} /></span>
              <span className="nav-label">{label}</span>
              {badge && <span className="nav-badge">{badge}</span>}
            </NavLink>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        <BriefcaseBusiness size={18} />
        <span>مرکز راهبری پژوهش و پیشرفت هوش مصنوعی</span>
      </div>
    </aside>
  )
}
