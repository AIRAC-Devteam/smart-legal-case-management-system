import { Navigate, Route, Routes } from 'react-router-dom'

import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

import HomePage from './pages/HomePage'
import NewCasePage from './pages/NewCasePage'
import CasesPage from './pages/CasesPage'
import CaseDetailsPage from './pages/CaseDetailsPage'
import DefenseDraftsPage from './pages/DefenseDraftsPage'
import InboxPage from './pages/InboxPage'
import LawsuitsPage from './pages/LawsuitsPage'
import ReportsPage from './pages/ReportsPage'
import HelpPage from './pages/HelpPage'
import ModuleOverviewPage from './pages/ModuleOverviewPage'
import LoginPage from './pages/LoginPage'

export default function App() {
  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />

          <Route path="/cases/new" element={<NewCasePage />} />
          <Route path="/cases" element={<CasesPage />} />
          <Route path="/cases/:id" element={<CaseDetailsPage />} />

          <Route
            path="/defense-drafts"
            element={<DefenseDraftsPage />}
          />

          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/lawsuits" element={<LawsuitsPage />} />

          <Route
            path="/contracts"
            element={
              <ModuleOverviewPage
                title="تعهدات و قراردادها"
                description="نمای یکپارچه قراردادها، تعهدات، سررسیدها و هشدارهای حقوقی سازمان"
                features={[
                  'ثبت و طبقه‌بندی قراردادها و الحاقیه‌ها',
                  'هشدار سررسید تعهدات و تضامین',
                  'جستجوی هوشمند در متن قراردادها',
                  'اتصال قرارداد مرتبط به پرونده حقوقی',
                ]}
              />
            }
          />

          <Route
            path="/properties"
            element={
              <ModuleOverviewPage
                title="املاک"
                description="مدیریت اطلاعات ثبتی، اسناد، دعاوی و وضعیت بهره‌برداری املاک"
                features={[
                  'شناسنامه کامل هر ملک و اسناد پیوست',
                  'ثبت دعاوی و تعارضات مرتبط با ملک',
                  'پیگیری وضعیت ثبتی و مالکیتی',
                  'هشدار انقضای اجاره و مجوزهای بهره‌برداری',
                ]}
              />
            }
          />

          <Route
            path="/databanks"
            element={
              <ModuleOverviewPage
                title="بانک‌های اطلاعاتی"
                description="دسترسی ساختاریافته به اشخاص، مراجع، موضوعات و مستندات حقوقی پرتکرار"
                features={[
                  'بانک اشخاص حقیقی و حقوقی',
                  'فهرست مراجع قضایی و شعب',
                  'موضوعات و طبقه‌بندی‌های حقوقی',
                  'الگوها و مستندات مورد استفاده واحد حقوقی',
                ]}
              />
            }
          />

          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/help" element={<HelpPage />} />
        </Route>
      </Route>

      {/* Unknown routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}