"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, LogOut, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { type StaffRole, staffRoleConfig } from "./staffNavigation";

type SessionUser = {
  name?: string;
  username?: string;
  email?: string;
};

type StaffSidebarProps = {
  role: StaffRole;
  sessionUser?: SessionUser | null;
  isCollapsed?: boolean;
};

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export default function StaffSidebar({ role, sessionUser, isCollapsed = false }: StaffSidebarProps) {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const effectiveCollapsed = isCollapsed && !isHovered;
  const config = staffRoleConfig[role];

  const openMap = useMemo(() => {
    const nextMap: Record<string, boolean> = {};
    for (const item of config.menuItems) {
      if (item.children?.some((child) => pathname === child.path || pathname.startsWith(`${child.path}/`))) {
        nextMap[item.name] = true;
      }
    }
    return nextMap;
  }, [config.menuItems, pathname]);

  const resolvedExpandedItems = { ...openMap, ...expandedItems };

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen shrink-0 flex-col bg-linear-to-b from-[#f8fbff] via-[#f4f8ff] to-[#eef4ff] transition-all duration-300 ease-in-out",
        effectiveCollapsed ? "w-18" : "w-72",
        "border-r border-[#d9e3fb]"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-3 border-b border-[#e2e8f0] px-4 py-5">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-[#e8eefb] p-1.5">
          <Image src="/img/logo/logo.png" alt="BJMP Logo" fill className="object-contain" sizes="40px" />
        </div>
        <div
          className={cn(
            "overflow-hidden transition-all duration-300",
            effectiveCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          )}
        >
          <h1 className="whitespace-nowrap font-lexend text-base font-semibold text-[#00154A]">
            BJMP {config.shortLabel}
          </h1>
          <p className="whitespace-nowrap text-xs text-[#5f6f8f]">Management Portal</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {config.menuItems.map((item) => {
          const Icon = item.icon;
          const children = item.children ?? [];
          const hasChildren = children.length > 0;
          const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
          const hasActiveChild = children.some(
            (child) => pathname === child.path || pathname.startsWith(`${child.path}/`),
          );
          const showChildren = hasChildren && !effectiveCollapsed && resolvedExpandedItems[item.name];

          return (
            <div key={item.name} className="space-y-1">
              <div className="flex items-center gap-1">
                <Link
                  href={item.path}
                  className={cn(
                    "group relative flex min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                    isActive || hasActiveChild
                      ? "bg-[#dfe9ff] text-[#00154A] shadow-sm"
                      : "text-[#4b5d86] hover:bg-[#edf3ff] hover:text-[#00154A]"
                  )}
                  title={effectiveCollapsed ? item.name : undefined}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 shrink-0 transition-transform group-hover:scale-110",
                      isActive || hasActiveChild ? "text-[#00154A]" : "text-[#8191b3]"
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

                  {item.badge && !effectiveCollapsed && (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#2952b3] px-1.5 text-xs font-medium text-white">
                      {item.badge}
                    </span>
                  )}

                  {(isActive || hasActiveChild) && !effectiveCollapsed && !hasChildren && (
                    <ChevronRight className="h-4 w-4 text-[#00154A]" />
                  )}

                  {item.badge && effectiveCollapsed && (
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#2952b3] ring-2 ring-white" />
                  )}
                </Link>

                {hasChildren && !effectiveCollapsed && (
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedItems((current) => ({
                        ...current,
                        [item.name]: !resolvedExpandedItems[item.name],
                      }))
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-[#6b7b99] transition hover:bg-[#edf3ff] hover:text-[#00154A]"
                    aria-label={`Toggle ${item.name} submenu`}
                  >
                    <ChevronDown
                      className={cn("h-4 w-4 transition-transform", resolvedExpandedItems[item.name] && "rotate-180")}
                    />
                  </button>
                )}
              </div>

              {showChildren && (
                <div className="ml-5 space-y-1 border-l border-[#d9e3fb] pl-4">
                  {children.map((child) => {
                    const childActive = pathname === child.path || pathname.startsWith(`${child.path}/`);
                    return (
                      <Link
                        key={child.name}
                        href={child.path}
                        className={cn(
                          "flex items-center rounded-lg px-3 py-2 text-sm transition-all",
                          childActive
                            ? "bg-[#e9f0ff] font-medium text-[#00154A]"
                            : "text-[#61728f] hover:bg-[#f4f7ff] hover:text-[#00154A]"
                        )}
                      >
                        <span>{child.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-[#d9e3fb] bg-linear-to-r from-[#eef4ff] to-[#f8fbff] p-3">
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
              {sessionUser?.name || sessionUser?.username || config.label}
            </p>
            <p className="truncate text-xs text-[#5f6f8f]">
              {sessionUser?.email || config.defaultEmail}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="cursor-pointer group mt-2 flex w-full items-center gap-3 rounded-xl border border-[#dbe6ff] bg-white/70 px-2.5 py-2.5 text-sm font-medium text-[#42557f] transition-all hover:-translate-y-0.5 hover:border-[#f0c7c7] hover:bg-[#fff6f6] hover:text-[#b91c1c] hover:shadow-[0_8px_20px_rgba(185,28,28,0.12)]"
          title={effectiveCollapsed ? "Sign Out" : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0 text-[#8191b3] transition-transform group-hover:scale-110 group-hover:text-[#b91c1c]" />
          <span
            className={cn(
              "whitespace-nowrap transition-all duration-300",
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