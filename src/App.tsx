import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./middlewares/ProtectedRoute.tsx";
import AuthPage from "./pages/auth/AuthPage.tsx";
import DashboardPage from "./pages/dashboard/DashboardPage.tsx";
import UserRoleManagementPage from "./pages/users/UserRoleManagementPage.tsx";
import ContractPage from "./pages/contracts/ContractListPage.tsx";
import ContractArchivePage from "./pages/contracts/ContractArchivePage.tsx";
import ContractActiveListPage from "./pages/contracts/ContractActiveListPage.tsx";
import ContractCategoryPage from "./pages/contracts/category/ContractCategoryPage.tsx";
import NotFoundPage from "./pages/error/NotFoundPage.tsx";
import ServerErrorPage from "./pages/error/ServerErrorPage.tsx";
import UnauthorizedPage from "./pages/error/UnauthorizedPage.tsx";
import withDashboard from "./layouts/withDasboard.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import ContractTemplatePage from "@/pages/contracts/template/ContractTemplatePage";
import TemplateEditorPage from "@/pages/contracts/template/TemplateEditorPage";
import ContractEditorPage from "@/pages/contracts/ContractEditorPage";
import ContractReviewListPage from "@/pages/contracts/manager/ContractReviewListPage";
import ContractReviewDetailPage from "@/pages/contracts/manager/ContractReviewDetailPage";
import ContractApprovalSignPage from "@/pages/contracts/ContractApprovalSignPage.tsx";
import ContractReviewDetailExternalPage from "@/pages/contracts/external/ContractReviewDetailExternalPage";

const Dashboard = withDashboard(DashboardPage);
const UserRoleManagement = withDashboard(UserRoleManagementPage);
const Contract = withDashboard(ContractPage);
const ContractArchive = withDashboard(ContractArchivePage);
const ContractActive = withDashboard(ContractActiveListPage);
const Category = withDashboard(ContractCategoryPage);
const ContractTemplate = withDashboard(ContractTemplatePage);
const TemplateEditor = TemplateEditorPage;
const ContractEditor = ContractEditorPage;
const ContractReviewList = withDashboard(ContractReviewListPage);
const ContractReviewDetail = ContractReviewDetailPage;
const ContractApprovalSign = ContractApprovalSignPage;

export default function App() {
  return (
    <ErrorBoundary>
      <div className="">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<AuthPage />} />
          <Route path="/login" element={<AuthPage />} />

          <Route
            path="/external/sign"
            element={<ContractReviewDetailExternalPage />}
          />

          <Route
            path="/external/confirm"
            element={<ContractReviewDetailExternalPage />}
          /> 

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
              <ProtectedRoute permissions={["read.all.users"]}>
                <UserRoleManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/contracts"
            element={
              <ProtectedRoute permissions={["read.contracts"]}>
                <Contract />
              </ProtectedRoute>
            }
          />

          <Route
            path="/contracts/archive"
            element={
              <ProtectedRoute permissions={["read.contracts"]}>
                <ContractArchive />
              </ProtectedRoute>
            }
          />

          <Route
            path="/contracts/active"
            element={
              <ProtectedRoute permissions={["read.contracts"]}>
                <ContractActive />
              </ProtectedRoute>
            }
          />

          <Route
            path="/contracts/create"
            element={
              <ProtectedRoute permissions={["create.contract"]}>
                <ContractEditor />
              </ProtectedRoute>
            }
          />

          <Route
            path="/contracts/:id/edit"
            element={
              <ProtectedRoute permissions={["update.contract"]}>
                <ContractEditor />
              </ProtectedRoute>
            }
          />

          <Route
            path="/contracts/:id/view"
            element={
              <ProtectedRoute permissions={["read.contracts"]}>
                <ContractEditor />
              </ProtectedRoute>
            }
          />

          <Route
            path="/categories"
            element={
              <ProtectedRoute permissions={["read.contract_category"]}>
                <Category />
              </ProtectedRoute>
            }
          />

          <Route
            path="/contracts-templates"
            element={
              <ProtectedRoute permissions={["read.template"]}>
                <ContractTemplate />
              </ProtectedRoute>
            }
          />

          <Route
            path="/contracts-templates/new"
            element={
              <ProtectedRoute permissions={["create.template"]}>
                <TemplateEditor />
              </ProtectedRoute>
            }
          />

          <Route
            path="/contracts-templates/:id/edit"
            element={
              <ProtectedRoute permissions={["update.template"]}>
                <TemplateEditor />
              </ProtectedRoute>
            }
          />

          {/* Manager Approvals */}
          <Route
            path="/approvals"
            element={
              <ProtectedRoute permissions={["read.contracts"]}>
                <ContractReviewList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/approvals/:id"
            element={
              <ProtectedRoute permissions={["read.contracts"]}>
                <ContractReviewDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/approvals/:id/sign"
            element={
              <ProtectedRoute permissions={["read.contracts"]}>
                <ContractApprovalSign />
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
