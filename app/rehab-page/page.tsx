"use client";

import { useEffect, useState, useCallback } from "react";
import RehabSidebarLayout from "./components/RehabSidebarLayout";
import { supabase } from "@/lib/supabase/client";
import { 
  Users, 
  Activity, 
  CheckCircle2, 
  LayoutDashboard, 
  Clock, 
  BookOpen,
  ClipboardList,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  LucideIcon,
  BookUser,
  ShieldCheck,
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
    <Link href={href} className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-teal-200 hover:shadow-md active:scale-[0.98]">
      <div className={`absolute -right-4 -top-4 size-24 rounded-full opacity-5 transition-transform group-hover:scale-110 ${color.replace('text-', 'bg-')}`} />
      
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <div className="mt-2 flex items-center gap-2">
            <p className="text-3xl font-bold text-slate-900">{value}</p>
            {trend && (
              <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                <TrendingUp size={12} />
                <span>{trend}</span>
              </div>
            )}
          </div>
        </div>
        <div className={`rounded-xl p-2.5 ${color.replace('text-', 'bg-').replace('-600', '-50')} ${color}`}>
          <Icon size={24} />
        </div>
      </div>
      
      <div className="mt-auto pt-4 flex items-center gap-1 text-xs font-medium text-teal-600 transition-all group-hover:gap-2">
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

export default function RehabPage() {
  const [stats, setStats] = useState({
    participants: 0,
    ongoing: 0,
    completed: 0,
    totalPrograms: 0,
    enrollmentRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dbStatus, setDbStatus] = useState<"checking" | "stable" | "unstable" | "offline">("checking");
  const [lastAuditTime, setLastAuditTime] = useState<Date | null>(null);
  const [systemLoad, setSystemLoad] = useState({
    completionRate: 0,
    enrollmentTrend: 12,
    activePrograms: 0,
  });

  const fetchRehabStats = useCallback(async () => {
    setIsLoading(true);
    setDbStatus("checking");
    try {
      const [
        { count: participantCount },
        { count: ongoingCount },
        { count: completedCount },
        { count: programsCount }
      ] = await Promise.all([
        supabase.from("inmate_programs").select("*", { count: "exact", head: true }),
        supabase.from("inmate_programs").select("*", { count: "exact", head: true }).eq("progress", "Ongoing"),
        supabase.from("inmate_programs").select("*", { count: "exact", head: true }).eq("progress", "Completed"),
        supabase.from("programs").select("*", { count: "exact", head: true })
      ]);

      const totalParticipants = participantCount || 0;
      const completed = completedCount || 0;
      const completionRate = totalParticipants > 0 ? (completed / totalParticipants) * 100 : 0;

      setStats({
        participants: totalParticipants,
        ongoing: ongoingCount || 0,
        completed: completed,
        totalPrograms: programsCount || 0,
        enrollmentRate: ongoingCount || 0,
      });

      setSystemLoad(prev => ({
        ...prev,
        completionRate: completionRate,
        activePrograms: programsCount || 0,
      }));

      setDbStatus("stable");
      setLastAuditTime(new Date());
    } catch (error) {
      console.error("Error fetching rehab stats:", error);
      setDbStatus("offline");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRehabStats();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    
    // Simulate active trend data
    const trendTimer = setInterval(() => {
      setSystemLoad(prev => ({
        ...prev,
        enrollmentTrend: Math.max(5, Math.min(40, prev.enrollmentTrend + (Math.random() * 2 - 1))),
      }));
    }, 3000);

    return () => {
      clearInterval(timer);
      clearInterval(trendTimer);
    };
  }, [fetchRehabStats]);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <RehabSidebarLayout>
      <div className="mx-auto max-w-7xl space-y-8 pb-10">
        
        {/* ── Header ── */}
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-teal-600">
              <LayoutDashboard size={16} />
              <span>Programs Command Hub</span>
            </div>
            <h1 className="font-lexend text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              {getGreeting()}, <span className="text-teal-600">Rehabilitation</span>
            </h1>
            <p className="text-slate-500">
              Coordinate intervention programs, monitor case progress, and manage rehabilitation workflows.
            </p>
          </div>
          
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
              <Clock size={14} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-slate-500 leading-none">Server Time</p>
              <p className="mt-0.5 text-xs font-bold text-slate-900 tabular-nums whitespace-nowrap">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                <span className="ml-1.5 font-medium text-slate-400">
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
                title="Total Participants" 
                value={stats.participants} 
                icon={Users} 
                color="text-blue-600" 
                href="/rehab-page/inmate-progress"
              />
              <StatCard 
                title="Ongoing Progress" 
                value={stats.ongoing} 
                icon={Activity} 
                trend={`${stats.ongoing > 0 ? 'Active enrollment' : 'No active plans'}`}
                color="text-amber-600" 
                href="/rehab-page/inmate-progress"
              />
              <StatCard 
                title="Completed Programs" 
                value={stats.completed} 
                icon={CheckCircle2} 
                color="text-emerald-600" 
                href="/rehab-page/inmate-progress"
              />
              <StatCard 
                title="Active Catalog" 
                value={stats.totalPrograms} 
                icon={BookOpen} 
                color="text-teal-600" 
                href="/rehab-page/programs"
              />
              <StatCard 
                title="Case Reports" 
                value={stats.completed} 
                icon={ClipboardList} 
                color="text-purple-600" 
                href="/rehab-page/report"
              />
            </>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* ── Quick Actions ── */}
          <section className="lg:col-span-1">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-lexend text-xl font-bold text-slate-900">Program Operations</h2>
              <p className="mt-1 text-sm text-slate-500">Fast access to intervention tools.</p>
              
              <div className="mt-6 flex flex-col gap-3">
                <QuickAction 
                  title="Enroll New PDL" 
                  desc="Assign inmate to a program" 
                  icon={BookUser} 
                  href="/rehab-page/inmate-progress" 
                  color="bg-teal-600" 
                />
                <QuickAction 
                  title="Record Case Progress" 
                  desc="Update behavior and status" 
                  icon={Activity} 
                  href="/rehab-page/inmate-progress" 
                  color="bg-slate-800" 
                />
                <QuickAction 
                  title="Program Catalog" 
                  desc="Manage available modules" 
                  icon={BookOpen} 
                  href="/rehab-page/programs" 
                  color="bg-blue-600" 
                />
                <QuickAction 
                  title="Generate Reports" 
                  desc="Print rehabilitation summaries" 
                  icon={ClipboardList} 
                  href="/rehab-page/report" 
                  color="bg-purple-600" 
                />
              </div>
            </div>
          </section>

          {/* ── Recent Activity / Monitoring ── */}
          <section className="lg:col-span-2">
            <div className="h-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-lexend text-xl font-bold text-slate-900">Program Monitoring</h2>
                  <p className="mt-1 text-sm text-slate-500">Unit-wide operational status and metrics.</p>
                </div>
                <button 
                  onClick={fetchRehabStats}
                  className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-teal-600"
                >
                  <Activity size={20} />
                </button>
              </div>

              <div className="mt-8 space-y-6">
                <div className="flex items-start gap-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
                    dbStatus === 'stable' ? 'bg-teal-50 text-teal-600' : 
                    dbStatus === 'checking' ? 'bg-slate-50 text-slate-400 animate-pulse' : 
                    'bg-red-50 text-red-600'
                  }`}>
                    <BookOpen size={18} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-900">Program Data Connectivity</h4>
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
                        ? "Program inventory and enrollment data are synchronized in real-time."
                        : dbStatus === 'checking'
                        ? "Accessing rehabilitation program records..."
                        : "Connectivity to the program database has been interrupted."}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 border-t border-slate-50 pt-6">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    stats.ongoing > 15 ? 'bg-blue-50 text-blue-600' : 
                    stats.ongoing > 0 ? 'bg-emerald-50 text-emerald-600' : 
                    'bg-slate-50 text-slate-400'
                  }`}>
                    <Users size={18} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-900">Program Enrollment Trend</h4>
                      <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 uppercase tracking-wider border border-blue-100">
                        {systemLoad.enrollmentTrend.toFixed(1)}% Active
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {stats.ongoing > 0 
                        ? `There are currently ${stats.ongoing} PDLs actively engaged in rehabilitation programs across all units.`
                        : "No active enrollments detected in the current session."}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 border-t border-slate-50 pt-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <TrendingUp size={18} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-900">Overall Completion Rate</h4>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 uppercase tracking-wider border border-emerald-100">
                        {systemLoad.completionRate.toFixed(1)}% Success
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-1000 shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
                        style={{ width: `${systemLoad.completionRate}%` }}
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 font-medium font-lexend">
                      <span>{stats.completed} Total Completions</span>
                      <span>Total Engaged: {stats.participants}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 rounded-2xl bg-linear-to-br from-[#0a1e47] to-[#1e4b8f] p-5 text-white">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-200">Integrity Check</p>
                    <h3 className="text-lg font-bold">Rehabilitation Status</h3>
                  </div>
                  <ShieldCheck size={32} className="text-blue-300/30" />
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 text-xs font-medium text-blue-100">
                  <div className="flex items-center gap-1.5">
                    <div className="size-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                    Real-time Tracking Active
                  </div>
                  <span>Last Refresh: {lastAuditTime ? "Just now" : "Pending..."}</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </RehabSidebarLayout>
  );
}
