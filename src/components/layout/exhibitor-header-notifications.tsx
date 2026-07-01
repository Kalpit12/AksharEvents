"use client";

import { NotificationBell } from "@/components/notifications/notification-bell";

export function ExhibitorHeaderNotifications({ initialUnreadCount = 0 }: { initialUnreadCount?: number }) {
  return (
    <NotificationBell
      variant="header"
      schedulesTabId="schedules"
      initialUnreadCount={initialUnreadCount}
    />
  );
}
