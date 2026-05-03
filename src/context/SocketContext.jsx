import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { io } from "socket.io-client";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";
import { notificationService } from "../services/notificationService";

// Get API base URL from environment
const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const SOCKET_URL = API_URL.endsWith("/api") ? API_URL.slice(0, -4) : API_URL;

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated, userRole } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);
  const audioRef = useRef(null);

  // Initialize audio element for notification sounds
  useEffect(() => {
    const audio = new Audio("/notification-sound.mp3");
    audio.preload = "auto";
    audioRef.current = audio;
  }, []);

  // Play notification sound
  const playNotificationSound = () => {
    if (audioRef.current) {
      // Reset and play
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((e) => {
        console.log(
          "[SocketContext] Audio play blocked by browser or error:",
          e.message,
        );
      });
    }
  };

  // Extract user data from AuthContext
  const getUserDataFromAuth = useCallback(() => {
    if (!user || !isAuthenticated) return null;

    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("doctorToken") ||
      localStorage.getItem("patientToken") ||
      localStorage.getItem("secretaryToken");

    if (!token) return null;

    // Build user data based on role from AuthContext
    const userData = {
      userId: user._id || user.id,
      role: userRole,
      token,
    };

    // Add role-specific fields
    if (userRole === "doctor" || userRole === "secretary") {
      userData.clinicSlug = user.clinicSlug;

      // Debug logging for secretary room issue
      if (userRole === "secretary") {
        console.log("[SocketContext] Secretary user object:", user);
        console.log("[SocketContext] Secretary clinicSlug:", user.clinicSlug);
        console.log("[SocketContext] Secretary doctorId:", user.doctorId);
      }
    } else if (userRole === "patient") {
      userData.patientId = user._id || user.id;
    }

    return userData;
  }, [user, isAuthenticated, userRole]);

  // Connect to Socket.io - reactive to Auth state
  useEffect(() => {
    const userData = getUserDataFromAuth();

    if (!userData?.token) {
      console.log("[Socket] Waiting for authentication...");
      // If socket exists but user logged out, disconnect it
      if (socketRef.current) {
        console.log("[Socket] User logged out, disconnecting...");
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // If already connected with same token, don't reconnect
    if (socketRef.current?.connected) {
      console.log("[Socket] Already connected");
      return;
    }

    console.log("[Socket] Connecting to:", SOCKET_URL);

    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["polling", "websocket"], // Start with polling for better compatibility
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      auth: { token: userData.token },
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection events
    newSocket.on("connect", () => {
      setIsConnected(true);
      console.log("[Socket] ============================================");
      console.log("[Socket] CONNECTED:", newSocket.id);

      // Log what we're about to send for authentication
      console.log("[Socket] SENDING AUTH DATA:");
      console.log("[Socket] - userId:", userData.userId);
      console.log("[Socket] - role:", userData.role);
      console.log("[Socket] - clinicSlug:", userData.clinicSlug);
      console.log("[Socket] - patientId:", userData.patientId);

      // Authenticate and join appropriate rooms
      newSocket.emit("authenticate", {
        userId: userData.userId,
        role: userData.role,
        clinicSlug: userData.clinicSlug,
        patientId: userData.patientId,
      });
      console.log("[Socket] 'authenticate' event emitted");
      console.log("[Socket] ============================================");
    });

    newSocket.on("disconnect", (reason) => {
      setIsConnected(false);
      console.log("[Socket] Disconnected:", reason);
    });

    newSocket.on("connect_error", (error) => {
      console.error("[Socket] Connection error:", error.message);
    });

    newSocket.on("reconnect", (attemptNumber) => {
      console.log("[Socket] Reconnected after", attemptNumber, "attempts");
    });

    newSocket.on("reconnect_attempt", (attemptNumber) => {
      console.log("[Socket] Reconnection attempt:", attemptNumber);
    });

    newSocket.on("authenticated", (data) => {
      console.log("[Socket] ============================================");
      console.log("[Socket] ✅ AUTHENTICATED RESPONSE FROM SERVER:");
      console.log("[Socket] - success:", data.success);
      console.log("[Socket] - role:", data.role);
      console.log("[Socket] ============================================");
    });

    newSocket.on("joined_room", (data) => {
      console.log("[Socket] ============================================");
      console.log("[Socket] ✅ JOINED ROOM RESPONSE FROM SERVER:");
      console.log("[Socket] - room:", data.room);
      console.log("[Socket] - role:", data.role);
      console.log("[Socket] - CURRENT USER'S ROOM NAME:", data.room);
      console.log("[Socket] ============================================");
    });

    newSocket.on("auth_error", (error) => {
      console.error("[Socket] Auth error:", error);
    });

    // Connection timeout check
    const connectionTimeout = setTimeout(() => {
      if (!newSocket.connected) {
        console.warn("[Socket] Connection timeout - forcing polling transport");
        newSocket.io.opts.transports = ["polling"];
      }
    }, 5000);

    // Notification handler
    newSocket.on("notification", (notification) => {
      console.log("[Socket] ============================================");
      console.log("[Socket] NOTIFICATION RECEIVED!");
      console.log("[Socket] Type:", notification.type);
      console.log("[Socket] Title:", notification.title);
      console.log("[Socket] Message:", notification.message);
      console.log("[Socket] Timestamp:", notification.timestamp);
      console.log("[Socket] Full data:", notification);
      console.log("[Socket] ============================================");

      // Add to notifications list
      setNotifications((prev) => {
        const updated = [notification, ...prev].slice(0, 50); // Keep last 50
        console.log(
          "[Socket] Notifications list updated. Count:",
          updated.length,
        );
        return updated;
      });
      setUnreadCount((prev) => prev + 1);

      // Play notification sound
      playNotificationSound();

      // Show toast notification
      try {
        toast.success(notification.title, {
          description: notification.message,
          duration: 5000,
          position: "top-left",
          style: {
            direction: "rtl",
            textAlign: "right",
          },
        });
        console.log("[Socket] Toast notification displayed successfully");
      } catch (toastError) {
        console.error("[Socket] Failed to show toast:", toastError);
      }
    });

    // Cleanup on unmount or when user logs out
    return () => {
      clearTimeout(connectionTimeout);
      // Only disconnect if user logged out (no token)
      // Don't disconnect on normal re-renders
      const currentToken =
        localStorage.getItem("token") ||
        localStorage.getItem("doctorToken") ||
        localStorage.getItem("patientToken") ||
        localStorage.getItem("secretaryToken");
      if (!currentToken) {
        newSocket.disconnect();
      }
    };
  }, [user, isAuthenticated, userRole, getUserDataFromAuth]); // Reactive to Auth state

  // Fetch notifications from API (for initial load)
  const fetchNotificationsFromAPI = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      console.log("[SocketContext] Fetching notifications from API...");
      const response = await notificationService.getInAppNotifications({
        limit: 20,
      });

      if (response.data?.success) {
        const { notifications: apiNotifications, unreadCount: apiUnreadCount } =
          response.data.data;
        console.log(
          "[SocketContext] Fetched",
          apiNotifications.length,
          "notifications, unread:",
          apiUnreadCount,
        );

        // Merge with existing (socket) notifications, avoiding duplicates by ID
        setNotifications((prev) => {
          const existingIds = new Set(prev.map((n) => n.id || n._id));
          const newNotifications = apiNotifications.filter(
            (n) => !existingIds.has(n._id),
          );
          return [...newNotifications, ...prev].slice(0, 50);
        });

        setUnreadCount(apiUnreadCount || 0);
      }
    } catch (error) {
      console.error(
        "[SocketContext] Failed to fetch notifications:",
        error.message,
      );
    }
  }, [isAuthenticated]);

  // Mark single notification as read (API + local state)
  const markAsRead = useCallback(async (notificationId) => {
    if (!notificationId) {
      // Mark all as read
      try {
        await notificationService.markAllAsRead();
        setUnreadCount(0);
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true, readAt: new Date() })),
        );
      } catch (error) {
        console.error(
          "[SocketContext] Failed to mark all as read:",
          error.message,
        );
      }
      return;
    }

    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId || n.id === notificationId
            ? { ...n, isRead: true, readAt: new Date() }
            : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("[SocketContext] Failed to mark as read:", error.message);
    }
  }, []);

  // Clear notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Remove single notification
  const removeNotification = useCallback((index) => {
    setNotifications((prev) => prev.filter((_, i) => i !== index));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  // Fetch notifications when socket connects and user is authenticated
  useEffect(() => {
    if (isConnected && isAuthenticated) {
      fetchNotificationsFromAPI();
    }
  }, [isConnected, isAuthenticated, fetchNotificationsFromAPI]);

  const value = {
    socket,
    isConnected,
    notifications,
    unreadCount,
    markAsRead,
    clearNotifications,
    removeNotification,
    fetchNotifications: fetchNotificationsFromAPI,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export default SocketContext;
