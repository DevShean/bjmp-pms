"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import AdminSidebarLayout from "../components/AdminSidebarLayout";
import StatCard from "./StatCard";
import ProgressChart from "./ProgressChart";
import CompletionsChart from "./CompletionsChart";
import ProgramTable, { ProgramRecord } from "./ProgramTable";
import EditProgressModal from "./EditProgressModal";
import { BookUser, PieChart, BarChart3, RefreshCw, ChevronDown, X, Check, CheckSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface InmateProgramJoin {
  inmate_program_id: number;
  start_date: string | null;
  end_date: string | null;
  progress: string | null;
  inmates: {
    first_name: string | null;
    last_name: string | null;
  } | null;
  programs: {
    program_name: string | null;
  } | null;
  users: {
    profiles: {
      firstname: string | null;
      lastname: string | null;
    } | null;
  } | null;
}

export default function InmateProgressPage() {
  const [programData, setProgramData] = useState<ProgramRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ProgramRecord | null>(null);
  const [activeChart, setActiveChart] = useState<"status" | "completions">("status");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchStatus, setBatchStatus] = useState<ProgramRecord["status"]>("Ongoing");
  const [isBatchUpdating, setIsBatchUpdating] = useState(false);
  const [batchStatusOpen, setBatchStatusOpen] = useState(false);

  const fetchProgressData = useCallback(async () => {
    try {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const { data, error } = await supabase
        .from("inmate_programs")
        .select(`
          inmate_program_id,
          start_date,
          end_date,
          progress,
          inmates (
            first_name,
            last_name
          ),
          programs (
            program_name
          ),
          users!staff_id (
            profiles (
              firstname,
              lastname
            )
          )
        `);

      if (error) throw error;

      if (data) {
        const castedData = data as unknown as InmateProgramJoin[];
        const formatted: ProgramRecord[] = castedData.map((item) => ({
          id: item.inmate_program_id.toString(),
          inmateName: `${item.inmates?.first_name || ""} ${item.inmates?.last_name || ""}`.trim() || "Unknown Inmate",
          program: item.programs?.program_name || "Unknown Program",
          startDate: item.start_date || "N/A",
          endDate: item.end_date || "N/A",
          status: (item.progress as "Ongoing" | "Completed" | "Dropped") || "Ongoing",
          staff: `${item.users?.profiles?.firstname || ""} ${item.users?.profiles?.lastname || ""}`.trim() || "Assigned Staff",
        }));
        setProgramData(formatted);
      }
    } catch (error: unknown) {
      console.error("Error fetching progress data:", error);
      toast.error("Failed to fetch progress records.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgressData();
  }, [fetchProgressData]);

  const handleBatchUpdate = useCallback(async () => {
    if (selectedIds.length === 0) return;
    setIsBatchUpdating(true);
    try {
      const numericIds = selectedIds.map((id) => parseInt(id, 10));
      const endDate = batchStatus === "Completed" ? new Date().toISOString().split("T")[0] : null;
      const { error } = await supabase
        .from("inmate_programs")
        .update({ progress: batchStatus, end_date: endDate })
        .in("inmate_program_id", numericIds);

      if (error) throw error;

      toast.success(`Updated ${selectedIds.length} record${selectedIds.length > 1 ? "s" : ""} to "${batchStatus}".`);
      setSelectedIds([]);
      fetchProgressData();
    } catch (err) {
      console.error("Batch update error:", err);
      toast.error("Failed to batch update records.");
    } finally {
      setIsBatchUpdating(false);
    }
  }, [selectedIds, batchStatus, fetchProgressData]);

  const ongoingCount = programData.filter((p) => p.status === "Ongoing").length;
  const completedCount = programData.filter((p) => p.status === "Completed").length;
  const droppedCount = programData.filter((p) => p.status === "Dropped").length;
  const totalCount = programData.length;

  const monthlyCompletionsData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Initialize data for all months
    const stats = months.map(m => ({ month: m, completions: 0 }));

    programData.forEach(p => {
      if (p.status === "Completed" && p.endDate !== "N/A") {
        try {
          const date = new Date(p.endDate);
          if (date.getFullYear() === currentYear) {
            const monthIndex = date.getMonth();
            stats[monthIndex].completions += 1;
          }
        } catch {
          console.error("Error parsing end date:", p.endDate);
        }
      }
    });

    return stats;
  }, [programData]);

  return (
    <AdminSidebarLayout>
      <section className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="font-lexend text-3xl font-semibold text-slate-800 flex items-center gap-3">
              Program Progress Monitoring
              <BookUser className="text-teal-700" size={32} />
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Track and update rehabilitation program progress.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm space-y-2">
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="h-9 w-16 rounded-md" />
              </div>
            ))
          ) : (
            <>
              <StatCard title="Total Programs" value={totalCount} tone="text-slate-900" />
              <StatCard title="Completed" value={completedCount} tone="text-green-600" />
              <StatCard title="Ongoing" value={ongoingCount} tone="text-yellow-600" />
            </>
          )}
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Tabbed chart panel */}
          <div className="lg:max-w-80 w-full">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {/* Tab bar */}
              <div className="flex border-b border-slate-200 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setActiveChart("status")}
                  className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 px-4 py-3 text-xs font-semibold transition-colors ${
                    activeChart === "status"
                      ? "border-b-2 border-teal-600 bg-white text-teal-700"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <PieChart size={14} />
                  Status
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChart("completions")}
                  className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 px-4 py-3 text-xs font-semibold transition-colors ${
                    activeChart === "completions"
                      ? "border-b-2 border-teal-600 bg-white text-teal-700"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <BarChart3 size={14} />
                  Monthly
                </button>
              </div>

              {/* Chart content */}
              <div className="p-4">
                {isLoading ? (
                  activeChart === "status" ? (
                    <div className="space-y-4">
                      <Skeleton className="h-4 w-36 rounded-md" />
                      <div className="flex items-center justify-center py-4">
                        <Skeleton className="h-40 w-40 rounded-full" />
                      </div>
                      <div className="space-y-2.5">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <Skeleton className="h-3 w-3 rounded-full shrink-0" />
                            <Skeleton className="h-3 w-20 rounded" />
                            <Skeleton className="h-3 w-8 rounded ml-auto" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Skeleton className="h-4 w-48 rounded-md" />
                      <div className="flex items-end gap-2 h-40 px-2">
                        {Array.from({ length: 12 }).map((_, i) => (
                          <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                            <Skeleton
                              className="w-full rounded-t-sm"
                              style={{ height: `${30 + ((i * 17) % 70)}%` }}
                            />
                            <Skeleton className="h-2.5 w-4 rounded" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ) : activeChart === "status" ? (
                  <ProgressChart ongoing={ongoingCount} completed={completedCount} dropped={droppedCount} />
                ) : (
                  <CompletionsChart data={monthlyCompletionsData} />
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Batch action bar */}
            {selectedIds.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 shadow-sm">
                <CheckSquare size={16} className="shrink-0 text-teal-700" />
                <span className="text-sm font-semibold text-teal-800">
                  {selectedIds.length} record{selectedIds.length > 1 ? "s" : ""} selected
                </span>
                <div className="flex items-center gap-2 ml-auto flex-wrap">
                  <span className="text-xs text-teal-700 font-medium">Set status to:</span>
                  <Popover open={batchStatusOpen} onOpenChange={setBatchStatusOpen}>
                    <PopoverTrigger className="flex cursor-pointer items-center gap-2 rounded-lg border border-teal-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500/20 min-w-32">
                      <span className="flex-1 text-left">{batchStatus}</span>
                      <ChevronDown size={13} className={`shrink-0 text-slate-400 transition-transform ${batchStatusOpen ? "rotate-180" : ""}`} />
                    </PopoverTrigger>
                    <PopoverContent align="start" sideOffset={6} className="w-36 p-1">
                      {(["Ongoing", "Completed", "Dropped"] as ProgramRecord["status"][]).map((s) => (
                        <button key={s} type="button"
                          onClick={() => { setBatchStatus(s); setBatchStatusOpen(false); }}
                          className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
                        >
                          <span className="flex-1 text-left">{s}</span>
                          {batchStatus === s && <Check size={13} className="text-teal-600" />}
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>
                  <button
                    type="button"
                    disabled={isBatchUpdating}
                    onClick={handleBatchUpdate}
                    className="cursor-pointer flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isBatchUpdating ? (
                      <RefreshCw size={13} className="animate-spin" />
                    ) : (
                      <Check size={13} />
                    )}
                    Apply
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedIds([])}
                    className="cursor-pointer flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-500 transition hover:bg-slate-50"
                  >
                    <X size={13} />
                    Clear
                  </button>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 grid grid-cols-6 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 rounded-md" />
                  ))}
                </div>
                <div className="divide-y divide-slate-100">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="px-5 py-3 grid grid-cols-6 gap-4 items-center">
                      <Skeleton className="h-4 w-24 rounded-md" />
                      <Skeleton className="h-4 w-28 rounded-md" />
                      <Skeleton className="h-4 w-20 rounded-md" />
                      <Skeleton className="h-4 w-20 rounded-md" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-7 w-16 rounded-md" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <ProgramTable
                data={programData}
                onSelectionChange={setSelectedIds}
                onEdit={(record) => {
                  setSelectedRecord(record);
                  setIsEditModalOpen(true);
                }}
              />
            )}
          </div>
        </div>
      </section>

      <EditProgressModal 
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedRecord(null);
        }}
        onSave={fetchProgressData}
        record={selectedRecord}
      />
    </AdminSidebarLayout>
  );
}