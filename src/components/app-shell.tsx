"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Kanban,
  Trophy,
  Settings,
  Menu,
  X,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { AlertsBell, type BellData } from "@/components/alerts-bell";
import type { Settings as SettingsType } from "@/lib/types";

function BusinessBadge({ settings }: { settings: SettingsType }) {
  if (settings.logo_path) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-md overflow-hidden bg-background border border-border shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={settings.logo_path}
          alt={settings.business_name}
          className="h-full w-full object-contain"
        />
      </div>
    );
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold shadow-sm shrink-0">
      {settings.business_name.charAt(0).toUpperCase()}
    </div>
  );
}

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/contactos", label: "Contactos", icon: Users },
  { href: "/clientes", label: "Clientes cerrados", icon: Trophy },
  { href: "/analitica", label: "Analítica", icon: BarChart3 },
  { href: "/ajustes", label: "Ajustes", icon: Settings },
];

export function AppShell({
  settings,
  bellData,
  children,
}: {
  settings: SettingsType;
  bellData: BellData;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium border-l-[3px] border-l-transparent transition duration-150",
              active
                ? "border-l-primary bg-accent/40 text-foreground"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-border sidebar-gradient">
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          <BusinessBadge settings={settings} />
          <div className="font-semibold truncate">
            {settings.business_name}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <NavLinks />
        </div>
        <div className="border-t border-border p-3 text-xs text-muted-foreground">
          CRM Local · v1.0
        </div>
      </aside>

      {/* Mobile topbar */}
      <header className="lg:hidden sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-background/80 backdrop-blur px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex-1 font-semibold truncate">
          {settings.business_name}
        </div>
        <AlertsBell data={bellData} />
        <ThemeToggle />
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 bg-card shadow-xl flex flex-col animate-in-fade">
            <div className="flex h-16 items-center justify-between border-b border-border px-5">
              <div className="flex items-center gap-2">
                <BusinessBadge settings={settings} />
                <div className="font-semibold truncate">
                  {settings.business_name}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <NavLinks onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        <header className="hidden lg:flex sticky top-0 z-30 h-16 items-center justify-end gap-2 border-b border-border bg-background/70 backdrop-blur px-6">
          <AlertsBell data={bellData} />
          <ThemeToggle />
        </header>
        <main className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
