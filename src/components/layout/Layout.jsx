import { useState } from "react";
import { Header, Sidebar, Footer } from "./Navigation";

// Main layout wrapper
export const MainLayout = ({ children, userType = "patient" }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex flex-1">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          userType={userType}
        />
        <main className="flex-1 md:ml-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden fixed bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full shadow-lg z-30"
          >
            ☰
          </button>
          <div className="container mx-auto px-6 py-8">{children}</div>
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
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
};
