import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import NewCasePage from './pages/NewCasePage'
import CasesPage from './pages/CasesPage'
import CaseDetailsPage from './pages/CaseDetailsPage'
import PlaceholderPage from './pages/PlaceholderPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/cases/new" element={<NewCasePage />} />
        <Route path="/cases" element={<CasesPage />} />
        <Route path="/cases/:id" element={<CaseDetailsPage />} />
        <Route path="/inbox" element={<PlaceholderPage title="کارتابل من" />} />
        <Route path="/lawsuits" element={<PlaceholderPage title="دعاوی" />} />
        <Route path="/contracts" element={<PlaceholderPage title="تعهدات و قراردادها" />} />
        <Route path="/properties" element={<PlaceholderPage title="املاک" />} />
        <Route path="/databanks" element={<PlaceholderPage title="بانک‌های اطلاعاتی" />} />
        <Route path="/reports" element={<PlaceholderPage title="گزارشات" />} />
        <Route path="/help" element={<PlaceholderPage title="راهنما" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
