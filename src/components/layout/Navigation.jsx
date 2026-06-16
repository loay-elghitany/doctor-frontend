import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Home,
  CalendarDays,
  FolderOpen,
  PlusCircle,
  LogOut,
  Menu,
  LayoutDashboard,
  Sun,
  Moon,
} from "lucide-react";
import { useCurrentRole } from "../../hooks/useCurrentRole";
import { useUnifiedLogout } from "../../hooks/useUnifiedLogout";
import { NotificationBell } from "../NotificationBell";
import { useTranslation } from "react-i18next";

const MotionLink = motion.create(Link);

// Language toggle component
const LanguageToggle = () => {
  const { t } = useTranslation();
  const { i18n } = useTranslation();
  const current = (i18n?.language || "en").split("-")[0];
  const label = current === "ar" ? "English" : "العربية";
  const handleToggle = () => {
    const newLng = current === "ar" ? "en" : "ar";
    try {
      i18n.changeLanguage(newLng);
      localStorage.setItem("i18nextLng", newLng);
    } catch (e) {
      console.error("Failed to change language", e);
    }
  };
  return (
    <button
      onClick={handleToggle}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
      aria-label={t(
        "components_layout_Navigation.attr_aria_label_toggle_language",
      )}
      title={label}
    >
      {label}
    </button>
  );
};

// Header component
export const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState("light");
  const { t } = useTranslation();
  const { role, isAdmin, isAuthenticated } = useCurrentRole();
  const { handleLogout } = useUnifiedLogout();

  const roleNavItems = {
    patient: [
      { path: "/patient/dashboard", label: "dashboard" },
      { path: "/patient/appointments/new", label: "book_appointment" },
    ],

    doctor: [
      { path: "/doctor/dashboard", label: "dashboard" },
      { path: "/doctor/appointments", label: "appointments" },
      { path: "/doctor/patient-records", label: "patients" },
      { path: "/doctor/clinic-profile", label: "clinic_profile" },
    ],

    secretary: [
      { path: "/secretary/dashboard", label: "dashboard" },
      { path: "/secretary/appointments", label: "appointments" },
      { path: "/secretary/patients", label: "patients" },
    ],

    admin: [
      { path: "/admin/dashboard", label: "dashboard" },
      { path: "/admin/doctors", label: "doctors" },
      { path: "/admin/analytics", label: "analytics" },
    ],
  };

  const navItems = isAuthenticated
    ? isAdmin
      ? roleNavItems.admin
      : (roleNavItems[role] ?? [{ path: "/login", label: "dashboard" }])
    : [{ path: "/login", label: "login" }];

  useEffect(() => {
    const savedTheme = localStorage.getItem("clinic-theme");
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia?.("(prefers-color-scheme: dark)")?.matches) {
      setTheme("dark");
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("clinic-theme", theme);
  }, [theme]);

  // handleLogout is now provided by useUnifiedLogout hook

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
          {t("components_layout_Navigation.text_clinicsaas")}
        </Link>

        <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-slate-600">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="hover:text-slate-900 transition-colors"
            >
              {t(item.label)}
            </Link>
          ))}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            aria-label={t(
              "components_layout_Navigation.attr_aria_label_toggle_theme",
            )}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>
          {/* Language toggle */}
          <LanguageToggle />
          {isAuthenticated && <NotificationBell />}
        </nav>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden inline-flex items-center justify-center rounded-2xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
        >
          <Menu className="h-6 w-6" />
        </button>

        {isOpen && (
          <div className="absolute right-6 top-20 w-56 rounded-3xl border border-slate-200 bg-white p-4 shadow-xl md:hidden">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="block rounded-2xl px-4 py-3 text-slate-700 hover:bg-slate-50"
                onClick={() => setIsOpen(false)}
              >
                {t(item.label)}
              </Link>
            ))}
            {isAuthenticated && (
              <>
                <div className="flex items-center justify-center py-2">
                  <NotificationBell />
                </div>
                <div className="flex items-center justify-center py-2">
                  <LanguageToggle />
                </div>
                <button
                  onClick={handleLogout}
                  className="mt-3 flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-left text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" /> {t("logout")}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

// Sidebar component
export const Sidebar = ({
  isOpen,
  onClose,
  userType: _userType = "patient",
}) => {
  const location = useLocation();
  const { t } = useTranslation();
  const { role } = useCurrentRole();
  const { handleLogout } = useUnifiedLogout();

  const patientLinks = [
    {
      id: "dashboard",
      path: "/patient/dashboard",
      label: "dashboard",
      icon: Home,
    },
    {
      id: "new-appointment",
      path: "/patient/appointments/new",
      label: "book_appointment",
      icon: PlusCircle,
    },
  ];

  const doctorLinks = [
    {
      id: "dashboard",
      path: "/doctor/dashboard",
      label: "dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "appointments",
      path: "/doctor/appointments",
      label: "appointments",
      icon: CalendarDays,
    },
    {
      id: "patient-records",
      path: "/doctor/patient-records",
      label: "patients",
      icon: FolderOpen,
    },
    {
      id: "clinic-profile",
      path: "/doctor/clinic-profile",
      label: "clinic_profile",
      icon: LayoutDashboard,
    },
  ];

  const secretaryLinks = [
    {
      id: "dashboard",
      path: "/secretary/dashboard",
      label: "dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "appointments",
      path: "/secretary/appointments",
      label: "appointments",
      icon: CalendarDays,
    },
    {
      id: "patients",
      path: "/secretary/patients",
      label: "patients",
      icon: FolderOpen,
    },
    {
      id: "new-appointment",
      path: "/secretary/appointments/new",
      label: "book_appointment",
      icon: PlusCircle,
    },
  ];

  const adminLinks = [
    {
      id: "dashboard",
      path: "/admin/dashboard",
      label: "dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "doctors",
      path: "/admin/doctors",
      label: "doctors",
      icon: FolderOpen,
    },
    {
      id: "analytics",
      path: "/admin/analytics",
      label: "analytics",
      icon: CalendarDays,
    },
  ];

  const links =
    role === "doctor"
      ? doctorLinks
      : role === "secretary"
        ? secretaryLinks
        : role === "admin"
          ? adminLinks
          : role === "patient"
            ? patientLinks
            : [];

  // handleLogout is now provided by useUnifiedLogout hook

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
              <p className="text-sm text-slate-400">
                {t("components_layout_Navigation.text_clinic_platform")}
              </p>
              <p className="font-semibold">
                {t("components_layout_Navigation.text_saas_dashboard")}
              </p>
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
                whileHover={{ x: 3, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 280, damping: 24 }}
                className={`relative flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-[0_0_30px_rgba(59,130,246,0.22)]"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span
                  className={`absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-full bg-blue-400 transition-all ${
                    isActive ? "opacity-100" : "opacity-0"
                  }`}
                />

                <Icon className="h-5 w-5" />
                {t(link.label)}
              </MotionLink>
            );
          })}

          <button
            onClick={handleLogout}
            className="mt-4 flex w-full items-center gap-3 rounded-3xl bg-slate-800 px-4 py-3 text-left text-sm font-medium text-red-300 transition hover:bg-slate-700"
          >
            <LogOut className="h-5 w-5" />
            {t("logout")}
          </button>
        </nav>
      </aside>
    </>
  );
};

// Footer component
export const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="bg-gray-900 text-gray-300 mt-12">
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold text-white mb-4">
              {t("components_layout_Navigation.text_clinicsaas_1")}
            </h3>
            <p className="text-sm">
              {t(
                "components_layout_Navigation.text_multi_doctor_clinic_management_system",
              )}
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">
              {t("components_layout_Navigation.text_quick_links")}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white">
                  {t("components_layout_Navigation.text_about")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  {t("components_layout_Navigation.text_contact")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  {t("components_layout_Navigation.text_privacy")}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">
              {t("components_layout_Navigation.text_support")}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white">
                  {t("components_layout_Navigation.text_help_center")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  {t("components_layout_Navigation.text_documentation")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  {t("components_layout_Navigation.text_faq")}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>
            {t(
              "components_layout_Navigation.text_2026_clinicsaas_all_rights_reserved",
            )}
          </p>
        </div>
      </div>
    </footer>
  );
};
