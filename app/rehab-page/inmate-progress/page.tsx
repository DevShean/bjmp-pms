"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import RehabSidebarLayout from "../components/RehabSidebarLayout";
import RehabStatCard from "../components/RehabStatCard";
import ProgressChart from "./ProgressChart";
import CompletionsChart from "./CompletionsChart";
import ProgramTable, { ProgramRecord } from "./ProgramTable";
import EditProgressModal from "./EditProgressModal";
import { BookUser, CheckCircle2, Clock, LayoutList } from "lucide-react";

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

export default function RehabInmateProgressPage() {
  const [programData, setProgramData] = useState<ProgramRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ProgramRecord | null>(null);

  const fetchProgressData = useCallback(async () => {
    try {
      setIsLoading(true);
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

  const ongoingCount = programData.filter((p) => p.status === "Ongoing").length;
  const completedCount = programData.filter((p) => p.status === "Completed").length;
  const droppedCount = programData.filter((p) => p.status === "Dropped").length;
  const totalCount = programData.length;

  const monthlyCompletionsData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const stats = months.map((m) => ({ month: m, completions: 0 }));

    programData.forEach((p) => {
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
    <RehabSidebarLayout>
      <div className="flex flex-col gap-8">

        {/* Header Card */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md">
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="font-lexend text-3xl font-bold tracking-tight text-[#00154A]">
                Program Progress Monitoring
              </h1>
              <p className="text-slate-500">
                Track and update rehabilitation program progress for all enrolled inmates.
              </p>
            </div>
            <div className="hidden sm:flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 shadow-inner">
              <BookUser className="h-7 w-7 text-slate-400" />
            </div>
          </div>
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-teal-50/50 blur-2xl" />
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <RehabStatCard
            title="Total Programs"
            value={totalCount}
            icon={LayoutList}
            iconColor="text-indigo-600"
            iconBg="bg-indigo-600"
            valueColor="text-[#00154A]"
          />
          <RehabStatCard
            title="Completed"
            value={completedCount}
            icon={CheckCircle2}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-600"
            valueColor="text-emerald-600"
          />
          <RehabStatCard
            title="Ongoing"
            value={ongoingCount}
            icon={Clock}
            iconColor="text-amber-500"
            iconBg="bg-amber-500"
            valueColor="text-amber-600"
          />
        </section>

        {/* Charts + Table Row */}
        <section className="flex flex-col gap-6 lg:flex-row">
          <div className="lg:max-w-[300px] w-full rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <ProgressChart ongoing={ongoingCount} completed={completedCount} dropped={droppedCount} />
          </div>

          <div className="flex-1 min-w-0 rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#2952b3]" />
                  <p className="text-sm text-slate-500 font-medium">Loading progress records...</p>
                </div>
              </div>
            ) : (
              <ProgramTable
                data={programData}
                onEdit={(record) => {
                  setSelectedRecord(record);
                  setIsEditModalOpen(true);
                }}
              />
            )}
          </div>
        </section>

        {/* Completions Chart */}
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <CompletionsChart data={monthlyCompletionsData} />
        </section>

      </div>

      <EditProgressModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedRecord(null);
        }}
        onSave={fetchProgressData}
        record={selectedRecord}
      />
    </RehabSidebarLayout>
  );
}