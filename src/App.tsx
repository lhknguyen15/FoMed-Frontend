import { Navigate, Route, Routes } from "react-router-dom";
import AuthLayout from "./layouts/AuthLayout";
import LoginPage from "./workspaces/auth/pages/LoginPage";
import RegisterPage from "./workspaces/auth/pages/RegisterPage";
import ForgotPasswordPage from "./workspaces/auth/pages/ForgotPasswordPage";
import ForbiddenPage from "./workspaces/auth/pages/ForbiddenPage";
import ChangePasswordPage from "./workspaces/auth/pages/ChangePasswordPage";
import WorkspacePages from "./workspaces/WorkspacePages";
import GuestRoute from "./routes/GuestRoute";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoute";
import CMSLayout from "./layouts/CMSLayout";
import AdminDashboardPage from "./cms/dashboard/pages/AdminDashboardPage";
import DoctorManagementPage from "./cms/doctors/pages/DoctorManagementPage";
import SpecialtyManagementPage from "./cms/specialties/pages/SpecialtyManagementPage";
import TimeOffManagementPage from "./cms/time-off/pages/TimeOffManagementPage";
import ServiceManagementPage from "./cms/services/pages/ServiceManagementPage";
import UserManagementPage from "./cms/users/pages/UserManagementPage";
import RoleManagementPage from "./cms/roles/pages/RoleManagementPage";
import AdminReportPage from "./cms/reports/pages/AdminReportPage";
import AuditLogPage from "./cms/audit/pages/AuditLogPage";

const patientRoutes = [
  "/booking",
  "/my-appointments",
  "/my-records",
  "/my-invoices",
];
const receptionRoutes = [
  "/reception",
  "/reception/patients",
  "/reception/booking",
  "/reception/queue",
  "/reception/cashier/:invoiceId",
];
const doctorRoutes = [
  "/doctor/queue",
  "/doctor/exam/:recordId",
  "/doctor/exam/:recordId/services",
  "/doctor/exam/:recordId/prescription",
];
const technicianRoutes = ["/technician/orders", "/technician/results"];
const pharmacyRoutes = [
  "/pharmacy/inventory",
  "/pharmacy/dispense/:prescriptionId",
  "/pharmacy/receipt",
];
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route element={<GuestRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/forbidden" element={<ForbiddenPage />} />
        <Route path="/account/change-password" element={<ChangePasswordPage />} />
        <Route element={<RoleRoute roles={["Patient"]} />}>
          {patientRoutes.map((path) => (
            <Route key={path} path={path} element={<WorkspacePages />} />
          ))}
        </Route>
        <Route element={<RoleRoute roles={["Receptionist", "Admin"]} />}>
          {receptionRoutes.map((path) => (
            <Route key={path} path={path} element={<WorkspacePages />} />
          ))}
        </Route>
        <Route element={<RoleRoute roles={["Doctor"]} />}>
          {doctorRoutes.map((path) => (
            <Route key={path} path={path} element={<WorkspacePages />} />
          ))}
        </Route>
        <Route element={<RoleRoute roles={["Technician"]} />}>
          {technicianRoutes.map((path) => (
            <Route key={path} path={path} element={<WorkspacePages />} />
          ))}
        </Route>
        <Route element={<RoleRoute roles={["Pharmacist", "Admin"]} />}>
          {pharmacyRoutes.map((path) => (
            <Route key={path} path={path} element={<WorkspacePages />} />
          ))}
        </Route>
        <Route element={<RoleRoute roles={["Admin"]} />}>
          <Route element={<CMSLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/doctors" element={<DoctorManagementPage />} />
            <Route path="/admin/specialties" element={<SpecialtyManagementPage />} />
            <Route path="/admin/time-off" element={<TimeOffManagementPage />} />
            <Route path="/admin/services" element={<ServiceManagementPage />} />
            <Route path="/admin/users" element={<UserManagementPage />} />
            <Route path="/admin/roles" element={<RoleManagementPage />} />
            <Route path="/admin/reports" element={<AdminReportPage />} />
            <Route path="/admin/audit-logs" element={<AuditLogPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
