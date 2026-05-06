import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./middlewares/ProtectedRoute.tsx";
import AuthPage from "./pages/auth/AuthPage.tsx";
import DashboardPage from "./pages/dashboard/DashboardPage.tsx";
import UserRoleManagementPage from "./pages/users/UserRoleManagementPage.tsx";
import ContractPage from "./pages/contracts/ContractListPage.tsx";
import ContractCategoryPage from "./pages/contracts/category/ContractCategoryPage.tsx";
import NotFoundPage from "./pages/error/NotFoundPage.tsx";
import ServerErrorPage from "./pages/error/ServerErrorPage.tsx";
import UnauthorizedPage from "./pages/error/UnauthorizedPage.tsx";
import withDashboard from "./layouts/withDasboard.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import ContractTemplatePage from "@/pages/contracts/template/ContractTemplatePage";
import TemplateEditorPage from "@/pages/contracts/template/TemplateEditorPage";
import ContractEditorPage from "@/pages/contracts/ContractEditorPage";

const Dashboard = withDashboard(DashboardPage);
const UserRoleManagement = withDashboard(UserRoleManagementPage);
const Contract = withDashboard(ContractPage);
const Category = withDashboard(ContractCategoryPage);
const ContractTemplate = withDashboard(ContractTemplatePage);
const TemplateEditor = TemplateEditorPage;
const ContractEditor = ContractEditorPage;

export default function App() {
  return (
    <ErrorBoundary>
      <div className="">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<AuthPage />} />
          <Route path="/login" element={<AuthPage />} />

          {/* Error Pages */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/server-error" element={<ServerErrorPage />} />
          <Route path="/404" element={<NotFoundPage />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/users"
            element={
              <ProtectedRoute permissions={[]}>
                <UserRoleManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/contracts"
            element={
              <ProtectedRoute>
                <Contract />
              </ProtectedRoute>
            }
          />

          <Route
            path="/contracts/create"
            element={
              <ProtectedRoute>
                <ContractEditor />
              </ProtectedRoute>
            }
          />

          <Route
            path="/contracts/:id/edit"
            element={
              <ProtectedRoute>
                <ContractEditor />
              </ProtectedRoute>
            }
          />

          <Route
            path="/categories"
            element={
              <ProtectedRoute>
                <Category />
              </ProtectedRoute>
            }
          />

          <Route
            path="/contracts-templates"
            element={
              <ProtectedRoute>
                <ContractTemplate />
              </ProtectedRoute>
            }
          />

          <Route
            path="/contracts-templates/new"
            element={
              <ProtectedRoute>
                <TemplateEditor />
              </ProtectedRoute>
            }
          />

          <Route
            path="/contracts-templates/:id/edit"
            element={
              <ProtectedRoute>
                <TemplateEditor />
              </ProtectedRoute>
            }
          />

          {/* 404 - Catch all unmatched routes */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </ErrorBoundary>
  );
}
