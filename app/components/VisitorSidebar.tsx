"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarDays,
  ClipboardList,
  House,
  LogOut,
  ShieldCheck,
  UserRound,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

type SessionUser = {
  name?: string;
  username?: string;
  email?: string;
};

type VisitorSidebarProps = {
  sessionUser?: SessionUser | null;
  isCollapsed?: boolean;
};

type MenuItem = {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
};

const menuItems: MenuItem[] = [
  { name: "Dashboard", path: "/visitor-page", icon: House },
  { name: "Appointments", path: "/visitor-page/appointments", icon: CalendarDays, badge: 2 },
  { name: "Visit Status", path: "/visitor-page/status", icon: ShieldCheck },
  { name: "Requirements", path: "/visitor-page/requirements", icon: ClipboardList },
  { name: "Announcements", path: "/visitor-page/announcements", icon: Bell, badge: 3 },
];

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export default function VisitorSidebar({ sessionUser, isCollapsed = false }: VisitorSidebarProps) {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);

  const effectiveCollapsed = isCollapsed && !isHovered;

  return (
    <aside
      className={cn(
        "relative flex h-screen flex-col bg-linear-to-b from-[#f8fbff] via-[#f4f8ff] to-[#eef4ff] transition-all duration-300 ease-in-out",
        effectiveCollapsed ? "w-[72px]" : "w-64",
        "border-r border-[#d9e3fb]"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo Section */}
      <div className="flex items-center gap-3 border-b border-[#e2e8f0] px-4 py-5">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-[#e8eefb] p-1.5">
          <Image
            src="/img/logo/logo.png"
            alt="BJMP Logo"
            fill
            className="object-contain"
            sizes="40px"
          />
        </div>
        <div
          className={cn(
            "overflow-hidden transition-all duration-300",
            effectiveCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          )}
        >
          <h1 className="whitespace-nowrap font-lexend text-base font-semibold text-[#00154A]">
            BJMP Visitor
          </h1>
          <p className="whitespace-nowrap text-xs text-[#5f6f8f]">Management Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);

          return (
            <Link
              key={item.name}
              href={item.path}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                isActive
                  ? "bg-[#dfe9ff] text-[#00154A] shadow-sm"
                  : "text-[#4b5d86] hover:bg-[#edf3ff] hover:text-[#00154A]"
              )}
              title={effectiveCollapsed ? item.name : undefined}
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-transform group-hover:scale-110",
                  isActive ? "text-[#00154A]" : "text-[#8191b3]"
                )}
              />
              
              <span
                className={cn(
                  "flex-1 overflow-hidden whitespace-nowrap transition-all duration-300",
                  effectiveCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                )}
              >
                {item.name}
              </span>

              {/* Badge */}
              {item.badge && !effectiveCollapsed && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#2952b3] px-1.5 text-xs font-medium text-white">
                  {item.badge}
                </span>
              )}

              {/* Active indicator */}
              {isActive && !effectiveCollapsed && (
                <ChevronRight className="h-4 w-4 text-[#00154A]" />
              )}

              {/* Collapsed badge indicator */}
              {item.badge && effectiveCollapsed && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#2952b3] ring-2 ring-white" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-[#d9e3fb] bg-linear-to-r from-[#eef4ff] to-[#f8fbff] p-3">
        {/* User Info */}
        <div className="flex items-center gap-3 rounded-xl border border-[#dbe6ff] bg-white/85 px-2.5 py-2.5 shadow-[0_6px_18px_rgba(0,40,120,0.08)]">
          <div className="relative shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-[#15337b] to-[#2952b3] text-white shadow-sm">
              <UserRound className="h-5 w-5" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#2d6a4f]" />
          </div>

          <div
            className={cn(
              "min-w-0 flex-1 transition-all duration-300",
              effectiveCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            )}
          >
            <p className="truncate text-sm font-semibold text-[#00154A]">
              {sessionUser?.name || sessionUser?.username || "Guest User"}
            </p>
            <p className="truncate text-xs text-[#5f6f8f]">
              {sessionUser?.email || "No active session"}
            </p>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          type="button"
          className="cursor-pointer group mt-2 flex w-full items-center gap-3 rounded-xl border border-[#dbe6ff] bg-white/70 px-2.5 py-2.5 text-sm font-medium text-[#42557f] transition-all hover:-translate-y-0.5 hover:border-[#f0c7c7] hover:bg-[#fff6f6] hover:text-[#b91c1c] hover:shadow-[0_8px_20px_rgba(185,28,28,0.12)]"
          title={effectiveCollapsed ? "Sign Out" : undefined}
        >
          <LogOut className="cursor-pointer h-5 w-5 shrink-0 text-[#8191b3] transition-transform group-hover:scale-110 group-hover:text-[#b91c1c]" />
          <span
            className={cn(
              "cursor-pointer whitespace-nowrap transition-all duration-300",
              effectiveCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            )}
          >
            Sign Out
          </span>
        </button>
      </div>
    </aside>
  );
}