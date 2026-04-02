import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import {
  Home,
  CalendarDays,
  FolderOpen,
  PlusCircle,
  LogOut,
  Menu,
  LayoutDashboard,
} from "lucide-react";

const MotionLink = motion(Link);

// Header component
export const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-3 text-xl font-semibold text-slate-900"
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            C
          </span>
          ClinicSaaS
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link
            to="/patient/dashboard"
            className="hover:text-slate-900 transition-colors"
          >
            Patient
          </Link>
          <Link
            to="/doctor/dashboard"
            className="hover:text-slate-900 transition-colors"
          >
            Doctor
          </Link>
        </nav>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden inline-flex items-center justify-center rounded-2xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
        >
          <Menu className="h-6 w-6" />
        </button>

        {isOpen && (
          <div className="absolute right-6 top-20 w-56 rounded-3xl border border-slate-200 bg-white p-4 shadow-xl md:hidden">
            <Link
              to="/patient/dashboard"
              className="block rounded-2xl px-4 py-3 text-slate-700 hover:bg-slate-50"
              onClick={() => setIsOpen(false)}
            >
              Patient
            </Link>
            <Link
              to="/doctor/dashboard"
              className="block rounded-2xl px-4 py-3 text-slate-700 hover:bg-slate-50"
              onClick={() => setIsOpen(false)}
            >
              Doctor
            </Link>
            <button
              onClick={handleLogout}
              className="mt-3 flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-left text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

// Sidebar component
export const Sidebar = ({ isOpen, onClose, userType = "patient" }) => {
  const location = useLocation();
  const { logout } = useAuth();

  const patientLinks = [
    {
      id: "dashboard",
      path: "/patient/dashboard",
      label: "Dashboard",
      icon: Home,
    },
    {
      id: "new-appointment",
      path: "/patient/appointments/new",
      label: "New Appointment",
      icon: PlusCircle,
    },
  ];

  const doctorLinks = [
    {
      id: "dashboard",
      path: "/doctor/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "appointments",
      path: "/doctor/appointments",
      label: "All Appointments",
      icon: CalendarDays,
    },
    {
      id: "patient-records",
      path: "/doctor/patient-records",
      label: "Patient Records",
      icon: FolderOpen,
    },
  ];

  const links = userType === "doctor" ? doctorLinks : patientLinks;

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 w-72 h-screen bg-slate-950 text-white shadow-2xl transition-transform duration-300 md:relative md:top-0 md:translate-x-0 z-40 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-6 py-6 border-b border-slate-800">
          <div className="inline-flex items-center gap-3 rounded-3xl bg-slate-900 px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500 text-white">
              <Home className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Clinic platform</p>
              <p className="font-semibold">SaaS Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="px-4 py-6 space-y-2">
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            const Icon = link.icon;
            return (
              <MotionLink
                key={link.id}
                to={link.path}
                onClick={onClose}
                layout
                whileHover={{ x: 3 }}
                transition={{ type: "spring", stiffness: 280, damping: 24 }}
                className={`flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-[0_0_0_1px_rgba(59,130,246,0.25)]"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" />
                {link.label}
              </MotionLink>
            );
          })}

          <button
            onClick={handleLogout}
            className="mt-4 flex w-full items-center gap-3 rounded-3xl bg-slate-800 px-4 py-3 text-left text-sm font-medium text-red-300 transition hover:bg-slate-700"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </nav>
      </aside>
    </>
  );
};

// Footer component
export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-12">
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold text-white mb-4">ClinicSaaS</h3>
            <p className="text-sm">Multi-doctor clinic management system.</p>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Privacy
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  FAQ
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; 2026 ClinicSaaS. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
