import { useState } from "react";
import { motion } from "framer-motion";
import { Header, Sidebar, Footer } from "./Navigation";

// Main layout wrapper
// userType controls the sidebar navigation for patient, doctor, or secretary users
export const MainLayout = ({ children, userType = "patient" }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 transition-colors duration-300 ease-in-out dark:bg-slate-950 dark:text-slate-100">
      <Header />
      <div className="flex flex-1 overflow-x-hidden">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          userType={userType}
        />
        <main className="flex-1 bg-slate-50 md:pl-72">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="fixed bottom-6 right-6 z-30 rounded-full bg-blue-600 p-3 text-white shadow-lg md:hidden"
          >
            ☰
          </button>
          <motion.div
            className="w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {children}
          </motion.div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

// Authentication layout (for login/register pages)
export const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </div>
  );
};
