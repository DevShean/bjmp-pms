"use client";

import { useCallback, useEffect, useRef, useState, memo } from "react";
import {
  Bell,
  ChevronDown,
  Command,
  PanelRightClose,
  PanelRightOpen,
  Search,
  X,
  Loader2,
  Users,
  BookOpen,
  ScrollText,
  UserCircle2,
  LogOut,
  Check,
  Inbox,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { type StaffRole, staffRoleConfig } from "./staffNavigation";
import { supabase } from "@/lib/supabase/client";
import { getInmateImageUrl } from "@/app/lib/utils/image";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";

type StaffHeaderProps = {
  role: StaffRole;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  sessionUser?: {
    userId?: number;
    name?: string;
    username?: string;
    email?: string;
    photo_url?: string | null;
  } | null;
};

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

interface ProgramSearchResult {
  program_id: number;
  program_name: string;
}

interface BehaviorLogSearchResult {
  log_id: number;
  notes: string;
  behavior_rating: string;
  inmates: {
    first_name: string;
    last_name: string;
    photo_path: string;
  } | null;
}

interface SearchResult {
  id: string;
  label: string;
  type: 'inmate' | 'program' | 'behavior_log';
  href: string;
  sub?: string;
  photo?: string;
}

function SearchBar({
  placeholder,
  isOpen,
  onToggle,
  role,
}: {
  placeholder: string;
  isOpen?: boolean;
  onToggle?: () => void;
  role: StaffRole;
}) {
  const [searchValue, setSearchValue] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const getSearchResultHref = useCallback((type: 'inmate' | 'program' | 'behavior_log', id: number | string) => {
    if (type === 'inmate') {
      switch (role) {
        case 'admin': return `/admin-page/inmate-profile?id=${id}`;
        case 'officer': return `/officer-page/inmate?id=${id}`;
        case 'medical': return `/medical-page/inmates-medic?id=${id}`;
        case 'rehab': return `/rehab-page/inmate-progress?id=${id}`;
        default: return `/admin-page/inmate-profile?id=${id}`;
      }
    } else if (type === 'program') {
      switch (role) {
        case 'admin': return `/admin-page/manage-program`;
        case 'rehab': return `/rehab-page/programs`;
        default: return `/admin-page/manage-program`;
      }
    } else {
      // behavior_log
      switch (role) {
        case 'admin': return `/admin-page/inmate-progress`;
        case 'officer': return `/officer-page/behavior-logs`;
        case 'rehab': return `/rehab-page/behavior-logs`;
        default: return `/admin-page/inmate-progress`;
      }
    }
  }, [role]);

  useEffect(() => {
    if (!searchValue.trim() || searchValue.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setShowResults(true);
      try {
        const [inmatesRes, programsRes, logsRes] = await Promise.all([
          supabase
            .from('inmates')
            .select('inmate_id, first_name, last_name, photo_path')
            .or(`first_name.ilike.%${searchValue}%,last_name.ilike.%${searchValue}%`)
            .limit(5),
          (role === 'admin' || role === 'rehab') 
            ? supabase
                .from('programs')
                .select('program_id, program_name')
                .ilike('program_name', `%${searchValue}%`)
                .limit(3)
            : Promise.resolve({ data: null as ProgramSearchResult[] | null, error: null }),
          (role === 'admin' || role === 'officer' || role === 'rehab')
            ? supabase
                .from('behavior_logs')
                .select('log_id, notes, behavior_rating, inmates(first_name, last_name, photo_path)')
                .or(`notes.ilike.%${searchValue}%,behavior_rating.ilike.%${searchValue}%`)
                .limit(3)
            : Promise.resolve({ data: null as BehaviorLogSearchResult[] | null, error: null })
        ]);

        const formattedResults: SearchResult[] = [];
        
        if (inmatesRes.data) {
          inmatesRes.data.forEach(inmate => {
            const name = `${inmate.first_name} ${inmate.last_name}`;
            formattedResults.push({
              id: `inm-${inmate.inmate_id}`,
              label: name,
              sub: `ID: ${inmate.inmate_id}`,
              type: 'inmate',
              href: getSearchResultHref('inmate', inmate.inmate_id),
              photo: getInmateImageUrl(inmate.photo_path, name)
            });
          });
        }

        if (programsRes && programsRes.data) {
          (programsRes.data as ProgramSearchResult[]).forEach(prog => {
            formattedResults.push({
              id: `prog-${prog.program_id}`,
              label: prog.program_name,
              type: 'program',
              href: getSearchResultHref('program', prog.program_id)
            });
          });
        }

        if (logsRes && logsRes.data) {
          (logsRes.data as BehaviorLogSearchResult[]).forEach(log => {
             const inmateName = log.inmates ? `${log.inmates.first_name} ${log.inmates.last_name}` : 'Unknown Inmate';
             formattedResults.push({
                id: `log-${log.log_id}`,
                label: `Log: ${inmateName}`,
                sub: `${log.behavior_rating}${log.notes ? ` - ${log.notes}` : ''}`,
                type: 'behavior_log',
                href: getSearchResultHref('behavior_log', log.log_id),
                photo: log.inmates ? getInmateImageUrl(log.inmates.photo_path, inmateName) : undefined
             });
          });
        }

        setResults(formattedResults);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue, getSearchResultHref, role]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      const selected = results[selectedIndex];
      if (selected) {
        router.push(selected.href);
        setShowResults(false);
        setSearchValue("");
        onToggle?.();
      }
    } else if (e.key === 'Escape') {
      setShowResults(false);
    }
  };

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
            onKeyDown={handleKeyDown}
            onFocus={() => searchValue.length >= 2 && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            className="h-10 w-full rounded-lg border border-[#e2e8f0] bg-[#f8fafd] pl-9 pr-20 text-sm text-[#2f3d5b] outline-none ring-0 placeholder:text-[#9fa9bf] focus:border-[#00154A] focus:bg-white focus:ring-2 focus:ring-[#c3d4f8]"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <kbd className="inline-flex items-center gap-0.5 rounded border border-[#e2e8f0] bg-white px-1.5 py-0.5 text-[10px] font-medium text-[#8191b3]">
              <Command className="h-3 w-3" />
              <span>/</span>
            </kbd>
          </div>
        </div>

        {showResults && (
           <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl border border-[#e2e8f0] bg-white shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
              <SearchContent 
                results={results} 
                isSearching={isSearching} 
                selectedIndex={selectedIndex} 
                onSelect={(href) => {
                  router.push(href);
                  setShowResults(false);
                  setSearchValue("");
                }}
              />
           </div>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-x-0 top-0 z-50 animate-in slide-in-from-top-0 fade-in-0 duration-200 h-full bg-slate-900/10 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onToggle?.()}>
          <div className="bg-white/95 p-4 backdrop-blur-xl shadow-lg border-b border-slate-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8191b3]" />
              <input
                ref={inputRef}
                type="text"
                placeholder={placeholder}
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                onKeyDown={handleKeyDown}
                className="h-12 w-full rounded-lg border border-[#e2e8f0] bg-[#f8fafd] pl-10 pr-12 text-base text-[#2f3d5b] outline-none ring-0 placeholder:text-[#9fa9bf] focus:border-[#00154A] focus:ring-2 focus:ring-[#c3d4f8]"
                autoFocus
              />
              <button
                onClick={onToggle}
                className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[#8191b3] transition-colors hover:bg-[#f1f5f9] hover:text-[#00154A]"
                aria-label="Close search"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {searchValue.length >= 2 && (
               <div className="mt-4 max-h-[70vh] overflow-y-auto">
                  <SearchContent 
                    results={results} 
                    isSearching={isSearching} 
                    selectedIndex={selectedIndex} 
                    onSelect={(href) => {
                      router.push(href);
                      setShowResults(false);
                      setSearchValue("");
                      onToggle?.();
                    }}
                  />
               </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function SearchContent({ results, isSearching, selectedIndex, onSelect }: { 
  results: SearchResult[], 
  isSearching: boolean, 
  selectedIndex: number,
  onSelect: (href: string) => void 
}) {
  if (isSearching) {
    return (
      <div className="flex items-center justify-center p-8 text-[#8191b3]">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span className="text-sm">Searching...</span>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm font-medium text-[#2f3d5b]">No results found</p>
        <p className="mt-1 text-xs text-[#8191b3]">Try searching for inmate names or IDs</p>
      </div>
    );
  }

  return (
    <div className="py-2">
      {results.map((result, index) => (
        <button
          key={result.id}
          type="button"
          onClick={() => onSelect(result.href)}
          className={`cursor-pointer group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
            index === selectedIndex ? 'bg-[#f1f5f9]' : 'hover:bg-[#f8fafd]'
          }`}
        >
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#8191b3] overflow-hidden">
            {result.photo ? (
               <Image 
                 src={result.photo} 
                 alt="" 
                 fill 
                 className="object-cover"
                 unoptimized={result.photo.startsWith('data:')}
               />
            ) : result.type === 'inmate' ? (
              <Users size={18} />
            ) : result.type === 'program' ? (
              <BookOpen size={18} />
            ) : (
              <ScrollText size={18} />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="truncate text-sm font-medium text-[#00154A]">{result.label}</span>
            <span className="text-[11px] text-[#8191b3] uppercase tracking-wider font-semibold">
              {result.type} {result.sub && <span className="lowercase font-normal ml-1">• {result.sub}</span>}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

function UserMenu({
  userName,
  userRole,
  onSignOut,
}: {
  userName: string;
  userRole: string;
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
        className="cursor-pointer group flex items-center gap-3 rounded-lg px-2 py-1.5 transition-all hover:bg-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-[#c3d4f8]"
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

            <div className="my-1 h-px bg-[#e2e8f0]" />
            <button
              type="button"
              onClick={() => {
                onSignOut();
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
}

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
      .channel(`staff-notifications-${userId}`)
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
        <div className="absolute right-0 mt-3 w-[280px] sm:w-80 max-h-[480px] overflow-hidden flex flex-col rounded-2xl border border-[#e2e8f0] bg-white shadow-2xl animate-in zoom-in-95 fade-in-0 duration-200">
          <div className="flex items-center justify-between border-b border-[#f1f5f9] bg-[#fcfdff] px-3 py-3 sm:px-4 sm:py-3.5">
            <h3 className="font-lexend text-xs sm:text-sm font-bold text-[#00154A]">Notifications</h3>
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
                    className={`relative flex gap-2.5 sm:gap-3 p-3 sm:p-4 transition-colors hover:bg-[#f8fafd] ${
                      !notif.is_read ? "bg-blue-50/30" : ""
                    }`}
                  >
                    {!notif.is_read && (
                      <div className="absolute left-0 top-0 h-full w-1 bg-blue-600" />
                    )}
                    <div className={`mt-0.5 shrink-0 rounded-lg p-2 ${
                      notif.type === "visitation_request" ? "bg-emerald-50 text-emerald-600" :
                      notif.type === "guardian_request" ? "bg-teal-50 text-teal-600" :
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
            className="cursor-pointer group relative flex h-9 w-9 items-center justify-center rounded-lg text-[#5f6f8f] transition-all hover:bg-[#f1f5f9] hover:text-[#00154A] focus:outline-none focus:ring-2 focus:ring-[#c3d4f8]"
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
            className="cursor-pointer inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#5f6f8f] transition-all hover:bg-[#f1f5f9] hover:text-[#00154A] focus:outline-none focus:ring-2 focus:ring-[#c3d4f8] md:hidden"
            aria-label="Open search"
          >
            <Search className="h-4 w-4" />
          </button>

          <SearchBar
            placeholder={config.searchPlaceholder}
            isOpen={isMobileSearchOpen}
            onToggle={() => setIsMobileSearchOpen(false)}
            role={role}
          />
        </div>

        <div className="flex items-center gap-1 sm:gap-2">


          {/* Notifications button */}
          <NotificationMenu userId={sessionUser?.userId} />

          <UserMenu
            userName={sessionUser?.name || sessionUser?.username || config.label}
            userRole={sessionUser?.email || config.defaultEmail}
            onSignOut={handleSignOut}
          />
        </div>
      </div>
    </header>
  );
}