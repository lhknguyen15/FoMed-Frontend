import { Navigate, Route, Routes } from "react-router-dom";
import AuthLayout from "./modules/auth/layouts/AuthLayout";
import LoginPage from "./modules/auth/pages/LoginPage";
import RegisterPage from "./modules/auth/pages/RegisterPage";
import ForgotPasswordPage from "./modules/auth/pages/ForgotPasswordPage";
import ForbiddenPage from "./modules/auth/pages/ForbiddenPage";
import ChangePasswordPage from "./modules/auth/pages/ChangePasswordPage";
import WorkspacePages from "./workspaces/WorkspacePages";
import GuestRoute from "./routes/GuestRoute";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoute";

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
const adminRoutes = [
  "/admin/doctors",
  "/admin/schedules",
  "/admin/services",
  "/admin/users",
  "/admin/reports",
  "/admin/audit-logs",
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
          {adminRoutes.map((path) => (
            <Route key={path} path={path} element={<WorkspacePages />} />
          ))}
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
