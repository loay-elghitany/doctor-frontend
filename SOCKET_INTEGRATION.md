# Socket.io Frontend Integration Guide

## 1. Install Dependencies

```bash
npm install socket.io-client sonner
```

## 2. Update main.jsx

Wrap your app with `SocketProvider` and add `Toaster` for notifications:

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "sonner"; // Add this import
import { AppRoutes } from "./routes";
import { AuthProvider } from "./context/AuthContext";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import { SocketProvider } from "./context/SocketContext"; // Add this import
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AdminAuthProvider>
        <AuthProvider>
          <SocketProvider> {/* Wrap with SocketProvider */}
            <AppRoutes />
            <Toaster 
              position="top-left"
              richColors
              closeButton
              style={{ direction: "rtl" }}
            />
          </SocketProvider>
        </AuthProvider>
      </AdminAuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
```

## 3. Use NotificationBell in Header/Navbar

Add the `NotificationBell` component to your dashboard headers:

```jsx
import { NotificationBell } from "./components/NotificationBell";

const DoctorDashboard = () => {
  return (
    <div>
      <header className="flex items-center justify-between p-4">
        <h1>Dashboard</h1>
        <NotificationBell /> {/* Add this */}
      </header>
      {/* Rest of dashboard */}
    </div>
  );
};
```

## 4. Environment Variables

Add to your `.env`:

```env
VITE_API_BASE_URL=https://api.mydoc90.com/api
```

## Features

- **Real-time notifications** for all user roles
- **Automatic reconnection** on disconnect
- **Room-based targeting**:
  - Doctors/Secretaries → `clinic_X_staff`
  - Patients → `patient_X`
- **Arabic toast messages** with RTL support
- **Animated notification bell** with unread badge
- **Persistent notification history** (last 50)

## Notification Types

| Type | Icon | Description |
|------|------|-------------|
| NEW_PATIENT | 👤 Green | New patient registered |
| NEW_APPOINTMENT_STAFF | 📅 Blue | New appointment for staff |
| APPOINTMENT_CONFIRMED | ✅ Emerald | Patient appointment confirmation |
