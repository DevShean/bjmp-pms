"use client";

import { useCallback, useEffect, useState } from "react";
import AdminSidebarLayout from "../components/AdminSidebarLayout";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  Search,
  Users,
  CalendarCheck,
  XCircle,
  Filter,
  FilterX,
  Loader2,
  Lock,
  ChevronDown,
  Check,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Types ────────────────────────────────────────────────────────────────────

type VisitationStatus = "Pending" | "Approved" | "Denied" | "Completed" | "Cancelled";

type VisitationRow = {
  visit_id: number;
  inmate_id: number;
  visitor_id: number;
  visit_type: string;
  relationship: string;
  scheduled_date: string;
  status: VisitationStatus;
  notes: string | null;
  created_at: string;
  visitors: {
    user_id: number;
    users: {
      username: string;
      email: string;
    } | null;
  } | null;
  inmates: {
    first_name: string | null;
    last_name: string | null;
    cell_block: string | null;
  } | null;
};

type FlatVisit = {
  visitId: number;
  visitorId: number;
  inmateId: number;
  visitorName: string;
  visitorEmail: string;
  pdlName: string;
  cellBlock: string;
  visitType: string;
  relationship: string;
  scheduledDate: string;
  status: VisitationStatus;
  createdAt: string;
  requiresGuardianApproval: boolean;
};

// ─── Status badge ─────────────────────────────────────────────────────────────

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

// ─── Summary card ─────────────────────────────

function SummaryCard({
  title,
  value,
  icon,
  tone,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <article className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className={`mt-1 text-3xl font-semibold ${tone}`}>{value}</p>
      </div>
    </article>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VisitationRequestsPage() {
  const [requests, setRequests] = useState<FlatVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilterOpen, setStatusFilterOpen] = useState(false);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // ── Fetch ──
  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    try {
      const { data, error } = await supabase
        .from("visitations")
        .select(`
          visit_id,
          visitor_id,
          inmate_id,
          visit_type,
          relationship,
          scheduled_date,
          status,
          notes,
          created_at,
          visitors (
            user_id,
            users (
              username,
              email
            )
          ),
          inmates (
            first_name,
            last_name,
            cell_block
          )
        `)
        .order("scheduled_date", { ascending: false });

      if (error) throw error;

      const flat: FlatVisit[] = ((data ?? []) as unknown as VisitationRow[]).map((r) => {
        let requiresGuardianApproval = false;
        try {
          if (r.notes) {
            const parsed = JSON.parse(r.notes);
            requiresGuardianApproval = !!parsed.pending_guardian_approval;
          }
        } catch {
          // ignore parsing error
        }

        return {
          visitId: r.visit_id,
          visitorId: r.visitor_id,
          inmateId: r.inmate_id,
          visitorName: r.visitors?.users?.username || "Unknown Visitor",
          visitorEmail: r.visitors?.users?.email || "",
          pdlName: r.inmates
            ? `${r.inmates.first_name || ""} ${r.inmates.last_name || ""}`.trim()
            : `PDL #${r.inmate_id}`,
          cellBlock: r.inmates?.cell_block || "Unassigned",
          visitType: r.visit_type,
          relationship: r.relationship,
          scheduledDate: r.scheduled_date,
          status: r.status,
          createdAt: r.created_at,
          requiresGuardianApproval,
        };
      });

      setRequests(flat);
    } catch (err) {
      console.error("Error fetching visitation requests:", err);
      toast.error("Failed to load visitation requests.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // ── Notify Visitor Helper ──
  const notifyVisitor = async (visitorId: number, title: string, message: string) => {
    const { data: visitorRow } = await supabase
      .from("visitors")
      .select("user_id")
      .eq("visitor_id", visitorId)
      .maybeSingle<{ user_id: number }>();

    if (visitorRow?.user_id) {
      await supabase.from("notifications").insert({
        user_id: visitorRow.user_id,
        title,
        message,
        type: "visitation_request",
      });
    }
  };

  // ── Approve ──
  const handleApprove = async (req: FlatVisit) => {
    if (req.requiresGuardianApproval) return; // safeguard

    try {
      setProcessingId(req.visitId);

      const { error } = await supabase
        .from("visitations")
        .update({ status: "Approved" })
        .eq("visit_id", req.visitId);

      if (error) throw error;

      await notifyVisitor(
        req.visitorId,
        "Visitation Request Approved",
        `Your request to visit ${req.pdlName} on ${new Date(req.scheduledDate).toLocaleDateString()} has been approved.`
      );

      toast.success(`Approved visitation for ${req.visitorName}.`);
      fetchRequests();
    } catch (err) {
      console.error("Approve error:", err);
      toast.error("Failed to approve visitation.");
    } finally {
      setProcessingId(null);
    }
  };

  // ── Deny ──
  const handleDeny = async (req: FlatVisit) => {
    try {
      setProcessingId(req.visitId);

      const { error } = await supabase
        .from("visitations")
        .update({ status: "Denied" })
        .eq("visit_id", req.visitId);

      if (error) throw error;

      await notifyVisitor(
        req.visitorId,
        "Visitation Request Denied",
        `Your request to visit ${req.pdlName} on ${new Date(req.scheduledDate).toLocaleDateString()} has been denied by the administration.`
      );

      toast.success(`Denied visitation from ${req.visitorName}.`);
      fetchRequests();
    } catch (err) {
      console.error("Deny error:", err);
      toast.error("Failed to deny visitation.");
    } finally {
      setProcessingId(null);
    }
  };

  // ── Derived counts ──
  const totalRequests = requests.length;
  const pendingCount = requests.filter((r) => r.status === "Pending" && !r.requiresGuardianApproval).length;
  const approvedCount = requests.filter((r) => r.status === "Approved").length;

  // ── Filter ──
  const filtered = requests.filter((r) => {
    const matchesSearch =
      r.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.visitorEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.pdlName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || 
                          (statusFilter === "Awaiting Guardian" && r.status === "Pending" && r.requiresGuardianApproval) ||
                          (statusFilter === "Pending" && r.status === "Pending" && !r.requiresGuardianApproval) ||
                          (statusFilter !== "Awaiting Guardian" && statusFilter !== "Pending" && (r.status as string) === statusFilter);
    return matchesSearch && matchesStatus;
  });

  const totalFiltered = filtered.length;
  const totalPages = Math.ceil(totalFiltered / pageSize);
  const paginatedRequests = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <AdminSidebarLayout>
      <section className="space-y-6">
        {/* ── Header ── */}
        <div>
          <h1 className="font-lexend text-2xl font-semibold text-slate-800 flex items-center gap-3 sm:text-3xl">
            Visitation Requests
            <CalendarCheck size={32} className="text-teal-600 shrink-0" />
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Review and manage visits scheduled by authorized visitors and PDL guardians.
          </p>
        </div>

        {/* ── Summary Cards ── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="h-8 w-12 rounded-md" />
                </div>
              </div>
            ))
          ) : (
            <>
              <SummaryCard
                title="Total Requests"
                value={String(totalRequests)}
                icon={<Users className="size-6 text-blue-500" />}
                tone="text-blue-700"
              />
              <SummaryCard
                title="Ready for Review"
                value={String(pendingCount)}
                icon={<Clock className="size-6 text-amber-500" />}
                tone="text-amber-600"
              />
              <SummaryCard
                title="Approved Visits"
                value={String(approvedCount)}
                icon={<CheckCircle2 className="size-6 text-emerald-500" />}
                tone="text-emerald-700"
              />
            </>
          )}
        </div>

        {/* ── Table card ── */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Table header with search + filter */}
          <div className="px-6 py-4 border-b border-slate-200 bg-white">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-lexend text-xl font-semibold text-slate-800">
                All Requests
              </h2>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {/* Search */}
                <div className="relative">
                  <Search className="pointer-events-none absolute inset-y-0 left-3 h-full w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search visitor or PDL…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-slate-50/50 focus:bg-white transition-all sm:w-64"
                  />
                </div>
                {/* Status filter */}
                <Popover open={statusFilterOpen} onOpenChange={setStatusFilterOpen}>
                  <PopoverTrigger className="flex min-w-44 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm font-medium text-slate-700 transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer">
                    <Filter className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className={statusFilter !== "All" ? "text-slate-700" : "text-slate-400"}>
                      {statusFilter === "All" ? "All Statuses" : statusFilter === "Awaiting Guardian" ? "Awaiting Guardian Email" : statusFilter === "Pending" ? "Pending Review" : statusFilter}
                    </span>
                    <ChevronDown size={14} className={`ml-auto shrink-0 text-slate-400 transition-transform ${statusFilterOpen ? "rotate-180" : ""}`} />
                  </PopoverTrigger>
                  <PopoverContent align="end" sideOffset={6} className="w-52 p-1">
                    {[
                      { value: "All", label: "All Statuses" },
                      { value: "Pending", label: "Pending Review" },
                      { value: "Awaiting Guardian", label: "Awaiting Guardian Email" },
                      { value: "Approved", label: "Approved" },
                      { value: "Denied", label: "Denied" },
                      { value: "Completed", label: "Completed" },
                    ].map(({ value, label }) => (
                      <button key={value} type="button" onClick={() => { setStatusFilter(value); setStatusFilterOpen(false); }} className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100">
                        <span className="flex-1 text-left">{label}</span>
                        {statusFilter === value && <Check className="h-3.5 w-3.5 text-teal-600" />}
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>
                {/* Clear filters */}
                {(searchTerm || statusFilter !== "All") && (
                  <button
                    type="button"
                    onClick={() => { setSearchTerm(""); setStatusFilter("All"); }}
                    className="cursor-pointer flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-100"
                  >
                    <FilterX size={14} />
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="divide-y divide-slate-100">
                {/* Skeleton header */}
                <div className="grid grid-cols-6 gap-4 border-b border-slate-100 bg-slate-100 px-6 py-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 rounded-md" />
                  ))}
                </div>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-6 gap-4 px-6 py-4 items-center">
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-28 rounded-md" />
                      <Skeleton className="h-3 w-32 rounded-md" />
                      <Skeleton className="h-4 w-16 rounded-md" />
                    </div>
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-24 rounded-md" />
                      <Skeleton className="h-3 w-16 rounded-md" />
                    </div>
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-20 rounded-md" />
                      <Skeleton className="h-3 w-24 rounded-md" />
                    </div>
                    <Skeleton className="h-4 w-20 rounded-md" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-7 w-16 rounded-lg" />
                      <Skeleton className="h-7 w-14 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-sm text-slate-500">
                <CalendarCheck className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                No visitation requests found.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-100">
                    <th className="py-3 pl-6 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Visitor / Relation
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      PDL
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Visit Details
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Date Requested
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                    <th className="py-3 pl-4 pr-6 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedRequests.map((req, idx) => {
                    const isProcessing = processingId === req.visitId;
                    const zebra = idx % 2 === 0 ? "bg-white" : "bg-slate-200";
                    return (
                      <tr key={req.visitId} className={`${zebra} transition-colors hover:bg-blue-50/30`}>
                        {/* Visitor */}
                        <td className="py-4 pl-6 pr-4">
                          <p className="font-medium text-slate-800">{req.visitorName}</p>
                          <p className="text-xs text-slate-500 mb-1">{req.visitorEmail}</p>
                          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 uppercase tracking-wider">
                            {req.relationship}
                          </span>
                        </td>
                        {/* PDL */}
                        <td className="px-4 py-4">
                          <p className="font-medium text-slate-800">{req.pdlName}</p>
                          <p className="text-xs text-slate-500">ID #{req.inmateId}</p>
                          <p className="text-xs text-slate-400 mt-0.5 max-w-30 truncate">{req.cellBlock}</p>
                        </td>
                        {/* Visit Details */}
                        <td className="px-4 py-4">
                          <p className="font-medium text-slate-800 mb-1">{req.visitType}</p>
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {new Date(req.scheduledDate).toLocaleTimeString("en-PH", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                        </td>
                        {/* Scheduled / Requested */}
                        <td className="px-4 py-4 text-xs">
                          <p className="font-semibold text-slate-700">
                            {new Date(req.scheduledDate).toLocaleDateString("en-PH", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                          <p className="text-slate-400 mt-1">
                            Req: {new Date(req.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                          </p>
                        </td>
                        {/* Status */}
                        <td className="px-4 py-4">
                          <StatusBadge status={req.status} requiresGuardianApproval={req.requiresGuardianApproval} />
                        </td>
                        {/* Actions */}
                        <td className="py-4 pl-4 pr-6 text-right">
                          {req.status === "Pending" ? (
                            <div className="inline-flex items-center justify-end gap-2">
                              {req.requiresGuardianApproval ? (
                                <span className="text-[11px] font-medium text-indigo-500 flex items-center gap-1 italic">
                                  <Lock className="h-3 w-3" /> Awaiting Email Action
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleApprove(req)}
                                  disabled={isProcessing}
                                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {isProcessing ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                  )}
                                  Approve
                                </button>
                              )}
                              
                              <button
                                onClick={() => handleDeny(req)}
                                disabled={isProcessing}
                                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isProcessing ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <XCircle className="h-3.5 w-3.5" />
                                )}
                                Deny
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">
                              Resolved
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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
                  <span className="font-medium">Rows per page:</span>
                  <Popover open={pageSizeOpen} onOpenChange={setPageSizeOpen}>
                    <PopoverTrigger className="flex min-w-14 items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm cursor-pointer transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20">
                      <span className="text-slate-700">{pageSize}</span>
                      <ChevronDown size={14} className={`shrink-0 text-slate-400 transition-transform ${pageSizeOpen ? "rotate-180" : ""}`} />
                    </PopoverTrigger>
                    <PopoverContent align="start" sideOffset={6} className="w-20 p-1">
                      {[5, 10, 30, 50].map((size) => (
                        <button key={size} type="button" onClick={() => { setPageSize(size); setCurrentPage(1); setPageSizeOpen(false); }} className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100">
                          <span className="flex-1 text-left">{size}</span>
                          {pageSize === size && <Check className="h-3.5 w-3.5 text-teal-600" />}
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>
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
      </section>
    </AdminSidebarLayout>
  );
}
