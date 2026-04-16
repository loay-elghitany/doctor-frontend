import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";
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
import { AdminAnalyticsPage } from "../pages/AdminAnalyticsPage.jsx";
import { SecretaryDashboard } from "../pages/SecretaryDashboard.jsx";
import { SecretaryAppointmentsList } from "../pages/SecretaryAppointmentsList.jsx";
import { SecretaryPatientsList } from "../pages/SecretaryPatientsList.jsx";
import { SecretaryCreateAppointment } from "../pages/SecretaryCreateAppointment.jsx";
import ProtectedRoute from "../components/auth/ProtectedRoute.jsx";
import AdminRoute from "../components/auth/AdminRoute.jsx";

export const AppRoutes = () => {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Patient Routes */}
        <Route
          path="/patient"
          element={
            <ProtectedRoute requiredRole="patient">
              <Navigate to="/patient/dashboard" replace />
            </ProtectedRoute>
          }
        />
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
          path="/doctor"
          element={
            <ProtectedRoute requiredRole="doctor">
              <Navigate to="/doctor/dashboard" replace />
            </ProtectedRoute>
          }
        />
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

        {/* Secretary Routes */}
        <Route
          path="/secretary"
          element={
            <ProtectedRoute requiredRole="secretary">
              <Navigate to="/secretary/dashboard" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/secretary/dashboard"
          element={
            <ProtectedRoute requiredRole="secretary">
              <SecretaryDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/secretary/appointments"
          element={
            <ProtectedRoute requiredRole="secretary">
              <SecretaryAppointmentsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/secretary/appointments/new"
          element={
            <ProtectedRoute requiredRole="secretary">
              <SecretaryCreateAppointment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/secretary/patients"
          element={
            <ProtectedRoute requiredRole="secretary">
              <SecretaryPatientsList />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Navigate to="/admin/dashboard" replace />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/doctors"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <AdminRoute>
              <AdminAnalyticsPage />
            </AdminRoute>
          }
        />

        {/* 404 Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};
