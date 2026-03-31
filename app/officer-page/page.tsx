"use client";

import { useEffect, useState, useCallback } from "react";
import OfficerSidebarLayout from "./components/OfficerSidebarLayout";
import { supabase } from "@/lib/supabase/client";
import { 
  Users, 
  ClipboardList, 
  AlertTriangle, 
  BookOpen, 
  LayoutDashboard, 
  Activity, 
  Clock, 
  ShieldCheck, 
  Database,
  Users2,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  LucideIcon,
  FileText
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
    <Link href={href} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-teal-200 hover:shadow-md active:scale-[0.98]">
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
        <div className={`rounded-xl p-2.5 ${color.replace('text-', 'bg-').replace('-700', '-50')} ${color}`}>
          <Icon size={24} />
        </div>
      </div>
      
      <div className="mt-4 flex items-center gap-1 text-xs font-medium text-teal-600 transition-all group-hover:gap-2">
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

export default function OfficerPage() {
  const [stats, setStats] = useState({
    inmates: 0,
    dailyLogs: 0,
    securityFlags: 0,
    activePrograms: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dbStatus, setDbStatus] = useState<"checking" | "stable" | "unstable" | "offline">("checking");
  const [lastAuditTime, setLastAuditTime] = useState<Date | null>(null);
  const [systemLoad, setSystemLoad] = useState({
    cpu: 0,
    load: 8,
    ram: 92,
  });

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setDbStatus("checking");
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const [
        { count: inmatesCount },
        { count: dailyLogsCount },
        { count: flagsCount },
        { count: programsCount }
      ] = await Promise.all([
        supabase.from("inmates").select("*", { count: "exact", head: true }),
        supabase.from("behavior_logs").select("*", { count: "exact", head: true }).gte("created_at", todayISO),
        supabase.from("behavior_logs").select("*", { count: "exact", head: true }).eq("rating", "Poor"),
        supabase.from("programs").select("*", { count: "exact", head: true })
      ]);

      setStats({
        inmates: inmatesCount || 0,
        dailyLogs: dailyLogsCount || 0,
        securityFlags: flagsCount || 0,
        activePrograms: programsCount || 0,
      });
      setDbStatus("stable");
      setLastAuditTime(new Date());
    } catch (error) {
      console.error("Error fetching officer stats:", error);
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
        cpu: Math.max(0, Math.min(100, prev.cpu + (Math.random() * 3 - 1.5))),
        load: Math.max(5, Math.min(30, prev.load + (Math.random() * 1.5 - 0.75))),
        ram: Math.max(85, Math.min(98, prev.ram + (Math.random() * 0.3 - 0.15))),
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
    <OfficerSidebarLayout>
      <div className="mx-auto max-w-7xl space-y-8 pb-10">
        
        {/* ── Header ── */}
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-teal-600">
              <LayoutDashboard size={16} />
              <span>Duty Overview</span>
            </div>
            <h1 className="font-lexend text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              {getGreeting()}, <span className="text-teal-700">Officer</span>
            </h1>
            <p className="text-slate-500">
              Manage facility security and inmate behavior logs for your current shift.
            </p>
          </div>
          
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Shift Time</p>
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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl border border-slate-100 bg-slate-50" />
            ))
          ) : (
            <>
              <StatCard 
                title="Monitored PDLs" 
                value={stats.inmates} 
                icon={Users} 
                color="text-teal-700" 
                href="/officer-page/inmate"
              />
              <StatCard 
                title="Daily Behavior Logs" 
                value={stats.dailyLogs} 
                icon={ClipboardList} 
                trend={stats.dailyLogs > 0 ? "Shift Active" : "No logs yet"}
                color="text-blue-700" 
                href="/officer-page/behavior-logs"
              />
              <StatCard 
                title="Security Flags" 
                value={stats.securityFlags} 
                icon={AlertTriangle} 
                color="text-rose-700" 
                trend={stats.securityFlags > 0 ? "Review Required" : "Secure"}
                href="/officer-page/behavior-logs"
              />
              <StatCard 
                title="Active Programs" 
                value={stats.activePrograms} 
                icon={BookOpen} 
                color="text-emerald-700" 
                href="#"
              />
            </>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* ── Quick Actions ── */}
          <section className="lg:col-span-1">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-lexend text-xl font-bold text-slate-900">Duty Operations</h2>
              <p className="mt-1 text-sm text-slate-500">Essential tools for your current roster.</p>
              
              <div className="mt-6 flex flex-col gap-3">
                <QuickAction 
                  title="Log Inmate Behavior" 
                  desc="Quick entry for shift observations" 
                  icon={ClipboardList} 
                  href="/officer-page/behavior-logs" 
                  color="bg-teal-700" 
                />
                <QuickAction 
                  title="Search Inmate Profile" 
                  desc="Access records and photo logs" 
                  icon={Users2} 
                  href="/officer-page/inmate" 
                  color="bg-blue-700" 
                />
                <QuickAction 
                  title="Generate Shift Report" 
                  desc="Summarize current observations" 
                  icon={FileText} 
                  href="#" 
                  color="bg-slate-800" 
                />
                <QuickAction 
                  title="Incident Protocols" 
                  desc="Security guidelines and SOPs" 
                  icon={ShieldCheck} 
                  href="#" 
                  color="bg-rose-700" 
                />
              </div>
            </div>
          </section>

          {/* ── System Monitoring ── */}
          <section className="lg:col-span-2">
            <div className="h-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-lexend text-xl font-bold text-slate-900">System Monitoring</h2>
                  <p className="mt-1 text-sm text-slate-500">Live operational status and alerts.</p>
                </div>
                <button 
                  onClick={fetchStats}
                  className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-teal-700"
                >
                  <Activity size={20} />
                </button>
              </div>

              <div className="mt-8 space-y-6">
                <div className="flex items-start gap-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
                    dbStatus === 'stable' ? 'bg-teal-50 text-teal-700' : 
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
                        ? "Frontend is synchronized with the main database. Real-time updates are enabled."
                        : dbStatus === 'checking'
                        ? "Verifying connection to secure services..."
                        : "System offline. Reconnecting to primary BJMP servers."}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 border-t border-slate-50 pt-6">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    stats.securityFlags > 0 ? 'bg-rose-50 text-rose-700' : 'bg-teal-50 text-teal-700'
                  }`}>
                    <ShieldCheck size={18} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-900">Security Posture</h4>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                        stats.securityFlags > 0 ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>
                        {stats.securityFlags > 0 ? 'Review Needed' : 'Nominal'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {stats.securityFlags > 0 
                        ? `There are ${stats.securityFlags} incidents or poor behavior ratings registered in current cycle.`
                        : "No critical incidents logged for the current shift. All units remain secure."}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 border-t border-slate-50 pt-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                    <Activity size={18} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-900">Duty Terminal Load</h4>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 uppercase tracking-wider border border-emerald-100">Optimal</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div 
                        className="h-full bg-teal-600 transition-all duration-1000 shadow-[0_0_8px_rgba(13,148,136,0.5)]" 
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

              <div className="mt-10 rounded-2xl bg-linear-to-br from-[#0d3b38] to-[#134e4a] p-5 text-white">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-teal-200">Incident Command</p>
                    <h3 className="text-lg font-bold">Officer Status: Active</h3>
                  </div>
                  <ShieldCheck size={32} className="text-teal-300/30" />
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 text-xs font-medium text-teal-100">
                  <div className="flex items-center gap-1.5">
                    <div className="size-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                    Duty Log Active
                  </div>
                  <span>Last Audit: {lastAuditTime ? "Just now" : "Pending..."}</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </OfficerSidebarLayout>
  );
}
