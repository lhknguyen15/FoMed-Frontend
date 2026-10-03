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
import ScheduleManagementPage from "./cms/schedules/pages/ScheduleManagementPage";
import ServiceManagementPage from "./cms/services/pages/ServiceManagementPage";
import UserManagementPage from "./cms/users/pages/UserManagementPage";
import RoleManagementPage from "./cms/roles/pages/RoleManagementPage";
import AdminReportPage from "./cms/reports/pages/AdminReportPage";
import AuditLogPage from "./cms/audit/pages/AuditLogPage";
import MyAppointmentsPage from "./workspaces/patient/pages/MyAppointmentsPage";
import BookingPage from "./workspaces/patient/pages/BookingPage";
import MedicalRecordListPage from "./workspaces/patient/pages/MedicalRecordListPage";
import PatientInvoiceListPage from "./workspaces/patient/pages/PatientInvoiceListPage";
import ReceptionDashboardPage from "./workspaces/reception/pages/ReceptionDashboardPage";
import ReceptionPatientsPage from "./workspaces/reception/pages/ReceptionPatientsPage";
import ReceptionBookingPage from "./workspaces/reception/pages/ReceptionBookingPage";
import ReceptionQueuePage from "./workspaces/reception/pages/ReceptionQueuePage";
import ReceptionCashierPage from "./workspaces/reception/pages/ReceptionCashierPage";
import ReceptionInvoiceListPage from "./workspaces/reception/pages/ReceptionInvoiceListPage";
import DoctorQueuePage from "./workspaces/doctor/pages/DoctorQueuePage";
import DoctorExamPage from "./workspaces/doctor/pages/DoctorExamPage";
import DoctorServicesPage from "./workspaces/doctor/pages/DoctorServicesPage";
import DoctorPrescriptionPage from "./workspaces/doctor/pages/DoctorPrescriptionPage";
import TechnicianOrdersPage from "./workspaces/technician/pages/TechnicianOrdersPage";
import TechnicianResultsPage from "./workspaces/technician/pages/TechnicianResultsPage";
import PharmacyInventoryPage from "./workspaces/pharmacy/pages/PharmacyInventoryPage";
import PharmacyDispensePage from "./workspaces/pharmacy/pages/PharmacyDispensePage";
import PharmacyReceiptPage from "./workspaces/pharmacy/pages/PharmacyReceiptPage";
import AccountLayout from "./workspaces/account/layouts/AccountLayout";
import AccountProfilePage from "./workspaces/account/pages/AccountProfilePage";

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
  "/reception/cashier",
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
  "/pharmacy/dispense",
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
        <Route element={<AccountLayout />}>
          <Route path="/account/profile" element={<AccountProfilePage />} />
          <Route path="/account/change-password" element={<ChangePasswordPage />} />
        </Route>
        <Route element={<RoleRoute roles={["Patient"]} />}>
          {patientRoutes.map((path) => (
            <Route key={path} path={path} element={path === "/my-appointments" ? <MyAppointmentsPage /> : path === "/booking" ? <BookingPage /> : path === "/my-records" ? <MedicalRecordListPage /> : path === "/my-invoices" ? <PatientInvoiceListPage /> : <WorkspacePages />} />
          ))}
        </Route>
        <Route element={<RoleRoute roles={["Receptionist", "Admin"]} />}>
          {receptionRoutes.map((path) => (
            <Route key={path} path={path} element={path === "/reception" ? <ReceptionDashboardPage /> : path === "/reception/patients" ? <ReceptionPatientsPage /> : path === "/reception/booking" ? <ReceptionBookingPage /> : path === "/reception/queue" ? <ReceptionQueuePage /> : path === "/reception/cashier" ? <ReceptionInvoiceListPage /> : path.startsWith("/reception/cashier/") ? <ReceptionCashierPage /> : <WorkspacePages />} />
          ))}
        </Route>
        <Route element={<RoleRoute roles={["Doctor"]} />}>
          {doctorRoutes.map((path) => (
            <Route key={path} path={path} element={path === "/doctor/queue" ? <DoctorQueuePage /> : path.endsWith("/services") ? <DoctorServicesPage /> : path.endsWith("/prescription") ? <DoctorPrescriptionPage /> : <DoctorExamPage />} />
          ))}
        </Route>
        <Route element={<RoleRoute roles={["Technician"]} />}>
          {technicianRoutes.map((path) => (
            <Route key={path} path={path} element={path === "/technician/orders" ? <TechnicianOrdersPage /> : <TechnicianResultsPage />} />
          ))}
        </Route>
        <Route element={<RoleRoute roles={["Pharmacist", "Admin"]} />}>
          {pharmacyRoutes.map((path) => (
            <Route key={path} path={path} element={path === "/pharmacy/inventory" ? <PharmacyInventoryPage /> : path === "/pharmacy/receipt" ? <PharmacyReceiptPage /> : <PharmacyDispensePage />} />
          ))}
        </Route>
        <Route element={<RoleRoute roles={["Admin"]} />}>
          <Route element={<CMSLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/doctors" element={<DoctorManagementPage />} />
            <Route path="/admin/specialties" element={<SpecialtyManagementPage />} />
            <Route path="/admin/schedules" element={<ScheduleManagementPage />} />
            <Route path="/admin/time-off" element={<Navigate to="/admin/schedules?tab=leave" replace />} />
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
