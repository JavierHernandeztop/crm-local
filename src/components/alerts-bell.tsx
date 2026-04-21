"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck, TriangleAlert, UserPlus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Notification } from "@/lib/notifications";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/actions/notifications";

export type BellData = {
  notifications: Notification[];
  unreadCount: number;
};

export function AlertsBell({ data }: { data: BellData }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const handleMarkOne = (id: number) => {
    startTransition(async () => {
      await markNotificationRead(id);
      router.refresh();
    });
  };
  const handleMarkAll = () => {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  };

  const { notifications, unreadCount } = data;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notificaciones (${unreadCount})`}
        >
          <Bell className="h-5 w-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[22rem] p-0 max-h-[80vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="font-semibold text-sm">Notificaciones</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {unreadCount > 0
                ? `${unreadCount} sin leer`
                : "Todas al día"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAll}
              className="text-xs"
            >
              <CheckCheck className="h-4 w-4" />
              Marcar todo
            </Button>
          )}
        </div>
        <div className="overflow-y-auto flex-1">
          {notifications.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              No hay notificaciones todavía.
            </div>
          ) : (
            <ul>
              <AnimatePresence initial={false}>
                {notifications.map((n) => (
                  <NotificationRow
                    key={n.id}
                    n={n}
                    onMarkRead={handleMarkOne}
                  />
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function NotificationRow({
  n,
  onMarkRead,
}: {
  n: Notification;
  onMarkRead: (id: number) => void;
}) {
  const unread = !n.read_at;
  const toneClass = {
    info: "bg-muted-foreground",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-destructive",
  }[n.severity];

  const Icon =
    n.kind === "new_contact"
      ? UserPlus
      : n.kind === "stale_7"
        ? TriangleAlert
        : Bell;

  const content = (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-accent/60",
        unread ? "bg-accent/20" : "",
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white",
          toneClass,
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{n.title}</div>
        {n.body && (
          <div className="text-xs text-muted-foreground mt-0.5">{n.body}</div>
        )}
        <div className="text-[10px] text-muted-foreground mt-1">
          {timeAgo(n.created_at)}
        </div>
      </div>
      {unread && (
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground p-1 rounded"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onMarkRead(n.id);
          }}
          aria-label="Marcar como leída"
          title="Marcar como leída"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.18 }}
      className="border-b border-border last:border-b-0"
    >
      {n.contact_id ? (
        <Link href={`/contactos/${n.contact_id}`} className="block">
          {content}
        </Link>
      ) : (
        content
      )}
    </motion.li>
  );
}

function timeAgo(iso: string): string {
  const d = new Date(iso.replace(" ", "T") + "Z");
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "hace un momento";
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `hace ${days}d`;
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
  });
}
