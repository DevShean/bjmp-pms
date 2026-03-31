"use client";

import { useState, useRef, useEffect, memo, useCallback } from "react";
import Image from "next/image";
import {
  PanelRightClose,
  PanelRightOpen,
  Search,
  Bell,
  ChevronDown,
  UserCircle2,
  Command,
  LogOut,
  X,
  Check,
  Inbox,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface SearchBarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

interface UserMenuProps {
  userName?: string;
  userRole?: string;
  photo_url?: string | null;
  onProfile?: () => void;
  onSignOut?: () => void;
}

interface Notification {
  notification_id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationMenuProps {
  userId?: string | number;
}

interface VisitorHeaderProps {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  sessionUser?: {
    userId?: string | number;
    name?: string;
    username?: string;
    email?: string;
    photo_url?: string | null;
  } | null;
}

const SearchBar = memo(({ isOpen, onToggle }: SearchBarProps) => {
  const [searchValue, setSearchValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchValue("");
        if (onToggle && window.innerWidth < 768) {
          onToggle();
        }
      }
    },
    [onToggle],
  );

  return (
    <>
      <div className="relative hidden w-72 md:block lg:w-96">
        <div className="group relative">
          <label htmlFor="search-input" className="sr-only">
            Search menu
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8191b3] transition-colors group-focus-within:text-[#00154A]"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            id="search-input"
            type="text"
            placeholder="Search..."
            value={searchValue}
            onChange={handleSearch}
            onKeyDown={handleKeyDown}
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
                placeholder="Search..."
                value={searchValue}
                onChange={handleSearch}
                onKeyDown={handleKeyDown}
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
});

SearchBar.displayName = "SearchBar";

const UserMenu = memo(
  ({
    userName = "Visitor",
    userRole = "Visitor Account",
    photo_url,
    onProfile,
    onSignOut,
  }: UserMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          menuRef.current &&
          !menuRef.current.contains(event.target as Node)
        ) {
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
          className="cursor-pointer group flex items-center gap-3 rounded-lg px-2 py-1.5 transition-all hover:bg-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-[#c3d4f8]"
          aria-label="User menu"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <div className="cursor-pointer relative">
            {photo_url ? (
              <div className="relative h-8 w-8 overflow-hidden rounded-full ring-2 ring-slate-100 transition-all group-hover:ring-blue-100">
                <Image
                  src={photo_url}
                  alt="Profile"
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <UserCircle2 
                className="h-8 w-8 text-[#8191b3] transition-colors group-hover:text-[#00154A]" 
                aria-hidden="true" 
              />
            )}
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#2d6a4f] ring-2 ring-white" />
          </div>

          <div className="hidden text-left sm:block min-w-0">
            <p className="max-w-[120px] truncate text-sm font-medium text-[#00154A] transition-all group-hover:text-[#00154A]" title={userName}>
              {userName}
            </p>
            <p className="text-xs text-[#5f6f8f]">{userRole}</p>
          </div>

          <ChevronDown
            className={`hidden h-4 w-4 text-[#8191b3] transition-all sm:block ${
              isOpen ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 animate-in zoom-in-95 fade-in-0 duration-200">
            <div className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white py-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  if (onProfile) onProfile();
                  setIsOpen(false);
                }}
                className="cursor-pointer flex w-full items-center gap-2 px-4 py-2.5 text-sm text-[#2f3d5b] transition-colors hover:bg-[#f8fafd]"
              >
                {photo_url ? (
                   <div className="relative h-4 w-4 overflow-hidden rounded-full border border-slate-200 bg-slate-50">
                     <Image src={photo_url} alt="P" fill className="object-cover" />
                   </div>
                ) : (
                   <UserCircle2 className="h-4 w-4 text-[#8191b3]" />
                )}
                <span>Profile</span>
              </button>
              <div className="my-1 h-px bg-[#e2e8f0]" />
              <button
                type="button"
                onClick={() => {
                  if (onSignOut) onSignOut();
                  setIsOpen(false);
                }}
                className="cursor-pointer flex w-full items-center gap-2 px-4 py-2.5 text-sm text-[#b91c1c] transition-colors hover:bg-[#fef2f2]"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  },
);

const NotificationMenu = memo(({ userId }: NotificationMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error fetching notifications:", error);
      return;
    }
    setNotifications(data || []);
    setUnreadCount((data || []).filter((n) => !n.is_read).length);
  }, [userId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotifications();
    }, 0);

    if (!userId) return () => clearTimeout(timer);

    const channel = supabase
      .channel(`user-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => fetchNotifications()
      )
      .subscribe();

    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [userId, fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id?: number) => {
    if (!userId) return;
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq(id ? "notification_id" : "user_id", id || userId);

    if (!error) {
      fetchNotifications();
    }
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="cursor-pointer group relative flex h-9 w-9 items-center justify-center rounded-lg bg-[#eef4ff] text-[#2f4b8f] transition-all hover:bg-[#dfe9ff] hover:text-[#00154A] focus:outline-none focus:ring-2 focus:ring-[#c3d4f8]"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell className="h-4 w-4 transition-transform group-hover:scale-110" />
        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#b91c1c] ring-2 ring-white animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 max-h-[480px] overflow-hidden flex flex-col rounded-2xl border border-[#e2e8f0] bg-white shadow-2xl animate-in zoom-in-95 fade-in-0 duration-200">
          <div className="flex items-center justify-between border-b border-[#f1f5f9] bg-[#fcfdff] px-4 py-3.5">
            <h3 className="font-lexend text-sm font-bold text-[#00154A]">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAsRead()}
                className="cursor-pointer flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-all"
              >
                <Check className="h-3 w-3" />
                Mark all as read
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-200">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-3 rounded-full bg-slate-50 p-4">
                  <Inbox className="h-6 w-6 text-slate-300" />
                </div>
                <p className="text-sm font-medium text-slate-700">All caught up!</p>
                <p className="mt-1 text-xs text-slate-400">No notifications yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#f1f5f9]">
                {notifications.map((notif) => (
                  <div
                    key={notif.notification_id}
                    className={`relative flex gap-3 p-4 transition-colors hover:bg-[#f8fafd] ${
                      !notif.is_read ? "bg-blue-50/30" : ""
                    }`}
                  >
                    {!notif.is_read && (
                      <div className="absolute left-0 top-0 h-full w-1 bg-blue-600" />
                    )}
                    <div className={`mt-0.5 shrink-0 rounded-lg p-2 ${
                      notif.type === "guardian_approval" ? "bg-emerald-50 text-emerald-600" :
                      notif.type === "alert" ? "bg-amber-50 text-amber-600" :
                      "bg-blue-50 text-blue-600"
                    }`}>
                      {notif.type === "alert" ? <AlertTriangle className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm leading-tight ${notif.is_read ? "text-[#2f3d5b]" : "font-semibold text-[#00154A]"}`}>
                        {notif.title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-[#5f6f8f]">
                        {notif.message}
                      </p>
                      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-[#9fa9bf]">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

NotificationMenu.displayName = "NotificationMenu";

UserMenu.displayName = "UserMenu";

export default function VisitorHeader({
  isSidebarCollapsed,
  onToggleSidebar,
  sessionUser,
}: VisitorHeaderProps) {
  const router = useRouter();
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      router.push("/");
      router.refresh();
    }
  }, [router]);

  const handleOpenProfile = useCallback(() => {
    router.push("/visitor-page/profile");
  }, [router]);


  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileSearchOpen) {
        setIsMobileSearchOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMobileSearchOpen]);

  useEffect(() => {
    const handleSearchShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        if (window.innerWidth < 768) {
          setIsMobileSearchOpen(true);
        } else {
          document.getElementById("search-input")?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleSearchShortcut);
    return () => document.removeEventListener("keydown", handleSearchShortcut);
  }, []);

  return (
    <header
      className={`sticky top-0 z-20 w-full transition-all duration-200 ${
        isScrolled
          ? "border-b border-[#e2e8f0] bg-linear-to-r from-[#f7faff]/95 via-[#eef4ff]/95 to-[#f6fbff]/95 backdrop-blur-xl"
          : "border-b border-[#e2e8f0] bg-linear-to-r from-[#fbfdff] via-[#f3f7ff] to-[#f8fbff]"
      }`}
    >
      <div className="flex min-h-20 items-center justify-between gap-4 px-4 py-2 sm:px-6">
        {/* Left section */}
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="cursor-pointer group relative flex h-9 w-9 items-center justify-center rounded-lg text-[#5f6f8f] transition-all hover:bg-[#f1f5f9] hover:text-[#00154A] focus:outline-none focus:ring-2 focus:ring-[#c3d4f8]"
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? (
              <PanelRightOpen className="h-4 w-4 transition-transform group-hover:scale-110" />
            ) : (
              <PanelRightClose className="h-4 w-4 transition-transform group-hover:scale-110" />
            )}
          </button>

          {/* Mobile search toggle */}
          <button
            type="button"
            onClick={() => setIsMobileSearchOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#5f6f8f] transition-all hover:bg-[#f1f5f9] hover:text-[#00154A] focus:outline-none focus:ring-2 focus:ring-[#c3d4f8] md:hidden"
            aria-label="Open search"
          >
            <Search className="h-4 w-4" />
          </button>

          <SearchBar
            isOpen={isMobileSearchOpen}
            onToggle={() => setIsMobileSearchOpen(false)}
          />
        </div>

        {/* Right section */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Notifications button */}
          <NotificationMenu userId={sessionUser?.userId} />

          {/* User menu */}
          <UserMenu
            userName={sessionUser?.name || sessionUser?.username || "Guest User"}
            userRole={sessionUser?.email || "Visitor Account"}
            photo_url={sessionUser?.photo_url}
            onProfile={handleOpenProfile}
            onSignOut={handleSignOut}
          />
        </div>
      </div>
    </header>
  );
}