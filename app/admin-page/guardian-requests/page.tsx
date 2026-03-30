"use client";

import { useCallback, useEffect, useState } from "react";
import AdminSidebarLayout from "../components/AdminSidebarLayout";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  Search,
  ShieldUser,
  UserCheck,
  XCircle,
  Filter,
  Loader2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type GuardianRequestStatus = "Pending" | "Approved" | "Denied";

type GuardianRequestRow = {
  request_id: number;
  status: GuardianRequestStatus;
  requested_at: string;
  reviewed_at: string | null;
  notes: string | null;
  visitor_id: number;
  inmate_id: number;
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

type FlatRequest = {
  requestId: number;
  visitorId: number;
  inmateId: number;
  visitorName: string;
  visitorEmail: string;
  pdlName: string;
  cellBlock: string;
  status: GuardianRequestStatus;
  requestedAt: string;
  reviewedAt: string | null;
};

// ─── Status badge ─────────────────────────────────────────────────────────────

const statusStyles: Record<GuardianRequestStatus, string> = {
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Denied: "bg-rose-50 text-rose-700 border-rose-200",
};

const statusIcons: Record<GuardianRequestStatus, React.ReactNode> = {
  Pending: <Clock className="h-3.5 w-3.5" />,
  Approved: <CheckCircle2 className="h-3.5 w-3.5" />,
  Denied: <XCircle className="h-3.5 w-3.5" />,
};

function StatusBadge({ status }: { status: GuardianRequestStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[status]}`}
    >
      {statusIcons[status]}
      {status}
    </span>
  );
}

// ─── Summary card (mirrors transfer-release page) ─────────────────────────────

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

export default function GuardianRequestsPage() {
  const [requests, setRequests] = useState<FlatRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<GuardianRequestStatus | "All">("All");
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // ── Fetch ──
  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("guardian_requests")
        .select(`
          request_id,
          visitor_id,
          inmate_id,
          status,
          requested_at,
          reviewed_at,
          notes,
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
        .order("requested_at", { ascending: false });

      if (error) throw error;

      const flat: FlatRequest[] = ((data ?? []) as unknown as GuardianRequestRow[]).map((r) => ({
        requestId: r.request_id,
        visitorId: r.visitor_id,
        inmateId: r.inmate_id,
        visitorName: r.visitors?.users?.username ?? "Unknown Visitor",
        visitorEmail: r.visitors?.users?.email ?? "",
        pdlName: r.inmates
          ? `${r.inmates.first_name ?? ""} ${r.inmates.last_name ?? ""}`.trim()
          : `PDL #${r.inmate_id}`,
        cellBlock: r.inmates?.cell_block ?? "Unassigned",
        status: r.status,
        requestedAt: r.requested_at,
        reviewedAt: r.reviewed_at,
      }));

      setRequests(flat);
    } catch (err) {
      console.error("Error fetching guardian requests:", err);
      toast.error("Failed to load guardian requests.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // ── Approve ──
  const handleApprove = async (req: FlatRequest) => {
    try {
      setProcessingId(req.requestId);

      // 1. Update request status
      const { error: reqError } = await supabase
        .from("guardian_requests")
        .update({ status: "Approved", reviewed_at: new Date().toISOString() })
        .eq("request_id", req.requestId);

      if (reqError) throw reqError;

      // 2. Link visitor to inmate in visitors table
      const { error: visitorError } = await supabase
        .from("visitors")
        .update({ inmate_id: req.inmateId })
        .eq("visitor_id", req.visitorId);

      if (visitorError) throw visitorError;

      // 3. Notify the visitor's user_id via notification
      const { data: visitorRow } = await supabase
        .from("visitors")
        .select("user_id")
        .eq("visitor_id", req.visitorId)
        .maybeSingle<{ user_id: number }>();

      if (visitorRow?.user_id) {
        await supabase.from("notifications").insert({
          user_id: visitorRow.user_id,
          title: "Guardian Request Approved",
          message: `Your request to be the guardian of ${req.pdlName} has been approved by the administration.`,
          type: "guardian_request",
        });
      }

      toast.success(`Approved guardian request for ${req.visitorName}.`);
      fetchRequests();
    } catch (err) {
      console.error("Approve error:", err);
      toast.error("Failed to approve request.");
    } finally {
      setProcessingId(null);
    }
  };

  // ── Deny ──
  const handleDeny = async (req: FlatRequest) => {
    try {
      setProcessingId(req.requestId);

      const { error } = await supabase
        .from("guardian_requests")
        .update({ status: "Denied", reviewed_at: new Date().toISOString() })
        .eq("request_id", req.requestId);

      if (error) throw error;

      // Notify the visitor
      const { data: visitorRow } = await supabase
        .from("visitors")
        .select("user_id")
        .eq("visitor_id", req.visitorId)
        .maybeSingle<{ user_id: number }>();

      if (visitorRow?.user_id) {
        await supabase.from("notifications").insert({
          user_id: visitorRow.user_id,
          title: "Guardian Request Denied",
          message: `Your request to be the guardian of ${req.pdlName} has been denied. Please contact the facility for more information.`,
          type: "guardian_request",
        });
      }

      toast.success(`Denied guardian request from ${req.visitorName}.`);
      fetchRequests();
    } catch (err) {
      console.error("Deny error:", err);
      toast.error("Failed to deny request.");
    } finally {
      setProcessingId(null);
    }
  };

  // ── Derived counts ──
  const totalRequests = requests.length;
  const pendingCount = requests.filter((r) => r.status === "Pending").length;
  const approvedCount = requests.filter((r) => r.status === "Approved").length;

  // ── Filter ──
  const filtered = requests.filter((r) => {
    const matchesSearch =
      r.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.visitorEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.pdlName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || r.status === statusFilter;
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
            Guardian Requests
            <ShieldUser size={32} className="text-teal-600 shrink-0" />
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Review, approve, or deny visitor PDL guardian requests submitted from the visitor portal.
          </p>
        </div>

        {/* ── Summary Cards ── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SummaryCard
            title="Total Requests"
            value={String(totalRequests)}
            icon={<ShieldUser className="size-6 text-teal-500" />}
            tone="text-teal-700"
          />
          <SummaryCard
            title="Pending Review"
            value={String(pendingCount)}
            icon={<Clock className="size-6 text-amber-500" />}
            tone="text-amber-600"
          />
          <SummaryCard
            title="Approved"
            value={String(approvedCount)}
            icon={<UserCheck className="size-6 text-emerald-500" />}
            tone="text-emerald-700"
          />
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
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 bg-slate-50/50 focus:bg-white transition-all sm:w-64"
                  />
                </div>
                {/* Status filter */}
                <div className="relative">
                  <Filter className="pointer-events-none absolute inset-y-0 left-3 h-full w-4 text-slate-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as GuardianRequestStatus | "All")
                    }
                    className="pl-9 pr-8 py-2 appearance-none border border-slate-200 rounded-lg text-sm text-slate-700 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all cursor-pointer font-medium"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Denied">Denied</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-16 text-slate-400">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading requests…
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-sm text-slate-500">
                <ShieldUser className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                No guardian requests found.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="py-3 pl-6 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Visitor
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      PDL
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Cell Block
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Requested
                    </th>
                    <th className="py-3 pl-4 pr-6 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedRequests.map((req, idx) => {
                    const isProcessing = processingId === req.requestId;
                    const zebra = idx % 2 === 0 ? "bg-white" : "bg-slate-50/40";
                    return (
                      <tr key={req.requestId} className={`${zebra} transition-colors hover:bg-blue-50/30`}>
                        {/* Visitor */}
                        <td className="py-4 pl-6 pr-4">
                          <p className="font-medium text-slate-800">{req.visitorName}</p>
                          <p className="text-xs text-slate-500">{req.visitorEmail}</p>
                        </td>
                        {/* PDL */}
                        <td className="px-4 py-4">
                          <p className="font-medium text-slate-800">{req.pdlName}</p>
                          <p className="text-xs text-slate-500">ID #{req.inmateId}</p>
                        </td>
                        {/* Cell block */}
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                            {req.cellBlock}
                          </span>
                        </td>
                        {/* Status */}
                        <td className="px-4 py-4">
                          <StatusBadge status={req.status} />
                        </td>
                        {/* Requested at */}
                        <td className="px-4 py-4 text-xs text-slate-500">
                          {new Date(req.requestedAt).toLocaleDateString("en-PH", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        {/* Actions */}
                        <td className="py-4 pl-4 pr-6 text-right">
                          {req.status === "Pending" ? (
                            <div className="inline-flex items-center gap-2">
                              <button
                                onClick={() => handleApprove(req)}
                                disabled={isProcessing}
                                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isProcessing ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                )}
                                Approve
                              </button>
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
                            <span className="text-xs text-slate-400">
                              Reviewed{" "}
                              {req.reviewedAt
                                ? new Date(req.reviewedAt).toLocaleDateString("en-PH", {
                                    month: "short",
                                    day: "numeric",
                                  })
                                : ""}
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
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="appearance-none border border-slate-200 rounded-md px-2 py-1 pr-6 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer"
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
      </section>
    </AdminSidebarLayout>
  );
}
