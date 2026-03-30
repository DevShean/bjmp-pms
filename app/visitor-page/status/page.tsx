"use client";

import { useEffect, useState } from "react";
import VisitorHeader from "../../components/VisitorHeader";
import VisitorSidebar from "../../components/VisitorSidebar";
import { supabase } from "../../../lib/supabase/client";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Clock, CheckCircle2, XCircle, Search, Filter, Lock } from "lucide-react";

// session helper
function getSession(): { userId: number; email: string } | null {
  try {
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("bjmp_session="));
    if (!cookie) return null;
    const raw = decodeURIComponent(cookie.split("=")[1]);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

type VisitRecord = {
  visitId: number;
  inmateName: string;
  visitType: string;
  scheduledDate: string;
  status: string;
  requiresGuardianApproval: boolean;
  createdAt: string;
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

export default function VisitStatusPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sessionUser, setSessionUser] = useState<{ userId: number; email: string; name?: string } | null>(null);
  
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    const session = getSession();
    if (!session) return;
    
    const loadSessionAndData = async () => {
      setIsLoading(true);
      try {
        // 1. Get profile name
        const { data: profile } = await supabase
          .from("profiles")
          .select("firstname, lastname")
          .eq("user_id", session.userId)
          .maybeSingle();

        const name = profile ? `${profile.firstname || ""} ${profile.lastname || ""}`.trim() : "Visitor";
        setSessionUser({ ...session, name });

        // 2. Get visitor record
        const { data: visitor } = await supabase
          .from("visitors")
          .select("visitor_id")
          .eq("user_id", session.userId)
          .maybeSingle();

        if (visitor) {
          // 3. fetch visits
          const { data, error } = await supabase
            .from("visitations")
            .select(`
              visit_id, visit_type, scheduled_date, status, notes, created_at,
              inmates (first_name, last_name)
            `)
            .eq("visitor_id", visitor.visitor_id)
            .order("created_at", { ascending: false });

          if (error) throw error;
          
          if (data) {
            // Assert type to handle Supabase generic relation type inference
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

            const mapped = visitData.map((v) => {
              let requiresGuardianApproval = false;
              if (v.notes) {
                try {
                  const p = JSON.parse(v.notes);
                  requiresGuardianApproval = !!p.pending_guardian_approval;
                }catch{}
              }
              const inmateRecord = Array.isArray(v.inmates) ? v.inmates[0] : v.inmates;
              const inmateName = inmateRecord 
                 ? `${inmateRecord.first_name || ""} ${inmateRecord.last_name || ""}`.trim() 
                 : "Unknown PDL";

              return {
                visitId: v.visit_id,
                inmateName,
                visitType: v.visit_type,
                scheduledDate: v.scheduled_date,
                status: v.status,
                createdAt: v.created_at,
                requiresGuardianApproval
              }
            });
            setVisits(mapped);
          }
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load visit statuses.");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSessionAndData();
  }, []);

  const filtered = visits.filter((v) => {
    const s = searchTerm.toLowerCase();
    const matchSearch = v.inmateName.toLowerCase().includes(s) || v.visitType.toLowerCase().includes(s);
    const matchStatus = statusFilter === "All" || v.status === statusFilter || 
                        (statusFilter === "Awaiting Guardian" && v.status === "Pending" && v.requiresGuardianApproval);
    
    if (statusFilter === "Pending" && v.status === "Pending" && v.requiresGuardianApproval) return false;
                        
    return matchSearch && matchStatus;
  });

  const totalFiltered = filtered.length;
  const totalPages = Math.ceil(totalFiltered / pageSize);
  const paginatedRequests = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex min-h-screen w-full bg-linear-to-br from-slate-50 via-white to-blue-50/30">
      <VisitorSidebar
        sessionUser={{ name: sessionUser?.name || "Visitor Account", email: sessionUser?.email || "visitor@bjmp.portal" }}
        isCollapsed={isSidebarCollapsed}
      />

      <div className="flex flex-1 flex-col pb-12">
        <VisitorHeader
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          sessionUser={{ name: sessionUser?.name || "Visitor Account", email: sessionUser?.email || "visitor@bjmp.portal" }}
        />

        <main className="flex-1 px-4 py-8 md:px-8">
          <div className="mx-auto max-w-5xl space-y-6">
            <div className="group relative overflow-hidden rounded-3xl bg-linear-to-br from-[#0a1e47] via-[#0f2f6a] to-[#1e4b8f] p-8 shadow-2xl">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.14),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.08),transparent_30%),radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.12),transparent_38%)] opacity-60" />
              <div className="relative z-10">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm mb-4">
                  <ShieldCheck className="h-6 w-6 text-blue-100" />
                </div>
                <h1 className="font-lexend text-3xl font-bold text-white md:text-3xl">Visit Status</h1>
                <p className="mt-2 text-blue-100/90 text-sm md:text-base max-w-xl">
                  Monitor the status of your submitted visitation requests and view your upcoming appointment schedule.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white/90 shadow-xl shadow-slate-200/50 backdrop-blur-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-200/60 bg-white/60">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="font-lexend text-xl font-semibold text-slate-800">
                    Your Requests
                  </h2>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    {/* Search */}
                    <div className="relative">
                      <Search className="pointer-events-none absolute inset-y-0 left-3 h-full w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search PDL or type…"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-slate-50/50 focus:bg-white transition-all sm:w-64"
                      />
                    </div>
                    {/* Filter */}
                    <div className="relative">
                      <Filter className="pointer-events-none absolute inset-y-0 left-3 h-full w-4 text-slate-400" />
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="pl-9 pr-8 py-2 appearance-none border border-slate-200 rounded-lg text-sm text-slate-700 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all cursor-pointer font-medium"
                      >
                        <option value="All">All Statuses</option>
                        <option value="Pending">Pending Review</option>
                        <option value="Awaiting Guardian">Awaiting Guardian</option>
                        <option value="Approved">Approved</option>
                        <option value="Denied">Denied</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-16 text-slate-400">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Loading your requests…
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="py-16 text-center text-sm text-slate-500">
                    <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                    No requests found matching your criteria.
                  </div>
                ) : (
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/60">
                        <th className="py-3 pl-6 pr-4 font-semibold uppercase tracking-wide text-slate-500 text-[11px]">
                          Visit Details
                        </th>
                        <th className="px-4 py-3 font-semibold uppercase tracking-wide text-slate-500 text-[11px]">
                          Requested Date & Time
                        </th>
                        <th className="px-4 py-3 font-semibold uppercase tracking-wide text-slate-500 text-[11px]">
                          Status
                        </th>
                        <th className="py-3 pl-4 pr-6 text-right font-semibold uppercase tracking-wide text-slate-500 text-[11px]">
                          Submitted On
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedRequests.map((req, idx) => (
                        <tr key={req.visitId} className={`${idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"} hover:bg-blue-50/30 transition-colors`}>
                          <td className="py-4 pl-6 pr-4">
                            <p className="font-medium text-slate-800">{req.visitType}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Visiting: <span className="font-medium">{req.inmateName}</span></p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="font-semibold text-slate-700">
                              {new Date(req.scheduledDate).toLocaleDateString("en-PH", {
                                year: "numeric", month: "short", day: "numeric"
                              })}
                            </p>
                            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-1">
                              <Clock className="h-3.5 w-3.5 text-slate-400" />
                              {new Date(req.scheduledDate).toLocaleTimeString("en-PH", {
                                hour: "numeric", minute: "2-digit"
                              })}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <StatusBadge status={req.status} requiresGuardianApproval={req.requiresGuardianApproval} />
                          </td>
                          <td className="py-4 pl-4 pr-6 text-right text-xs text-slate-400">
                            {new Date(req.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              {totalFiltered > 0 && !isLoading && (
                <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 bg-white">
                  <div className="flex items-center gap-6 text-sm text-slate-600">
                    <p>
                      Page {currentPage} of {totalPages || 1}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="font-medium hidden sm:inline">Rows per page:</span>
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="appearance-none border border-slate-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                      >
                        {[5, 10, 30, 50].map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}