"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  clearAllNotifications,
  getUserNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type SerializedNotification,
} from "@/lib/notification-actions";
import { playNotificationSound } from "@/lib/notification-sound";
import { Button } from "@/components/ui/Button";
import { cn, formatDate } from "@/lib/utils";
import { Bell, CheckCheck, Trash2 } from "lucide-react";

const POLL_MS = 45_000;
const SESSION_TOAST_KEY = "exhibitor-schedule-notif-toast";

type Props = {
  initialUnreadCount?: number;
  schedulesTabId?: string;
  variant?: "hero" | "header";
};

function normalizeNotificationMessage(message: string) {
  return message.replace(/\bItinerary\b/g, "Schedules");
}

function normalizeScheduleLink(link: string | null, schedulesTabId: string) {
  if (!link) return `/exhibitor?tab=${schedulesTabId}`;
  return link.replace(/tab=itinerary\b/, `tab=${schedulesTabId}`);
}

export function NotificationBell({
  initialUnreadCount = 0,
  schedulesTabId = "schedules",
  variant = "hero",
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<SerializedNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [loading, setLoading] = useState(false);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);

  const showScheduleToast = useCallback(
    (row: SerializedNotification) => {
      const href = normalizeScheduleLink(row.link, schedulesTabId);
      toast.info(row.title, {
        description: row.message,
        duration: 10_000,
        action: {
          label: "View schedules",
          onClick: () => {
            if (!row.isRead) void markNotificationRead(row.id);
            router.push(href);
          },
        },
      });
    },
    [router, schedulesTabId]
  );

  const applyNotifications = useCallback(
    (rows: SerializedNotification[], unread: number, options?: { announceNew?: boolean }) => {
      setNotifications(rows);
      setUnreadCount(unread);

      if (!initializedRef.current) {
        rows.forEach((row) => seenIdsRef.current.add(row.id));
        initializedRef.current = true;

        if (unread > 0 && typeof window !== "undefined" && !sessionStorage.getItem(SESSION_TOAST_KEY)) {
          sessionStorage.setItem(SESSION_TOAST_KEY, "1");
          playNotificationSound();
          toast.info(
            unread === 1 ? "You have 1 new schedule update" : `You have ${unread} schedule updates`,
            {
              description: "Tour, travel, and event timings may have changed.",
              duration: 10_000,
              action: {
                label: "Open schedules",
                onClick: () => router.push(`/exhibitor?tab=${schedulesTabId}`),
              },
            }
          );
        }
        return;
      }

      if (!options?.announceNew) return;

      const freshUnread = rows.filter((row) => !row.isRead && !seenIdsRef.current.has(row.id));
      if (freshUnread.length === 0) return;

      playNotificationSound();
      for (const row of freshUnread.slice(0, 3)) {
        seenIdsRef.current.add(row.id);
        showScheduleToast(row);
      }
      if (freshUnread.length > 3) {
        toast.info(`${freshUnread.length - 3} more schedule updates`, {
          action: {
            label: "View all",
            onClick: () => setOpen(true),
          },
        });
      }
    },
    [router, schedulesTabId, showScheduleToast]
  );

  const load = useCallback(
    async (options?: { announceNew?: boolean }) => {
      setLoading(true);
      try {
        const data = await getUserNotifications();
        applyNotifications(data.notifications, data.unreadCount, options);
      } finally {
        setLoading(false);
      }
    },
    [applyNotifications]
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const interval = window.setInterval(() => void load({ announceNew: true }), POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void load({ announceNew: true });
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  const handleOpen = () => {
    setOpen((value) => !value);
    if (!open) void load();
  };

  const handleRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications((rows) =>
      rows.map((row) => (row.id === id ? { ...row, isRead: true } : row))
    );
    setUnreadCount((count) => Math.max(0, count - 1));
  };

  const handleReadAll = async () => {
    await markAllNotificationsRead();
    setNotifications((rows) => rows.map((row) => ({ ...row, isRead: true })));
    setUnreadCount(0);
  };

  const handleClearAll = async () => {
    const result = await clearAllNotifications();
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setNotifications([]);
    setUnreadCount(0);
    seenIdsRef.current.clear();
    setOpen(false);
    toast.success("Notifications cleared");
  };

  const isHeader = variant === "header";

  return (
    <div className="relative shrink-0">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(
          "relative gap-1.5",
          isHeader
            ? "h-9 border-white/25 bg-white/10 px-2.5 text-white shadow-sm hover:bg-white/20 sm:px-3"
            : "h-9 border-alabaster/20 bg-alabaster/10 text-alabaster hover:bg-alabaster/20"
        )}
        onClick={handleOpen}
        aria-expanded={open}
        aria-label="Schedule notifications"
      >
        <Bell className="h-4 w-4" />
        <span className={cn("font-medium", isHeader ? "hidden sm:inline" : "hidden sm:inline")}>
          Notifications
        </span>
        {unreadCount > 0 ? (
          <span
            className={cn(
              "absolute flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ring-2",
              isHeader ? "-right-1 -top-1 bg-amber-500 ring-espresso" : "-right-1 -top-1 bg-amber-500 ring-espresso"
            )}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </Button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[60] cursor-default bg-black/20"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-[70] mt-2 w-[min(100vw-2rem,24rem)] overflow-hidden rounded-xl border border-border bg-card text-foreground shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/30 px-3 py-2.5">
              <p className="text-sm font-semibold text-foreground">Schedule notifications</p>
              <div className="flex items-center gap-1">
                {unreadCount > 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs text-foreground"
                    onClick={() => void handleReadAll()}
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark read
                  </Button>
                ) : null}
                {notifications.length > 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive"
                    onClick={() => void handleClearAll()}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Clear all
                  </Button>
                ) : null}
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto bg-card">
              {loading && notifications.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">Loading…</p>
              ) : notifications.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No schedule notifications yet.
                </p>
              ) : (
                <ul>
                  {notifications.map((row) => (
                    <li key={row.id}>
                      <Link
                        href={normalizeScheduleLink(row.link, schedulesTabId)}
                        onClick={() => {
                          if (!row.isRead) void handleRead(row.id);
                          setOpen(false);
                        }}
                        className={cn(
                          "block border-b border-border/60 px-3 py-2.5 transition-colors hover:bg-muted/50",
                          !row.isRead && "bg-champagne/15"
                        )}
                      >
                        <p className="text-sm font-semibold text-foreground">{row.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {normalizeNotificationMessage(row.message)}
                        </p>
                        <time className="mt-1 block text-[10px] text-muted-foreground">
                          {formatDate(row.createdAt, "MMM d, yyyy · h:mm a")}
                        </time>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
