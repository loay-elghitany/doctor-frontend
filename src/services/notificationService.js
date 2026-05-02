import api from "./api";

export const notificationService = {
  // Get in-app notifications
  getInAppNotifications: (params = {}) =>
    api.get("/notifications/inapp", { params }),

  // Get unread count
  getUnreadCount: () =>
    api.get("/notifications/inapp/unread-count"),

  // Mark single notification as read
  markAsRead: (id) =>
    api.patch(`/notifications/inapp/${id}/read`),

  // Mark all notifications as read
  markAllAsRead: () =>
    api.patch("/notifications/inapp/mark-all-read"),

  // Delete notification
  deleteNotification: (id) =>
    api.delete(`/notifications/inapp/${id}`),
};
