"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase/client";
import { toast } from "sonner";
import { useVisitor } from "./layout";
import { 
  CalendarDays, 
  Clock, 
  CheckCircle2, 
  CalendarPlus, 
  History, 
  UserCog, 
  ArrowRight,
  Loader2,
  Calendar,
  XCircle,
  Lock,
  CalendarHeart
} from "lucide-react";

type VisitRecord = {
  visitId: number;
  inmateName: string;
  visitType: string;
  scheduledDate: string;
  status: string;
  requiresGuardianApproval: boolean;
  createdAt: string;
};

type DashboardStats = {
  completed: number;
  upcoming: number;
  pending: number;
};

const statusStyles: Record<string, string> = {
  "Pending": "bg-amber-50 text-amber-700 border-amber-200",
  "Pending (Awaiting Guardian)": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Approved": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Denied": "bg-rose-50 text-rose-700 border-rose-200",
  "Completed": "bg-blue-50 text-blue-700 border-blue-200",
  "Cancelled": "bg-slate-100 text-slate-700 border-slate-300",
};

const statusIcons: Record<string, React.ReactNode> = {
  "Pending": <Clock className="h-3.5 w-3.5" />,
  "Pending (Awaiting Guardian)": <Lock className="h-3.5 w-3.5" />,
  "Approved": <CheckCircle2 className="h-3.5 w-3.5" />,
  "Denied": <XCircle className="h-3.5 w-3.5" />,
  "Completed": <CheckCircle2 className="h-3.5 w-3.5" />,
  "Cancelled": <XCircle className="h-3.5 w-3.5" />,
};

function StatusBadge({ status, requiresGuardianApproval }: { status: string, requiresGuardianApproval: boolean }) {
  const displayStatus = (status === "Pending" && requiresGuardianApproval) 
    ? "Pending (Awaiting Guardian)" 
    : status;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[displayStatus] || statusStyles["Pending"]}`}
    >
      {statusIcons[displayStatus] || statusIcons["Pending"]}
      {displayStatus}
    </span>
  );
}

export default function VisitorPage() {
  const { sessionUser, isLoading: isLayoutLoading } = useVisitor();
  const [isLoading, setIsLoading] = useState(true);
  const [recentVisits, setRecentVisits] = useState<VisitRecord[]>([]);
  const [nextAppointment, setNextAppointment] = useState<VisitRecord | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    completed: 0,
    upcoming: 0,
    pending: 0,
  });

  // Pagination states for Recent Activity
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!sessionUser) return;
      setIsLoading(true);
      try {
        // 1. Get visitor record
        const { data: visitor } = await supabase
          .from("visitors")
          .select("visitor_id")
          .eq("user_id", sessionUser.userId)
          .maybeSingle();

        if (visitor) {
          // 2. Fetch visits
          const { data, error } = await supabase
            .from("visitations")
            .select(`
              visit_id, visit_type, scheduled_date, status, notes, created_at,
              inmates (first_name, last_name)
            `)
            .eq("visitor_id", visitor.visitor_id)
            .order("scheduled_date", { ascending: false });

          if (error) throw error;
          
          if (data) {
            type InmateData = { first_name: string | null; last_name: string | null };
            type VisitRow = {
              visit_id: number;
              visit_type: string;
              scheduled_date: string;
              status: string;
              notes: string | null;
              created_at: string;
              inmates: InmateData | InmateData[] | null;
            };
            const visitData = data as unknown as VisitRow[];

            let completed = 0;
            let upcomingCount = 0;
            let pendingCount = 0;
            let closestNextAppt: VisitRecord | null = null;
            const now = new Date();

            const mapped: VisitRecord[] = visitData.map((v) => {
              let requiresGuardianApproval = false;
              if (v.notes) {
                try {
                  const p = JSON.parse(v.notes);
                  requiresGuardianApproval = !!p.pending_guardian_approval;
                } catch {}
              }
              const inmateRecord = Array.isArray(v.inmates) ? v.inmates[0] : v.inmates;
              const inmateName = inmateRecord 
                 ? `${inmateRecord.first_name || ""} ${ inmateRecord.last_name || "" }`.trim() 
                 : "Unknown PDL";

              const scheduledFor = new Date(v.scheduled_date);

              // Calculate stats
              if (v.status === "Completed") completed++;
              if (v.status === "Pending") pendingCount++;
              const isToday = scheduledFor.toDateString() === now.toDateString();
              if (v.status === "Approved" && (scheduledFor > now || isToday)) {
                upcomingCount++;
                if (!closestNextAppt || scheduledFor < new Date(closestNextAppt.scheduledDate)) {
                  closestNextAppt = {
                    visitId: v.visit_id,
                    inmateName,
                    visitType: v.visit_type,
                    scheduledDate: v.scheduled_date,
                    status: v.status,
                    createdAt: v.created_at,
                    requiresGuardianApproval
                  };
                }
              }

              return {
                visitId: v.visit_id,
                inmateName,
                visitType: v.visit_type,
                scheduledDate: v.scheduled_date,
                status: v.status,
                createdAt: v.created_at,
                requiresGuardianApproval
              };
            });

            // Sort mapped by createdAt for recents
            const recents = [...mapped].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            setStats({
              completed,
              upcoming: upcomingCount,
              pending: pendingCount
            });
            setNextAppointment(closestNextAppt);
            setRecentVisits(recents);
          }
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (!isLayoutLoading) {
      loadDashboardData();
    }
  }, [sessionUser, isLayoutLoading]);

  const totalPages = Math.ceil(recentVisits.length / pageSize);
  const paginatedVisits = recentVisits.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <main className="flex-1 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        
        {/* Header Section */}
        <div className="group relative overflow-hidden rounded-3xl bg-linear-to-br from-[#0a1e47] via-[#0f2f6a] to-[#1e4b8f] p-8 shadow-2xl">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.14),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.08),transparent_30%),radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.12),transparent_38%)] opacity-60" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-blue-200/90 font-medium tracking-wide text-sm mb-1 uppercase">
                {currentDate}
              </p>
              <h1 className="font-lexend text-xl font-bold text-white md:text-3xl mt-1 truncate max-w-[280px] sm:max-w-md" title={`Welcome back, ${sessionUser?.name || "Visitor"}`}>
                Welcome back, {sessionUser?.name || "Visitor"}
              </h1>
              <p className="mt-3 text-blue-100/90 text-xs md:text-sm max-w-xl">
                Manage your upcoming visitations, track approval statuses, or schedule new appointments seamlessly.
              </p>
            </div>
            <div className="shrink-0 flex gap-3 md:w-auto">
              <Link href="/visitor-page/appointments" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-[#0f2f6a] shadow-lg transition-all hover:bg-blue-50 hover:shadow-xl hover:scale-105 group md:px-5 md:py-2.5 md:text-sm">
                <CalendarPlus className="h-4 w-4 transition-transform group-hover:-rotate-12" />
                Schedule Visit
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="hidden md:grid gap-4 sm:grid-cols-3">
           <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
             <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Completed Visits</p>
                  <p className="mt-2 text-2xl font-bold text-[#0f2f6a]">{isLoading ? "-" : stats.completed}</p>
                </div>
                <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
             </div>
           </div>

           <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
             <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Upcoming Visits</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-600">{isLoading ? "-" : stats.upcoming}</p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                  <CalendarDays className="h-5 w-5" />
                </div>
             </div>
           </div>

           <div className="relative overflow-hidden rounded-2xl border border-amber-100 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
             <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Pending Requests</p>
                  <p className="mt-2 text-2xl font-bold text-amber-600">{isLoading ? "-" : stats.pending}</p>
                </div>
                <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                  <Clock className="h-5 w-5" />
                </div>
             </div>
           </div>
        </div>

        {/* Next Appointment Section */}
        <div className="space-y-4">
           <h2 className="font-lexend text-lg font-semibold text-slate-800">Your Next Appointment</h2>
           <div className="rounded-3xl border border-blue-200/60 bg-white p-6 shadow-xl shadow-blue-100/50 relative overflow-hidden h-full min-h-[220px] flex flex-col justify-center">
              <div className="absolute right-0 top-0 -mr-16 -mt-16 text-blue-50 opacity-40 mix-blend-multiply pointer-events-none">
                 <CalendarHeart className="h-64 w-64" />
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center text-slate-400">
                   <Loader2 className="h-6 w-6 animate-spin mb-3" />
                   <p className="text-sm">Loading appointment...</p>
                </div>
              ) : nextAppointment ? (
                <div className="relative z-10 w-full">
                  <div className="flex items-center justify-between mb-6">
                     <div className="flex items-center gap-4">
                       <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 ring-2 ring-emerald-50">
                         <CalendarDays className="h-6 w-6" />
                       </div>
                       <div>
                         <p className="font-medium text-emerald-600 text-[11px] uppercase tracking-wider mb-0.5">Approved & Scheduled</p>
                         <p className="font-bold text-xl text-slate-800 tracking-tight leading-none">
                           {new Date(nextAppointment.scheduledDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                         </p>
                       </div>
                     </div>
                  </div>
                  <div className="rounded-2xl bg-linear-to-br from-slate-50 to-white border border-slate-100 p-5 border-l-4 border-l-emerald-500 grid md:grid-cols-2 gap-5 shadow-sm">
                     <div>
                       <p className="text-[11px] text-slate-400 uppercase tracking-widest font-semibold mb-1.5 flex items-center gap-1.5"><UserCog className="h-3 w-3"/> PDL Details</p>
                       <p className="font-semibold text-slate-800 text-base">{nextAppointment.inmateName}</p>
                       <p className="text-xs text-slate-500 mt-0.5">{nextAppointment.visitType}</p>
                     </div>
                     <div>
                       <p className="text-[11px] text-slate-400 uppercase tracking-widest font-semibold mb-1.5 flex items-center gap-1.5"><Clock className="h-3 w-3"/> Visiting Time</p>
                       <p className="font-semibold text-slate-800 flex items-center gap-2 text-base">
                         {new Date(nextAppointment.scheduledDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                       </p>
                     </div>
                  </div>
                </div>
              ) : (
                <div className="relative z-10 flex flex-col items-center justify-center text-center">
                   <div className="rounded-full bg-slate-50 p-4 mb-3 border border-slate-100">
                     <Calendar className="h-8 w-8 text-slate-300" />
                   </div>
                   <h3 className="text-lg font-semibold text-slate-700">No Upcoming Appointments</h3>
                   <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">You do not have any approved visitations coming up.</p>
                   <Link href="/visitor-page/appointments" className="mt-5 rounded-xl bg-blue-50 px-5 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors inline-flex items-center gap-2 group">
                     Schedule a Visit <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                   </Link>
                </div>
              )}
           </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="font-lexend text-lg font-semibold text-slate-800 flex items-center gap-2">
              <History className="h-5 w-5 text-slate-400" /> Recent Activity
            </h2>
            <Link href="/visitor-page/status" className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 group bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
              View full history <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white/90 shadow-lg shadow-slate-200/40 backdrop-blur-sm overflow-hidden">
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-12 text-slate-400">
                   <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                   Loading recent activities…
                </div>
              ) : recentVisits.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500 flex flex-col items-center">
                  <div className="rounded-full bg-slate-50 p-3 mb-3 border border-slate-100">
                    <History className="h-6 w-6 text-slate-300" />
                  </div>
                  History is empty. You have not submitted any visitation requests yet.
                </div>
              ) : (
                <>
                  <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-track-slate-50 scrollbar-thumb-slate-200">
                    <table className="w-full text-xs text-left min-w-[600px]">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-100">
                          <th className="py-3.5 pl-6 pr-4 font-semibold uppercase tracking-wider text-slate-500 text-[10px]">
                            Visit Details
                          </th>
                          <th className="px-4 py-3.5 font-semibold uppercase tracking-wider text-slate-500 text-[10px]">
                            Requested Date
                          </th>
                          <th className="px-4 py-3.5 font-semibold uppercase tracking-wider text-slate-500 text-[10px]">
                            Status
                          </th>
                          <th className="py-3.5 pl-4 pr-6 text-right font-semibold uppercase tracking-wider text-slate-500 text-[10px]">
                            Submitted On
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paginatedVisits.map((req, idx) => (
                          <tr key={req.visitId} className={`${idx % 2 === 0 ? "bg-white" : "bg-slate-200"} hover:bg-blue-50/30 transition-colors`}>
                            <td className="py-3.5 pl-6 pr-4">
                              <p className="font-semibold text-slate-800 text-xs">{req.visitType}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">Visiting: <span className="font-medium text-slate-600">{req.inmateName}</span></p>
                            </td>
                            <td className="px-4 py-3.5">
                              <p className="font-medium text-slate-700">
                                {new Date(req.scheduledDate).toLocaleDateString("en-PH", {
                                  year: "numeric", month: "short", day: "numeric"
                                })}
                              </p>
                            </td>
                            <td className="px-4 py-3.5">
                              <StatusBadge status={req.status} requiresGuardianApproval={req.requiresGuardianApproval} />
                            </td>
                            <td className="py-3.5 pl-4 pr-6 text-right text-[10px] text-slate-400 font-medium">
                              {new Date(req.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 bg-white">
                    <div className="flex items-center gap-6 text-[10px] text-slate-600 sm:text-xs">
                      <p>Page {currentPage} of {totalPages || 1}</p>
                      <div className="flex items-center gap-2">
                        <span className="font-medium hidden sm:inline">Rows:</span>
                        <select 
                          value={pageSize}
                          onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          className="appearance-none border border-slate-200 rounded-md px-1.5 py-0.5 bg-white text-[10px] sm:text-xs focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                        >
                          {[5, 10, 20].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="rounded-md border border-slate-200 px-2 py-1 text-[10px] sm:text-xs text-slate-700 disabled:opacity-50 hover:bg-slate-50 transition-colors"
                      >
                        Prev
                      </button>
                      <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="rounded-md border border-slate-200 px-2 py-1 text-[10px] sm:text-xs text-slate-700 disabled:opacity-50 hover:bg-slate-50 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              )
              }
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}