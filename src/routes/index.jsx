import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import ProtectedRoute from "../components/auth/ProtectedRoute.jsx";
import AdminRoute from "../components/auth/AdminRoute.jsx";
import { LoadingSpinner } from "../components/ui/PremiumUI.jsx";
import { isTenantSubdomain } from "../utils/subdomain.js";

const Home = React.lazy(() =>
  import("../pages/Auth.jsx").then((m) => ({ default: m.Home })),
);
const Login = React.lazy(() =>
  import("../pages/Auth.jsx").then((m) => ({ default: m.Login })),
);
const Register = React.lazy(() =>
  import("../pages/Register.jsx").then((m) => ({ default: m.Register })),
);
const PatientDashboard = React.lazy(() =>
  import("../pages/PatientDashboard.jsx").then((m) => ({
    default: m.PatientDashboard,
  })),
);
const CreateAppointment = React.lazy(() =>
  import("../pages/CreateAppointment.jsx").then((m) => ({
    default: m.CreateAppointment,
  })),
);
const ChooseAppointmentTime = React.lazy(() =>
  import("../pages/ChooseAppointmentTime.jsx").then((m) => ({
    default: m.ChooseAppointmentTime,
  })),
);
const DoctorDashboard = React.lazy(() =>
  import("../pages/DoctorDashboard.jsx").then((m) => ({
    default: m.DoctorDashboard,
  })),
);
const DoctorAppointmentsList = React.lazy(() =>
  import("../pages/DoctorAppointmentsList.jsx").then((m) => ({
    default: m.DoctorAppointmentsList,
  })),
);
const DoctorPatientRecords = React.lazy(() =>
  import("../pages/DoctorPatientRecords.jsx").then((m) => ({
    default: m.DoctorPatientRecords,
  })),
);
const ProposeAppointmentTimes = React.lazy(() =>
  import("../pages/ProposeAppointmentTimes.jsx").then((m) => ({
    default: m.ProposeAppointmentTimes,
  })),
);
const AdminLogin = React.lazy(() =>
  import("../pages/AdminLogin.jsx").then((m) => ({ default: m.AdminLogin })),
);
const AdminDashboard = React.lazy(() =>
  import("../pages/AdminDashboard.jsx").then((m) => ({
    default: m.AdminDashboard,
  })),
);
const AdminAnalyticsPage = React.lazy(() =>
  import("../pages/AdminAnalyticsPage.jsx").then((m) => ({
    default: m.AdminAnalyticsPage,
  })),
);
const SecretaryDashboard = React.lazy(() =>
  import("../pages/SecretaryDashboard.jsx").then((m) => ({
    default: m.SecretaryDashboard,
  })),
);
const SecretaryAppointmentsList = React.lazy(() =>
  import("../pages/SecretaryAppointmentsList.jsx").then((m) => ({
    default: m.SecretaryAppointmentsList,
  })),
);
const SecretaryAppointmentDetails = React.lazy(() =>
  import("../pages/SecretaryAppointmentDetails.jsx").then((m) => ({
    default: m.SecretaryAppointmentDetails,
  })),
);
const SecretaryPatientsList = React.lazy(() =>
  import("../pages/SecretaryPatientsList.jsx").then((m) => ({
    default: m.SecretaryPatientsList,
  })),
);
const SecretaryPatientDetails = React.lazy(() =>
  import("../pages/SecretaryPatientDetails.jsx").then((m) => ({
    default: m.SecretaryPatientDetails,
  })),
);
const SecretaryCreateAppointment = React.lazy(() =>
  import("../pages/SecretaryCreateAppointment.jsx").then((m) => ({
    default: m.SecretaryCreateAppointment,
  })),
);
const DoctorClinicProfile = React.lazy(() =>
  import("../pages/DoctorClinicProfile.jsx").then((m) => ({
    default: m.DoctorClinicProfile,
  })),
);
const DoctorLandingPage = React.lazy(() =>
  import("../components/DoctorLandingPage.jsx").then((m) => ({
    default: m.DoctorLandingPage,
  })),
);

export const AppRoutes = () => {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AnimatedRoutes />
    </Router>
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();
  const renderTenantLanding = isTenantSubdomain();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <React.Suspense fallback={<LoadingSpinner size="lg" />}>
        <Routes location={location} key={location.pathname}>
          {/* Public Routes */}
          <Route
            path="/"
            element={renderTenantLanding ? <DoctorLandingPage /> : <Home />}
          />
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
          <Route
            path="/doctor/patient-records/:patientId"
            element={
              <ProtectedRoute requiredRole="doctor">
                <DoctorPatientRecords />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/clinic-profile"
            element={
              <ProtectedRoute requiredRole="doctor">
                <DoctorClinicProfile />
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
            path="/secretary/appointments/:id"
            element={
              <ProtectedRoute requiredRole="secretary">
                <SecretaryAppointmentDetails />
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
          <Route
            path="/secretary/patients/:id"
            element={
              <ProtectedRoute requiredRole="secretary">
                <SecretaryPatientDetails />
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
      </React.Suspense>
    </AnimatePresence>
  );
};
