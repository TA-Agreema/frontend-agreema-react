import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './middlewares/ProtectedRoute.tsx'
import AuthPage from './pages/auth/AuthPage.tsx'
import DashboardPage from './pages/dashboard/DashboardPage.tsx'
import UsersListPage from './pages/users/new-users/UsersListPage.tsx'
import RolesListPage from './pages/users/roles/RolesListPage.tsx'
import ContractPage from './pages/contracts/ContractListPage.tsx'
import NotFoundPage from './pages/error/NotFoundPage.tsx'
import ServerErrorPage from './pages/error/ServerErrorPage.tsx'
import UnauthorizedPage from './pages/error/UnauthorizedPage.tsx'
import withDashboard from './layouts/withDasboard.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'

const Dashboard = withDashboard(DashboardPage)
const Users = withDashboard(UsersListPage)
const Roles = withDashboard(RolesListPage)
const Contract = withDashboard(ContractPage)

export default function App() {
  return (
    <ErrorBoundary>
      <div className=''>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<AuthPage />} />
          <Route path="/login" element={<AuthPage />} />

          {/* Error Pages */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/server-error" element={<ServerErrorPage />} />
          <Route path="/404" element={<NotFoundPage />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/users" element={
            <ProtectedRoute permissions={["read.all.users"]}>
              <Users />
            </ProtectedRoute>
          } />

          <Route path="/roles" element={
            <ProtectedRoute permissions={["read.all.roles"]}>
              <Roles />
            </ProtectedRoute>
          } />

          <Route path="/contracts" element={
            <ProtectedRoute>
              <Contract />
            </ProtectedRoute>
          } />

          {/* 404 - Catch all unmatched routes */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </ErrorBoundary>
  )
}