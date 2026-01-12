import { Routes, Route } from 'react-router-dom'
import AuthPage from './pages/auth/AuthPage.tsx'
import DashboardLayout from './layouts/DashboardLayout.tsx'
import DashboardPage from './pages/dashboard/DashboardPage.tsx'

export default function App() {
  return (
    <div className=''>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/dashboard" element={
          <DashboardLayout>
            <DashboardPage />
          </DashboardLayout>
        } />
      </Routes>
    </div>
  )
}