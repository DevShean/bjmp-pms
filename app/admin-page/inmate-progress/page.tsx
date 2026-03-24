"use client";

import { BarChart3 } from "lucide-react";
import AdminSidebarLayout from "../components/AdminSidebarLayout";
import StatCard from "./StatCard";
import ProgressChart from "./ProgressChart";
import CompletionsChart from "./CompletionsChart";
import ProgramTable from "./ProgramTable";

interface ProgramRecord {
  id: string;
  inmateName: string;
  program: string;
  startDate: string;
  status: "Ongoing" | "Completed" | "Dropped";
}

export default function InmateProgressPage() {
  const programData: ProgramRecord[] = [
    {
      id: "1",
      inmateName: "Mark Santos",
      program: "adsasd",
      startDate: "2026-03-19",
      status: "Ongoing",
    },
  ];

  const ongoingCount = programData.filter((p) => p.status === "Ongoing").length;
  const completedCount = programData.filter((p) => p.status === "Completed").length;
  const droppedCount = programData.filter((p) => p.status === "Dropped").length;
  const totalCount = programData.length;

  const monthlyCompletionsData = [
    { month: "Jan", completions: 3 },
    { month: "Feb", completions: 5 },
    { month: "Mar", completions: 2 },
    { month: "Apr", completions: 4 },
    { month: "May", completions: 6 },
    { month: "Jun", completions: 3 },
  ];

  return (
    <AdminSidebarLayout>
      <section className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="font-lexend text-3xl font-semibold text-slate-800">Program Progress Monitoring</h1>
            <p className="mt-1 text-sm text-slate-600">
              Track and update rehabilitation program progress.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="group relative flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 hover:shadow-md"
            >
              <BarChart3 size={18} className="text-teal-600" />
              <span>View Analytics</span>
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard title="Total Programs" value={totalCount} tone="text-slate-900" />
          <StatCard title="Completed" value={completedCount} tone="text-green-600" />
          <StatCard title="Ongoing" value={ongoingCount} tone="text-yellow-600" />
        </div>

        <div className="flex gap-5">
          <ProgressChart ongoing={ongoingCount} completed={completedCount} dropped={droppedCount} />
          <CompletionsChart data={monthlyCompletionsData} />
        </div>

        <ProgramTable data={programData} />
      </section>
    </AdminSidebarLayout>
  );
}