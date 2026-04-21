import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getSettings } from "@/lib/queries";
import {
  countUnread,
  generateStaleNotifications,
  listNotifications,
} from "@/lib/notifications";

export const dynamic = "force-dynamic";

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = getSettings();
  if (!settings.onboarded) {
    redirect("/bienvenida");
  }
  generateStaleNotifications();
  const notifications = listNotifications(50);
  const unreadCount = countUnread();

  return (
    <AppShell
      settings={settings}
      bellData={{ notifications, unreadCount }}
    >
      {children}
    </AppShell>
  );
}
