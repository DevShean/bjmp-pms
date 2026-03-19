"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell,
  ChevronDown,
  Command,
  PanelRightClose,
  PanelRightOpen,
  Search,
  Settings,
  UserCircle2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { type StaffRole, staffRoleConfig } from "./staffNavigation";

type StaffHeaderProps = {
  role: StaffRole;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  sessionUser?: {
    name?: string;
    username?: string;
    email?: string;
  } | null;
};

function SearchBar({
  placeholder,
  isOpen,
  onToggle,
}: {
  placeholder: string;
  isOpen?: boolean;
  onToggle?: () => void;
}) {
  const [searchValue, setSearchValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <div className="relative hidden w-72 md:block lg:w-96">
        <div className="group relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8191b3] transition-colors group-focus-within:text-[#00154A]" />
          <input
            ref={inputRef}
            id="staff-search-input"
            type="text"
            placeholder={placeholder}
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            className="h-10 w-full rounded-lg border border-[#e2e8f0] bg-[#f8fafd] pl-9 pr-20 text-sm text-[#2f3d5b] outline-none ring-0 placeholder:text-[#9fa9bf] focus:border-[#00154A] focus:bg-white focus:ring-2 focus:ring-[#c3d4f8]"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <kbd className="inline-flex items-center gap-0.5 rounded border border-[#e2e8f0] bg-white px-1.5 py-0.5 text-[10px] font-medium text-[#8191b3]">
              <Command className="h-3 w-3" />
              <span>/</span>
            </kbd>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-x-0 top-0 z-50 animate-in slide-in-from-top-0 fade-in-0 duration-200">
          <div className="bg-white/95 p-4 backdrop-blur-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8191b3]" />
              <input
                ref={inputRef}
                type="text"
                placeholder={placeholder}
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                className="h-12 w-full rounded-lg border border-[#e2e8f0] bg-[#f8fafd] pl-10 pr-12 text-base text-[#2f3d5b] outline-none ring-0 placeholder:text-[#9fa9bf] focus:border-[#00154A] focus:ring-2 focus:ring-[#c3d4f8]"
                autoFocus
              />
              <button
                onClick={onToggle}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[#8191b3] transition-colors hover:bg-[#f1f5f9] hover:text-[#00154A]"
                aria-label="Close search"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function UserMenu({
  userName,
  userRole,
  onProfile,
  onSettings,
  onSignOut,
}: {
  userName: string;
  userRole: string;
  onProfile: () => void;
  onSettings: () => void;
  onSignOut: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="group flex items-center gap-3 rounded-lg px-2 py-1.5 transition-all hover:bg-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-[#c3d4f8]"
      >
        <div className="relative">
          <UserCircle2 className="h-8 w-8 text-[#8191b3] transition-colors group-hover:text-[#00154A]" />
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#2d6a4f] ring-2 ring-white" />
        </div>
        <div className="hidden text-left sm:block">
          <p className="text-sm font-medium text-[#00154A]">{userName}</p>
          <p className="text-xs text-[#5f6f8f]">{userRole}</p>
        </div>
        <ChevronDown className={`hidden h-4 w-4 text-[#8191b3] transition-all sm:block ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 animate-in zoom-in-95 fade-in-0 duration-200">
          <div className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white py-1 shadow-lg">
            <button
              type="button"
              onClick={() => {
                onProfile();
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-[#2f3d5b] transition-colors hover:bg-[#f8fafd]"
            >
              <UserCircle2 className="h-4 w-4 text-[#8191b3]" />
              <span>Profile</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onSettings();
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-[#2f3d5b] transition-colors hover:bg-[#f8fafd]"
            >
              <Settings className="h-4 w-4 text-[#8191b3]" />
              <span>Settings</span>
            </button>
            <div className="my-1 h-px bg-[#e2e8f0]" />
            <button
              type="button"
              onClick={() => {
                onSignOut();
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-[#b91c1c] transition-colors hover:bg-[#fef2f2]"
            >
              <X className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StaffHeader({ role, isSidebarCollapsed, onToggleSidebar, sessionUser }: StaffHeaderProps) {
  const router = useRouter();
  const config = staffRoleConfig[role];
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isMobileSearchOpen) {
        setIsMobileSearchOpen(false);
      }
    };

    const handleSearchShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "/") {
        event.preventDefault();
        if (window.innerWidth < 768) {
          setIsMobileSearchOpen(true);
        } else {
          document.getElementById("staff-search-input")?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("keydown", handleSearchShortcut);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("keydown", handleSearchShortcut);
    };
  }, [isMobileSearchOpen]);

  const handleSignOut = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      router.push("/admin");
      router.refresh();
    }
  }, [router]);

  return (
    <header
      className={`sticky top-0 z-20 w-full transition-all duration-200 ${
        isScrolled
          ? "border-b border-[#e2e8f0] bg-linear-to-r from-[#f7faff]/95 via-[#eef4ff]/95 to-[#f6fbff]/95 backdrop-blur-xl"
          : "border-b border-[#e2e8f0] bg-linear-to-r from-[#fbfdff] via-[#f3f7ff] to-[#f8fbff]"
      }`}
    >
      <div className="flex min-h-20 items-center justify-between gap-4 px-4 py-2 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="group relative flex h-9 w-9 items-center justify-center rounded-lg text-[#5f6f8f] transition-all hover:bg-[#f1f5f9] hover:text-[#00154A] focus:outline-none focus:ring-2 focus:ring-[#c3d4f8]"
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? (
              <PanelRightOpen className="h-4 w-4 transition-transform group-hover:scale-110" />
            ) : (
              <PanelRightClose className="h-4 w-4 transition-transform group-hover:scale-110" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsMobileSearchOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#5f6f8f] transition-all hover:bg-[#f1f5f9] hover:text-[#00154A] focus:outline-none focus:ring-2 focus:ring-[#c3d4f8] md:hidden"
            aria-label="Open search"
          >
            <Search className="h-4 w-4" />
          </button>

          <SearchBar
            placeholder={config.searchPlaceholder}
            isOpen={isMobileSearchOpen}
            onToggle={() => setIsMobileSearchOpen(false)}
          />
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            className="group relative flex h-9 w-9 items-center justify-center rounded-lg bg-[#eef4ff] text-[#2f4b8f] transition-all hover:bg-[#dfe9ff] hover:text-[#00154A] focus:outline-none focus:ring-2 focus:ring-[#c3d4f8]"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4 transition-transform group-hover:scale-110" />
          </button>

          <button
            type="button"
            className="group relative flex h-9 w-9 items-center justify-center rounded-lg bg-[#eef4ff] text-[#2f4b8f] transition-all hover:bg-[#dfe9ff] hover:text-[#00154A] focus:outline-none focus:ring-2 focus:ring-[#c3d4f8]"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4 transition-transform group-hover:scale-110" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#b91c1c] ring-2 ring-white" />
          </button>

          <UserMenu
            userName={sessionUser?.name || sessionUser?.username || config.label}
            userRole={sessionUser?.email || config.defaultEmail}
            onProfile={() => router.push(config.homePath)}
            onSettings={() => router.push(config.homePath)}
            onSignOut={handleSignOut}
          />
        </div>
      </div>
    </header>
  );
}