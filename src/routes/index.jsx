import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Home, Login } from "../pages/Auth.jsx";
import { Register } from "../pages/Register.jsx";
import { PatientDashboard } from "../pages/PatientDashboard.jsx";
import { CreateAppointment } from "../pages/CreateAppointment.jsx";
import { ChooseAppointmentTime } from "../pages/ChooseAppointmentTime.jsx";
import { DoctorDashboard } from "../pages/DoctorDashboard.jsx";
import { DoctorAppointmentsList } from "../pages/DoctorAppointmentsList.jsx";
import { DoctorPatientRecords } from "../pages/DoctorPatientRecords.jsx";
import { ProposeAppointmentTimes } from "../pages/ProposeAppointmentTimes.jsx";
import { AdminLogin } from "../pages/AdminLogin.jsx";
import { AdminDashboard } from "../pages/AdminDashboard.jsx";
import ProtectedRoute from "../components/auth/ProtectedRoute.jsx";
import AdminProtectedRoute from "../components/auth/AdminProtectedRoute.jsx";

export const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Patient Routes */}
        <Route
          path="/patient/dashboard"
          element={
            <ProtectedRoute requiredRole="patient">
              <PatientDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/appointments/new"
          element={
            <ProtectedRoute requiredRole="patient">
              <CreateAppointment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/appointments/:id/choose"
          element={
            <ProtectedRoute requiredRole="patient">
              <ChooseAppointmentTime />
            </ProtectedRoute>
          }
        />

        {/* Doctor Routes */}
        <Route
          path="/doctor/dashboard"
          element={
            <ProtectedRoute requiredRole="doctor">
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/appointments"
          element={
            <ProtectedRoute requiredRole="doctor">
              <DoctorAppointmentsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/appointments/:id/propose"
          element={
            <ProtectedRoute requiredRole="doctor">
              <ProposeAppointmentTimes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/patient-records"
          element={
            <ProtectedRoute requiredRole="doctor">
              <DoctorPatientRecords />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          }
        />

        {/* 404 Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};
