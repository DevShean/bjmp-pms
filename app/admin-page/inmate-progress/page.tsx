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
import { BookUser } from "lucide-react";

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
          <StatCard title="Total Programs" value={totalCount} tone="text-slate-900" />
          <StatCard title="Completed" value={completedCount} tone="text-green-600" />
          <StatCard title="Ongoing" value={ongoingCount} tone="text-yellow-600" />
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="lg:max-w-70 w-full">
            <ProgressChart ongoing={ongoingCount} completed={completedCount} dropped={droppedCount} />
          </div>
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-teal-600" />
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
        </div>

        <CompletionsChart data={monthlyCompletionsData} />
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