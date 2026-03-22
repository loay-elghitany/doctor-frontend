import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

// Header component
export const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-blue-600">
          ClinicSaaS
        </Link>
        <nav className="hidden md:flex gap-6">
          <Link
            to="/patient/dashboard"
            className="text-gray-700 hover:text-blue-600"
          >
            Patient
          </Link>
          <Link
            to="/doctor/dashboard"
            className="text-gray-700 hover:text-blue-600"
          >
            Doctor
          </Link>
        </nav>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-gray-700 text-2xl"
        >
          ☰
        </button>
        {isOpen && (
          <div className="absolute top-16 right-6 bg-white shadow-lg rounded-lg p-4 md:hidden">
            <Link
              to="/patient/dashboard"
              className="block py-2 text-gray-700 hover:text-blue-600"
            >
              Patient
            </Link>
            <Link
              to="/doctor/dashboard"
              className="block py-2 text-gray-700 hover:text-blue-600"
            >
              Doctor
            </Link>
            <button
              onClick={handleLogout}
              className="block w-full text-left py-2 text-red-600 hover:text-red-800"
            >
              Logout
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
    { id: "dashboard", path: "/patient/dashboard", label: "Dashboard" },
    {
      id: "new-appointment",
      path: "/patient/appointments/new",
      label: "New Appointment",
    },
  ];

  const doctorLinks = [
    { id: "dashboard", path: "/doctor/dashboard", label: "Dashboard" },
    {
      id: "appointments",
      path: "/doctor/appointments",
      label: "All Appointments",
    },
    {
      id: "patient-records",
      path: "/doctor/patient-records",
      label: "Patient Records",
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
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 w-64 h-screen bg-gray-900 text-white shadow-lg transform transition-transform md:relative md:top-0 md:translate-x-0 z-40 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <nav className="p-6">
          {links.map((link) => (
            <Link
              key={link.id}
              to={link.path}
              onClick={onClose}
              className={`block py-3 px-4 rounded-lg mb-2 transition-all ${
                location.pathname === link.path
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="w-full text-left py-3 px-4 rounded-lg mt-4 text-red-400 hover:bg-red-900 transition-all"
          >
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
