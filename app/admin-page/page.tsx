"use client";

import { useEffect, useState, useCallback } from "react";
import AdminSidebarLayout from "./components/AdminSidebarLayout";
import { supabase } from "@/lib/supabase/client";
import { 
  Users, 
  CalendarCheck, 
  ShieldCheck, 
  LayoutDashboard, 
  Activity, 
  Clock, 
  UserCog, 
  Database,
  Briefcase,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  LucideIcon
} from "lucide-react";
import Link from "next/link";

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color, 
  href 
}: { 
  title: string; 
  value: string | number; 
  icon: LucideIcon; 
  trend?: string; 
  color: string;
  href: string;
}) {
  return (
    <Link href={href} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-md active:scale-[0.98]">
      <div className={`absolute -right-4 -top-4 size-24 rounded-full opacity-5 transition-transform group-hover:scale-110 ${color.replace('text-', 'bg-')}`} />
      
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          {trend && (
            <div className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-600">
              <TrendingUp size={12} />
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div className={`rounded-xl p-2.5 ${color.replace('text-', 'bg-').replace('-600', '-50')} ${color}`}>
          <Icon size={24} />
        </div>
      </div>
      
      <div className="mt-4 flex items-center gap-1 text-xs font-medium text-blue-600 transition-all group-hover:gap-2">
        View details <ChevronRight size={12} />
      </div>
    </Link>
  );
}

function QuickAction({ 
  title, 
  desc, 
  icon: Icon, 
  href, 
  color 
}: { 
  title: string; 
  desc: string; 
  icon: LucideIcon; 
  href: string; 
  color: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:bg-white hover:shadow-sm hover:border-slate-200 group">
      <div className={`rounded-lg p-2 text-white shadow-sm ${color}`}>
        <Icon size={20} />
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
      <ExternalLink size={14} className="text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [stats, setStats] = useState({
    inmates: 0,
    pendingVisits: 0,
    pendingGuardians: 0,
    programs: 0,
    users: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dbStatus, setDbStatus] = useState<"checking" | "stable" | "unstable" | "offline">("checking");
  const [lastAuditTime, setLastAuditTime] = useState<Date | null>(null);
  const [systemLoad, setSystemLoad] = useState({
    cpu: 0,
    load: 12,
    ram: 98,
  });

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setDbStatus("checking");
    try {
      const [
        { count: inmatesCount },
        { count: visitsCount },
        { count: guardiansCount },
        { count: programsCount },
        { count: usersCount }
      ] = await Promise.all([
        supabase.from("inmates").select("*", { count: "exact", head: true }),
        supabase.from("visitations").select("*", { count: "exact", head: true }).eq("status", "Pending"),
        supabase.from("guardian_requests").select("*", { count: "exact", head: true }).eq("status", "Pending"),
        supabase.from("programs").select("*", { count: "exact", head: true }),
        supabase.from("users").select("*", { count: "exact", head: true }).neq("role_id", 4)
      ]);

      setStats({
        inmates: inmatesCount || 0,
        pendingVisits: visitsCount || 0,
        pendingGuardians: guardiansCount || 0,
        programs: programsCount || 0,
        users: usersCount || 0,
      });
      setDbStatus("stable");
      setLastAuditTime(new Date());
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      setDbStatus("offline");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    
    // System load simulation
    const loadTimer = setInterval(() => {
      setSystemLoad(prev => ({
        cpu: Math.max(0, Math.min(100, prev.cpu + (Math.random() * 4 - 2))),
        load: Math.max(5, Math.min(40, prev.load + (Math.random() * 2 - 1))),
        ram: Math.max(80, Math.min(99, prev.ram + (Math.random() * 0.4 - 0.2))),
      }));
    }, 3000);

    return () => {
      clearInterval(timer);
      clearInterval(loadTimer);
    };
  }, [fetchStats]);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <AdminSidebarLayout>
      <div className="mx-auto max-w-7xl space-y-8 pb-10">
        
        {/* ── Header ── */}
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
              <LayoutDashboard size={16} />
              <span>Operations Overview</span>
            </div>
            <h1 className="font-lexend text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              {getGreeting()}, <span className="text-blue-600">Admin</span>
            </h1>
            <p className="text-slate-500">
              Monitor and manage BJMP facility operations from your command center.
            </p>
          </div>
          
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">System Time</p>
              <p className="text-sm font-bold text-slate-900">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                <span className="ml-2 font-medium text-slate-400">
                  {currentTime.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
              </p>
            </div>
          </div>
        </header>

        {/* ── Stats Grid ── */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl border border-slate-100 bg-slate-50" />
            ))
          ) : (
            <>
              <StatCard 
                title="Total PDLs" 
                value={stats.inmates} 
                icon={Users} 
                color="text-blue-600" 
                href="/admin-page/inmate-profile"
              />
              <StatCard 
                title="Pending Visits" 
                value={stats.pendingVisits} 
                icon={CalendarCheck} 
                trend={`${stats.pendingVisits > 10 ? 'High load' : 'Normal'}`}
                color="text-amber-600" 
                href="/admin-page/visitation-request"
              />
              <StatCard 
                title="Guardian Req." 
                value={stats.pendingGuardians} 
                icon={ShieldCheck} 
                color="text-teal-600" 
                href="/admin-page/guardian-requests"
              />
              <StatCard 
                title="Active Programs" 
                value={stats.programs} 
                icon={Briefcase} 
                color="text-emerald-600" 
                href="/admin-page/manage-program"
              />
              <StatCard 
                title="System Users" 
                value={stats.users} 
                icon={UserCog} 
                color="text-purple-600" 
                href="/admin-page/user-management"
              />
            </>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* ── Quick Actions ── */}
          <section className="lg:col-span-1">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-lexend text-xl font-bold text-slate-900">Quick Operations</h2>
              <p className="mt-1 text-sm text-slate-500">Fast access to administrative tools.</p>
              
              <div className="mt-6 flex flex-col gap-3">
                <QuickAction 
                  title="Register New PDL" 
                  desc="Add new inmate to records" 
                  icon={Users} 
                  href="/admin-page/inmate-profile?action=new" 
                  color="bg-blue-600" 
                />
                <QuickAction 
                  title="Audit Activity Logs" 
                  desc="Review system access history" 
                  icon={Activity} 
                  href="/admin-page/audit-logs" 
                  color="bg-slate-800" 
                />
                <QuickAction 
                  title="User Permissions" 
                  desc="Manage staff access levels" 
                  icon={UserCog} 
                  href="/admin-page/user-management" 
                  color="bg-purple-600" 
                />
                <QuickAction 
                  title="Database Health" 
                  desc="System integrity status" 
                  icon={Database} 
                  href="#" 
                  color="bg-emerald-600" 
                />
              </div>
            </div>
          </section>

          {/* ── Recent Alerts / Status ── */}
          <section className="lg:col-span-2">
            <div className="h-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-lexend text-xl font-bold text-slate-900">System Monitoring</h2>
                  <p className="mt-1 text-sm text-slate-500">Live operational status and alerts.</p>
                </div>
                <button 
                  onClick={fetchStats}
                  className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-blue-600"
                >
                  <Activity size={20} />
                </button>
              </div>

              <div className="mt-8 space-y-6">
                <div className="flex items-start gap-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
                    dbStatus === 'stable' ? 'bg-blue-50 text-blue-600' : 
                    dbStatus === 'checking' ? 'bg-slate-50 text-slate-400 animate-pulse' : 
                    'bg-red-50 text-red-600'
                  }`}>
                    <Database size={18} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-900">Supabase Connection</h4>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border transition-all ${
                        dbStatus === 'stable' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        dbStatus === 'checking' ? 'bg-slate-50 text-slate-500 border-slate-100 animate-pulse' : 
                        'bg-red-50 text-red-600 border-red-100'
                      }`}>
                        {dbStatus}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {dbStatus === 'stable' 
                        ? "All database services are operational. Real-time synchronization is active."
                        : dbStatus === 'checking'
                        ? "Verifying connection to database services..."
                        : "Connection lost. Attempting to reconnect to system services."}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 border-t border-slate-50 pt-6">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    stats.pendingVisits > 20 ? 'bg-red-50 text-red-600' : 
                    stats.pendingVisits > 0 ? 'bg-amber-50 text-amber-600' : 
                    'bg-emerald-50 text-emerald-600'
                  }`}>
                    <CalendarCheck size={18} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-900">Visitation Backlog</h4>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                        stats.pendingVisits > 20 ? 'bg-red-50 text-red-600 border-red-100' : 
                        stats.pendingVisits > 0 ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                        'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>
                        {stats.pendingVisits > 20 ? 'Critical' : stats.pendingVisits > 0 ? 'Action Required' : 'Cleared'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {stats.pendingVisits > 0 
                        ? `There are currently ${stats.pendingVisits} visitation requests awaiting administrative approval.`
                        : "All visitation requests have been processed. Great job!"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 border-t border-slate-50 pt-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                    <Activity size={18} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-900">Recent Server Load</h4>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 uppercase tracking-wider border border-emerald-100">Healthy</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-1000 shadow-[0_0_8px_rgba(59,130,246,0.5)]" 
                        style={{ width: `${systemLoad.load}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                      <span>{systemLoad.cpu.toFixed(1)}% CPU</span>
                      <span>{systemLoad.load.toFixed(1)}% Load</span>
                      <span>{systemLoad.ram.toFixed(1)}% RAM</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 rounded-2xl bg-linear-to-br from-[#0a1e47] to-[#1e4b8f] p-5 text-white">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-200">Facility Security</p>
                    <h3 className="text-lg font-bold">Operational Status</h3>
                  </div>
                  <ShieldCheck size={32} className="text-blue-300/30" />
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 text-xs font-medium text-blue-100">
                  <div className="flex items-center gap-1.5">
                    <div className="size-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                    Secure Mode Active
                  </div>
                  <span>Last Audit: {lastAuditTime ? "Just now" : "Pending..."}</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AdminSidebarLayout>
  );
}
