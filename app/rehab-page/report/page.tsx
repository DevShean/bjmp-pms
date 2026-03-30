"use client";

import { useState } from "react";
import RehabSidebarLayout from "../components/RehabSidebarLayout";
import ReportStatCard from "../components/RehabStatCard";
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  Star, 
  FileDown, 
  XCircle, 
  Info, 
  FileBarChart,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReportPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterMonth, setFilterMonth] = useState("");

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setFilterMonth("");
  };

  const handleDownload = () => {
    // Placeholder for CSV generation logic
    console.log("Downloading CSV report...", { startDate, endDate, filterMonth });
    alert("CSV Report generation started. In a real application, this would download a file with filtered data.");
  };

  return (
    <RehabSidebarLayout>
      <div className="flex flex-col gap-8">
        {/* Header Card */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md">
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="font-lexend text-3xl font-bold tracking-tight text-[#00154A]">
                Reports & Analytics
              </h1>
              <p className="text-slate-500">
                Generate comprehensive reports on rehabilitation program progress
              </p>
            </div>
            <div className="hidden sm:flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 shadow-inner">
              <FileBarChart className="h-7 w-7 text-slate-400" />
            </div>
          </div>
          {/* Subtle background decoration */}
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-50/50 blur-2xl" />
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <ReportStatCard
            title="Total Inmates in Programs"
            value="2"
            icon={Users}
            iconColor="text-indigo-600"
            iconBg="bg-indigo-600"
          />
          <ReportStatCard
            title="Completed Programs"
            value="1"
            icon={CheckCircle2}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-600"
            valueColor="text-emerald-600"
          />
          <ReportStatCard
            title="Ongoing Programs"
            value="1"
            icon={Clock}
            iconColor="text-amber-500"
            iconBg="bg-amber-500"
            valueColor="text-amber-600"
          />
          <ReportStatCard
            title="Average Behavior Rating"
            value="4.0/4"
            icon={Star}
            iconColor="text-blue-500"
            iconBg="bg-blue-500"
          />
        </section>

        {/* Report Generator Card */}
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md">
          <div className="mb-8 flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-[#00154A]">
                Generate Inmate Progress Report
              </h2>
              <p className="text-sm text-slate-500">
                Download a comprehensive CSV report of inmate program progress and behavior evaluations
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
              <FileDown className="h-5 w-5" />
            </div>
          </div>

          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
              <div className="md:col-span-12">
                <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
                  Filter Report By:
                </p>
              </div>

              {/* Start Date */}
              <div className="md:col-span-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Start Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 pr-10 text-slate-600 transition-all focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-50/50"
                  />
                  <Calendar className="absolute right-3 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* End Date */}
              <div className="md:col-span-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  End Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 pr-10 text-slate-600 transition-all focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-50/50"
                  />
                  <Calendar className="absolute right-3 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Month Filter */}
              <div className="md:col-span-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Or Filter by Month
                </label>
                <div className="relative">
                  <input
                    type="month"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 pr-10 text-slate-600 transition-all focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-50/50"
                    placeholder="-------- ----"
                  />
                  <Calendar className="absolute right-3 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <p className="text-xs italic text-slate-400">
              Tip: Use Start/End dates for inclusive date range filtering, or use the Month filter for a specific month
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button 
                onClick={handleDownload}
                className="h-12 rounded-xl bg-[#2952b3] px-8 font-semibold text-white shadow-lg shadow-blue-900/10 transition-all hover:bg-[#1a3a8a] hover:shadow-xl active:scale-[0.98]"
              >
                <FileDown className="mr-2 h-5 w-5" />
                Download CSV Report
              </Button>
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="h-12 rounded-xl border-slate-200 bg-white px-8 font-medium text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]"
              >
                <XCircle className="mr-2 h-5 w-5" />
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Report Contents Info Box */}
          <div className="mt-12 rounded-2xl border border-blue-50 bg-blue-50/30 p-6">
            <div className="flex items-start gap-4">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100/50 text-blue-600">
                <Info className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-slate-800">Report Contents</h4>
                <p className="text-sm leading-relaxed text-slate-600">
                  The report includes inmate names, program details, progress status, behavior ratings, and evaluation notes in CSV format for easy analysis.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </RehabSidebarLayout>
  );
}