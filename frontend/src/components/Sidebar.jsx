import {
  BookOpenText,
  BriefcaseBusiness,
  Building2,
  Database,
  FilePlus2,
  Files,
  Gavel,
  HelpCircle,
  Home,
  Inbox,
  Landmark,
  PieChart,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import logoImg from '../assets/armjahad.png'
import logoImg2 from '../assets/logo.png'
import logoImg3 from "../assets/logowhite.png"
const items = [
  { to: '/', label: 'صفحه نخست', icon: Home },
  { to: '/cases/new', label: 'تشکیل پرونده', icon: FilePlus2 },
  { to: '/cases', label: 'پرونده‌های ایجادشده', icon: Files },
  { to: '/inbox', label: 'کارتابل من', icon: Inbox },
  { to: '/lawsuits', label: 'دعاوی', icon: Gavel },
  { to: '/contracts', label: 'تعهدات و قراردادها', icon: BookOpenText },
  { to: '/properties', label: 'املاک', icon: Building2 },
  { to: '/databanks', label: 'بانک‌های اطلاعاتی', icon: Database },
  { to: '/reports', label: 'گزارشات', icon: PieChart },
  { to: '/help', label: 'راهنما', icon: HelpCircle },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div 
  className="brand" 
  style={{ 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    textAlign: 'center', 
    gap: '16px' 
  }}
>
  <div className="brand-mark">
    <img 
      src={logoImg3} 
      alt="لوگو" 
      style={{ width: '150px', height: '150px', objectFit: 'contain' }} 
    />
  </div>

  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <strong style={{ color: 'white', fontSize: '14px' }}>
      سامانه حقوقی جهاد دانشگاهی
    </strong>
    <small style={{ color: '#9ca3af', marginTop: '4px' }}>
      مدیریت هوشمند پرونده‌ها
    </small>
  </div>
</div>
      <nav>
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer ">
        <BriefcaseBusiness size={18} />
        <span>مرکز راهبری پژوهش و پیشرفت هوش مصنوعی</span>
      </div>
    </aside>
  )
}
