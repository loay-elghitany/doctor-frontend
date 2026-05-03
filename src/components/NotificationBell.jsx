import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  X,
  Check,
  UserPlus,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Trash2,
  DollarSign,
} from "lucide-react";
import { useSocket } from "../context/SocketContext";

const notificationIcons = {
  NEW_PATIENT_REGISTERED: {
    icon: UserPlus,
    color: "bg-green-500",
    text: "text-green-600",
  },
  NEW_APPOINTMENT: {
    icon: Calendar,
    color: "bg-blue-500",
    text: "text-blue-600",
  },
  APPOINTMENT_CONFIRMED: {
    icon: Check,
    color: "bg-emerald-500",
    text: "text-emerald-600",
  },
  APPOINTMENT_ACCEPTED: {
    icon: Check,
    color: "bg-emerald-500",
    text: "text-emerald-600",
  },
  APPOINTMENT_REJECTED: {
    icon: XCircle,
    color: "bg-red-500",
    text: "text-red-600",
  },
  APPOINTMENT_RESCHEDULED: {
    icon: Clock,
    color: "bg-orange-500",
    text: "text-orange-600",
  },
  APPOINTMENT_COMPLETED: {
    icon: CheckCircle,
    color: "bg-teal-500",
    text: "text-teal-600",
  },
  APPOINTMENT_CANCELLED: {
    icon: XCircle,
    color: "bg-red-500",
    text: "text-red-600",
  },
  NEW_PRESCRIPTION: {
    icon: FileText,
    color: "bg-purple-500",
    text: "text-purple-600",
  },
  NEW_MEDICAL_NOTE: {
    icon: FileText,
    color: "bg-purple-500",
    text: "text-purple-600",
  },
  APPOINTMENT_UPDATED: {
    icon: Calendar,
    color: "bg-blue-500",
    text: "text-blue-600",
  },
  NEW_PAYMENT_MADE: {
    icon: DollarSign,
    color: "bg-yellow-500", // لون مميز للفلوس
    text: "text-yellow-600",
  },

  default: { icon: Bell, color: "bg-slate-500", text: "text-slate-600" },
};

export const NotificationBell = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    clearNotifications,
    removeNotification,
    isConnected,
  } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Debug: Log when notifications change
  useEffect(() => {
    console.log(
      "[NotificationBell] Notifications updated:",
      notifications.length,
      "items",
    );
    if (notifications.length > 0) {
      console.log("[NotificationBell] Latest notification:", notifications[0]);
    }
  }, [notifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mark as read when opening
  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      markAsRead();
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    // Less than 1 minute
    if (diff < 60000) return "الآن";
    // Less than 1 hour
    if (diff < 3600000) return `منذ ${Math.floor(diff / 60000)} دقيقة`;
    // Less than 24 hours
    if (diff < 86400000) return `منذ ${Math.floor(diff / 3600000)} ساعة`;
    // More than 24 hours
    return date.toLocaleDateString("ar-SA");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button with Badge */}
      <motion.button
        onClick={handleOpen}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        aria-label="Notifications"
      >
        <Bell size={20} className={isConnected ? "" : "opacity-50"} />

        {/* Connection indicator */}
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-900 ${
            isConnected ? "bg-green-500" : "bg-red-500 animate-pulse"
          }`}
        />

        {/* Unread Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white shadow-lg"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Animated Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute left-0 top-full z-50 mt-3 w-80 overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl md:left-auto md:right-0 lg:w-96"
            style={{ direction: "rtl" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-slate-600" />
                <h3 className="font-semibold text-slate-800">الإشعارات</h3>
                {notifications.length > 0 && (
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                    {notifications.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAsRead}
                    className="flex items-center gap-1 text-xs text-blue-600 transition-colors hover:text-blue-700 font-medium"
                    title="تحديد الكل كمقروء"
                  >
                    <Check size={14} />
                    تحديد الكل
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="flex items-center gap-1 text-xs text-red-500 transition-colors hover:text-red-600"
                  >
                    <Trash2 size={14} />
                    مسح الكل
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                    <Bell size={28} className="text-slate-400" />
                  </div>
                  <p className="text-slate-500">لا توجد إشعارات جديدة</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {isConnected
                      ? "متصل بالخادم"
                      : "غير متصل - جاري المحاولة..."}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map((notification, index) => {
                    const config =
                      notificationIcons[notification.type] ||
                      notificationIcons.default;
                    const IconComponent = config.icon;
                    const isUnread = !notification.isRead;
                    const notificationId = notification._id || notification.id;

                    return (
                      <motion.div
                        key={notificationId || index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => isUnread && markAsRead(notificationId)}
                        className={`group relative flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                          isUnread ? "bg-blue-50/50" : ""
                        }`}
                      >
                        {/* Unread indicator */}
                        {isUnread && (
                          <div className="absolute right-2 top-4 w-2 h-2 rounded-full bg-blue-500" />
                        )}

                        {/* Icon */}
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.color} bg-opacity-10`}
                        >
                          <IconComponent
                            size={20}
                            className={`${config.text}`}
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pr-4">
                          <h4
                            className={`text-sm ${isUnread ? "font-bold text-slate-900" : "font-semibold text-slate-800"}`}
                          >
                            {notification.title}
                          </h4>
                          <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                            {notification.message}
                          </p>
                          <span className="mt-2 block text-xs text-slate-400">
                            {formatTime(
                              notification.timestamp || notification.createdAt,
                            )}
                          </span>
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(index);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-red-500"
                        >
                          <X size={16} />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer - Always show connection status */}
            <div className="border-t border-slate-100 bg-slate-50 px-4 py-2">
              <p
                className={`text-center text-xs ${isConnected ? "text-green-600" : "text-red-500"}`}
              >
                {isConnected
                  ? "🟢 متصل بالوقت الفعلي"
                  : "🔴 غير متصل - جاري إعادة المحاولة..."}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
