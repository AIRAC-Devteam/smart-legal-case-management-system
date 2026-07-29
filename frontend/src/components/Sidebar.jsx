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
      <div className="brand">
        <div className="brand-mark">
          <img 
    src={logoImg2} 
    alt="لوگو" 
    style={{ width: '70px', height: '70px', objectFit: 'contain' }} 
  />
          </div>
        <div>
          <strong style={{ color:'white', fontSize: '14px' }}>سامانه حقوقی جهاد دانشگاهی</strong>
          <small>مدیریت هوشمند پرونده‌ها</small>
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
