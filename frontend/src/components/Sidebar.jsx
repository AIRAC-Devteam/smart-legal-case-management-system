import { useEffect, useState } from 'react'

import {
  Bell,
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
  LogOut,
  Menu,
  PieChart,
  Settings,
  UserRound,
  X,
} from 'lucide-react'

import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import logoImg from '../assets/logowhite.png'
import { clearAuthToken } from '../api/client'
import '../styles/app.css'


const items = [
  {
    to: '/',
    label: 'صفحه نخست',
    icon: Home,
  },
  {
    to: '/cases/new',
    label: 'تشکیل پرونده',
    icon: FilePlus2,
  },
  {
    to: '/cases',
    label: 'پرونده‌های ایجادشده',
    icon: Files,
  },
  {
    to: '/defense-drafts',
    label: 'پیش‌نویس لوایح',
    icon: FileSignature,
    badge: 'AI',
  },
  { to: '/legal-repository', label: 'مخزن هوشمند قوانین', icon: BookOpenText },
  {
    to: '/inbox',
    label: 'کارتابل من',
    icon: Inbox,
  },
  {
    to: '/lawsuits',
    label: 'دعاوی',
    icon: Gavel,
  },
  {
    to: '/contracts',
    label: 'تعهدات و قراردادها',
    icon: BookOpenText,
  },
  {
    to: '/properties',
    label: 'املاک',
    icon: Building2,
  },
  {
    to: '/databanks',
    label: 'بانک‌های اطلاعاتی',
    icon: Database,
  },
  {
    to: '/reports',
    label: 'گزارشات',
    icon: PieChart,
  },
  {
    to: '/help',
    label: 'راهنما',
    icon: HelpCircle,
  },
]


const mobileMainPaths = [
  '/',
  '/cases/new',
  '/cases',
  '/inbox',
]


function getActivePath(pathname) {
  if (pathname === '/') {
    return '/'
  }

  if (
    pathname === '/cases/new' ||
    pathname.startsWith('/cases/new/')
  ) {
    return '/cases/new'
  }

  if (
    pathname === '/cases' ||
    /^\/cases\/\d+\/?$/.test(pathname)
  ) {
    return '/cases'
  }

  const matchedItem = items.find(
    (item) =>
      item.to !== '/' &&
      (
        pathname === item.to ||
        pathname.startsWith(`${item.to}/`)
      ),
  )

  return matchedItem?.to || ''
}


export default function Sidebar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false)

  const username =
    localStorage.getItem('auth_username') ||
    'admin'

  const activePath =
    getActivePath(pathname)

  const mobileMainItems =
    items.filter((item) =>
      mobileMainPaths.includes(item.to),
    )


  const handleLogout = () => {
    clearAuthToken()

    localStorage.removeItem(
      'auth_username',
    )

    localStorage.removeItem(
      'auth_remember',
    )

    setMobileMenuOpen(false)

    navigate('/login', {
      replace: true,
    })
  }


  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])


  useEffect(() => {
    document.body.style.overflow =
      mobileMenuOpen
        ? 'hidden'
        : ''

    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])
const displayUsername =
  username
    .replace('alireza', 'علیرضا')
    .replace('admin', 'ادمین')
    .replace('aghakhani','آقاخانی')
  return (
    <>
      {/* =========================
          SIDEBAR DESKTOP
      ========================== */}

      <aside className="sidebar desktop-sidebar">

        {/* Brand */}
        <div className="brand">

          <div className="brand-mark">
            <img
              src={logoImg}
              alt="نشان جهاد دانشگاهی"
            />
          </div>

          <div className="brand-copy">

            <strong
              style={{
                color: 'black',
              }}
            >
              سامانه حقوقی جهاد دانشگاهی
            </strong>

            <small>
              مدیریت هوشمند پرونده‌ها
            </small>

          </div>
        </div>


        {/* Main navigation */}
        <nav
          className="sidebar-nav"
          aria-label="منوی اصلی"
        >
          {items.map(
            ({
              to,
              label,
              icon: Icon,
              badge,
            }) => {

              const active =
                activePath === to

              return (
                <Link
                  key={to}
                  to={to}
                  className={`nav-item ${
                    active
                      ? 'active'
                      : ''
                  }`}
                >

                  <span className="nav-icon">
                    <Icon size={21} />
                  </span>

                  <span className="nav-label">
                    {label}
                  </span>

                  {badge && (
                    <span className="nav-badge">
                      {badge}
                    </span>
                  )}

                </Link>
              )
            },
          )}
        </nav>


        {/* =========================
            ACCOUNT DESKTOP
        ========================== */}

        <div className="sidebar-account">

          <div className="sidebar-account-top">

            <div className="sidebar-avatar">
              <UserRound size={22} />

              <span className="sidebar-online-dot" />
            </div>


            <div className="sidebar-account-info">

              <strong>
                {displayUsername}
              </strong>

              <small>
                مدیر سامانه
              </small>

              <span className="sidebar-online">
                <i />
                آنلاین
              </span>

            </div>

          </div>


          


          <button
            type="button"
            className="sidebar-logout-button"
            onClick={handleLogout}
          >
            <LogOut size={18} />

            <span>
              خروج از حساب
            </span>
          </button>

        </div>


        {/* Sidebar footer */}
        <div className="sidebar-footer">

          <BriefcaseBusiness size={16} />

          <span>
            مرکز راهبری پژوهش و پیشرفت هوش مصنوعی
          </span>

        </div>

      </aside>


      {/* =========================
          MOBILE MENU BUTTON
      ========================== */}

      <button
        type="button"
        className="mobile-menu-toggle"
        onClick={() =>
          setMobileMenuOpen(true)
        }
        aria-label="باز کردن منوی اصلی"
        aria-expanded={mobileMenuOpen}
      >
        <Menu size={24} />
      </button>


      {/* =========================
          MOBILE OVERLAY
      ========================== */}

      <button
        type="button"
        className={`mobile-menu-overlay ${
          mobileMenuOpen
            ? 'open'
            : ''
        }`}
        onClick={() =>
          setMobileMenuOpen(false)
        }
        aria-label="بستن منو"
      />


      {/* =========================
          MOBILE DRAWER
      ========================== */}

      <aside
        className={`mobile-menu-drawer ${
          mobileMenuOpen
            ? 'open'
            : ''
        }`}
        aria-hidden={!mobileMenuOpen}
      >

        <div className="mobile-drawer-header">

          <strong>
            منوی سامانه
          </strong>

          <button
            type="button"
            onClick={() =>
              setMobileMenuOpen(false)
            }
            aria-label="بستن منو"
          >
            <X size={22} />
          </button>

        </div>


        <nav
          className="mobile-drawer-nav"
          aria-label="منوی کامل موبایل"
        >

          {items.map(
            ({
              to,
              label,
              icon: Icon,
              badge,
            }) => {

              const active =
                activePath === to

              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() =>
                    setMobileMenuOpen(false)
                  }
                  className={`mobile-drawer-item ${
                    active
                      ? 'active'
                      : ''
                  }`}
                >

                  <span className="mobile-drawer-icon">
                    <Icon size={21} />
                  </span>

                  <span>
                    {label}
                  </span>

                  {badge && (
                    <small>
                      {badge}
                    </small>
                  )}

                </Link>
              )
            },
          )}

        </nav>


        {/* =========================
            ACCOUNT MOBILE
        ========================== */}

        <div className="mobile-account-card">

          <div className="mobile-account-profile">

            <div className="mobile-account-avatar">
              <UserRound size={22} />
            </div>


            <div>

              <strong>
                {displayUsername}
              </strong>

              <small>
                مدیر سامانه
              </small>

            </div>

          </div>


          <button
            type="button"
            onClick={handleLogout}
          >
            <LogOut size={18} />

            <span>
              خروج از حساب
            </span>
          </button>

        </div>

      </aside>


      {/* =========================
          MOBILE BOTTOM NAVIGATION
      ========================== */}

      <nav
        className="mobile-bottom-nav"
        aria-label="دسترسی سریع موبایل"
      >

        {mobileMainItems.map(
          ({
            to,
            label,
            icon: Icon,
          }) => {

            const active =
              activePath === to

            return (
              <Link
                key={to}
                to={to}
                className={`mobile-bottom-item ${
                  active
                    ? 'active'
                    : ''
                }`}
              >

                <Icon size={22} />

                <span>
                  {label}
                </span>

              </Link>
            )
          },
        )}

      </nav>

    </>
  )
}
