"use client";

import { useState, useEffect, useCallback } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import RehabSidebarLayout from "../components/RehabSidebarLayout";
import StatCard from "../inmate-progress/StatCard";
import { 
  FileDown, 
  XCircle, 
  FileBarChart,
  CalendarIcon,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

// ─── Interfaces ────────────────────────────────────────────────────────

interface ReportInmateProgram {
  start_date: string | null;
  end_date: string | null;
  progress: string;
  inmates: {
    first_name: string | null;
    last_name: string | null;
    inmate_id: number | null;
  } | {
    first_name: string | null;
    last_name: string | null;
    inmate_id: number | null;
  }[] | null;
  programs: {
    program_name: string | null;
  } | {
    program_name: string | null;
  }[] | null;
}

// ─── Helpers ───────────────────────────────────────────────────────────

const inputClass = "flex w-full cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-teal-500";

function DatePickerField({ 
  id, 
  value, 
  onSelect,
  placeholder = "Select date"
}: { 
  id: string; 
  value: string; 
  onSelect: (date: Date | undefined) => void;
  placeholder?: string;
}) {
  const selected = value ? new Date(value + "T12:00:00") : undefined;
  return (
    <div className="w-full">
      <Popover>
        <PopoverTrigger id={id} className={inputClass}>
          <span className={selected ? "text-slate-800 font-medium" : "text-slate-400"}>
            {selected ? format(selected, "PPP") : placeholder}
          </span>
          <CalendarIcon className="size-4 shrink-0 text-slate-400" />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={onSelect}
            className="[&_button]:cursor-pointer"
            fromYear={2000}
            toYear={2100}
            captionLayout="dropdown"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function MonthPickerField({
  id,
  value,
  onSelect,
  placeholder = "Select month",
}: {
  id: string;
  value: string;
  onSelect: (month: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(() => value ? parseInt(value.split("-")[0]) : new Date().getFullYear());

  const selectedYear = value ? parseInt(value.split("-")[0]) : null;
  const selectedMonth = value ? parseInt(value.split("-")[1]) - 1 : null;
  const displayValue = value ? format(new Date(value + "-01T12:00:00"), "MMMM yyyy") : null;

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger id={id} className={inputClass}>
          <span className={displayValue ? "text-slate-800 font-medium" : "text-slate-400"}>
            {displayValue ?? placeholder}
          </span>
          <CalendarIcon className="size-4 shrink-0 text-slate-400" />
        </PopoverTrigger>
        <PopoverContent className="w-60 p-3" align="start">
          {/* Year navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setYear((y) => y - 1)}
              className="cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="text-sm font-semibold text-slate-800">{year}</span>
            <button
              type="button"
              onClick={() => setYear((y) => y + 1)}
              className="cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ChevronRight size={15} />
            </button>
          </div>
          {/* Month grid */}
          <div className="grid grid-cols-3 gap-1.5">
            {MONTHS.map((month, idx) => {
              const isSelected = selectedYear === year && selectedMonth === idx;
              return (
                <button
                  key={month}
                  type="button"
                  onClick={() => {
                    const mm = String(idx + 1).padStart(2, "0");
                    onSelect(`${year}-${mm}`);
                    setOpen(false);
                  }}
                  className={`cursor-pointer rounded-lg py-2 text-xs font-medium transition-colors ${
                    isSelected
                      ? "bg-teal-700 text-white"
                      : "text-slate-700 hover:bg-teal-50 hover:text-teal-700"
                  }`}
                >
                  {month}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────

export default function ReportPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    ongoing: 0,
    avgRating: 0,
  });

  const fetchStats = useCallback(async () => {
    try {
      const [
        { count: totalCount },
        { count: completedCount },
        { count: ongoingCount },
        { data: behaviorData }
      ] = await Promise.all([
        supabase.from("inmate_programs").select("*", { count: "exact", head: true }),
        supabase.from("inmate_programs").select("*", { count: "exact", head: true }).eq("progress", "Completed"),
        supabase.from("inmate_programs").select("*", { count: "exact", head: true }).eq("progress", "Ongoing"),
        supabase.from("behavior_logs").select("behavior_rating")
      ]);

      // Calculate avg behavior rating (Excellent=4, Good=3, Fair=2, Poor=1)
      let avg = 0;
      if (behaviorData && behaviorData.length > 0) {
        const ratingMap: Record<string, number> = { Excellent: 4, Good: 3, Fair: 2, Poor: 1 };
        const sum = behaviorData.reduce((acc, curr) => acc + (ratingMap[curr.behavior_rating] || 0), 0);
        avg = sum / behaviorData.length;
      }

      setStats({
        total: totalCount || 0,
        completed: completedCount || 0,
        ongoing: ongoingCount || 0,
        avgRating: parseFloat(avg.toFixed(1)),
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setFilterMonth("");
    setStatusFilter("");
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    const loadingToast = toast.loading("Preparing comprehensive rehabilitation report...");

    try {
      let query = supabase
        .from("inmate_programs")
        .select(`
          start_date,
          end_date,
          progress,
          inmates (first_name, last_name, inmate_id),
          programs (program_name)
        `);

      // Apply Filters
      if (filterMonth) {
        const date = new Date(filterMonth + "-01T12:00:00");
        const monthStart = format(startOfMonth(date), "yyyy-MM-dd");
        const monthEnd = format(endOfMonth(date), "yyyy-MM-dd");
        query = query.gte("start_date", monthStart).lte("start_date", monthEnd);
      } else {
        if (startDate) query = query.gte("start_date", startDate);
        if (endDate) query = query.lte("start_date", endDate);
      }

      if (statusFilter) {
        query = query.eq("progress", statusFilter);
      }

      const { data: reportData, error } = await query.order("start_date", { ascending: false });

      if (error) throw error;

      if (!reportData || reportData.length === 0) {
        toast.dismiss(loadingToast);
        toast.info("No records found for the selected reporting period.");
        setIsGenerating(false);
        return;
      }

      // Generate HTML report
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.dismiss(loadingToast);
        toast.error("Popup blocked. Please allow popups to view the report.");
        setIsGenerating(false);
        return;
      }

      const rowsHtml = (reportData as ReportInmateProgram[]).map((record) => {
        // Handle both object and array returns from Supabase joins
        const inmate = Array.isArray(record.inmates) ? record.inmates[0] : record.inmates;
        const program = Array.isArray(record.programs) ? record.programs[0] : record.programs;
        
        const inmateId = inmate?.inmate_id || "N/A";
        const fullName = inmate ? `${inmate.first_name || ""} ${inmate.last_name || ""}`.trim() : "Unknown Inmate";
        const programName = program?.program_name || "Unknown Program";

        return `
          <tr>
            <td>${record.start_date || "N/A"}</td>
            <td>${inmateId}</td>
            <td>${fullName}</td>
            <td>${programName}</td>
            <td><span class="status-badge ${record.progress.toLowerCase()}">${record.progress}</span></td>
            <td>${record.end_date || "-"}</td>
          </tr>
        `;
      }).join("");

      const dateRangeMsg = filterMonth 
        ? format(new Date(filterMonth + "-01T12:00:00"), "MMMM yyyy") 
        : (startDate && endDate) 
        ? `${startDate} to ${endDate}` 
        : "Complete History";

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Rehabilitation Progress Report</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            @page { size: landscape; margin: 0mm; }
            body { font-family: 'Inter', sans-serif; padding: 1.5cm; color: #1e293b; line-height: 1.5; background: white; }
            .header { display: flex; align-items: center; justify-content: center; text-align: center; margin-bottom: 30px; border-bottom: 3px solid #0d9488; padding-bottom: 20px; }
            .logo { width: 85px; height: 85px; }
            .header-text { margin: 0 40px; }
            .header-text h1 { font-size: 18px; margin: 0; font-weight: 700; color: #0f172a; text-transform: uppercase; }
            .header-text h2 { font-size: 14px; margin: 4px 0; font-weight: 600; color: #475569; }
            .header-text h3 { font-size: 13px; margin: 2px 0; font-weight: 500; color: #64748b; }
            
            .report-meta { text-align: center; margin-bottom: 40px; }
            .report-title { font-size: 22px; font-weight: 800; margin-bottom: 8px; color: #0f172a; text-transform: uppercase; letter-spacing: -0.025em; }
            .report-period { font-size: 15px; color: #0d9488; font-weight: 600; }
            
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background: #f8fafc; text-align: left; padding: 14px 15px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; border-bottom: 2px solid #0d9488; letter-spacing: 0.05em; }
            td { padding: 12px 15px; font-size: 13px; color: #334155; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
            
            .status-badge { padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
            .status-badge.completed { background: #f0fdf4; color: #15803d; }
            .status-badge.ongoing { background: #fffbeb; color: #b45309; }
            .status-badge.dropped { background: #fef2f2; color: #b91c1c; }

            .footer { margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #e2e8f0; pt: 20px; font-size: 11px; color: #94a3b8; }
            .signature-block { width: 220px; text-align: center; border-top: 1.5px solid #1e293b; pt: 8px; margin-top: 40px; color: #0f172a; font-weight: 600; font-size: 13px; }

            @media print {
              body { padding: 1.5cm; }
              .no-print { display: none; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
              thead { display: table-header-group; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="/img/logo/logo.png" class="logo" />
            <div class="header-text">
              <h1>REPUBLIC OF THE PHILIPPINES</h1>
              <h2>Department of the Interior and Local Government</h2>
              <h3>Bureau of Jail Management and Penology</h3>
              <h3>Rehabilitation Operations Unit</h3>
            </div>
            <img src="/img/logo/bplogo.png" class="logo" />
          </div>
          
          <div class="report-meta">
            <div class="report-title">Inmate Program Progress Report</div>
            <div class="report-period">Reporting Period: ${dateRangeMsg}</div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Start Date</th>
                <th>Inmate ID</th>
                <th>Full Name</th>
                <th>Program Name</th>
                <th>Status</th>
                <th>End Date</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          
          <div style="display: flex; justify-content: flex-end; margin-top: 40px;">
            <div style="text-align: center;">
              <div class="signature-block">Duty Rehabilitation Officer</div>
              <p style="font-size: 10px; color: #64748b; margin-top: 4px;">Official Signature Over Printed Name</p>
            </div>
          </div>

          <div class="footer">
            <div>BJMP-PMS | Rehab Analytics System</div>
            <div>Official Report Generated on ${new Date().toLocaleString()}</div>
          </div>
          
          <script>
            function startPrint() {
              window.print();
            }
            if (document.readyState === 'complete') {
              setTimeout(startPrint, 500);
            } else {
              window.addEventListener('load', () => setTimeout(startPrint, 500));
            }
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      toast.dismiss(loadingToast);
      toast.success("Rehabilitation report generated successfully!");
    } catch (err) {
      console.error("Report generation error:", err);
      toast.dismiss(loadingToast);
      toast.error("Failed to generate report dataset.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <RehabSidebarLayout>
      <section className="space-y-8">
        
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between px-2">
          <div className="space-y-1">
            <h1 className="font-lexend text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
              Reports & Analytics
              <FileBarChart className="text-teal-700" size={32} />
            </h1>
            <p className="text-slate-500 max-w-2xl">
              Monitor rehabilitation program performance, inmate completions, and average behavior ratings across your facility.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 px-2">
          <StatCard title="Total Enrollment" value={stats.total} tone="text-slate-900" />
          <StatCard title="Completions" value={stats.completed} tone="text-emerald-600" />
          <StatCard title="Ongoing" value={stats.ongoing} tone="text-teal-600" />
          <StatCard title="Avg Behavior" value={stats.avgRating} tone="text-blue-600" />
        </div>

        {/* Generation Form */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md">
          <div className="mb-10 flex items-center justify-between">
            <div className="space-y-1 text-left">
              <h2 className="font-lexend text-xl font-bold text-slate-900 leading-tight">
                Export Progress Data
              </h2>
              <p className="text-sm text-slate-500">
                Configure your filters and export a comprehensive CSV report for external analysis.
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <FileDown className="h-6 w-6" />
            </div>
          </div>

          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
              <div className="md:col-span-12">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 text-left">
                  Report Filtering Bounds
                </p>
              </div>

              {/* Start Date */}
              <div className="md:col-span-3 flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-600 font-lexend text-left">
                  Start Date
                </label>
                <DatePickerField
                  id="start_date"
                  value={startDate}
                  onSelect={(date) => {
                    setStartDate(date ? format(date, "yyyy-MM-dd") : "");
                    setFilterMonth(""); // Clear month if specific dates selected
                  }}
                  placeholder="Select opening date..."
                />
              </div>

              {/* End Date */}
              <div className="md:col-span-3 flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-600 font-lexend text-left">
                  End Date
                </label>
                <DatePickerField
                  id="end_date"
                  value={endDate}
                  onSelect={(date) => {
                    setEndDate(date ? format(date, "yyyy-MM-dd") : "");
                    setFilterMonth("");
                  }}
                  placeholder="Select closing date..."
                />
              </div>

              {/* Month Filter */}
              <div className="md:col-span-3 flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-600 font-lexend text-left">
                  Month Interval
                </label>
                <MonthPickerField
                  id="filter_month"
                  value={filterMonth}
                  onSelect={(month) => {
                    setFilterMonth(month);
                    setStartDate("");
                    setEndDate("");
                  }}
                  placeholder="Select month..."
                />
              </div>

              {/* Status Filter */}
              <div className="md:col-span-3 flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-600 font-lexend text-left">
                  Progress Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-700 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-teal-500 cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="Ongoing">Ongoing Only</option>
                  <option value="Completed">Completed Only</option>
                  <option value="Dropped">Dropped Only</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-100">
              <Button 
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className="cursor-pointer h-12 rounded-xl bg-teal-700 px-8 font-semibold text-white shadow-lg shadow-teal-900/10 transition-all hover:bg-teal-800 hover:shadow-xl active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait"
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <FileDown className="mr-2 h-5 w-5" />
                )}
                {isGenerating ? "Processing..." : "Generate Printable Report"}
              </Button>
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="cursor-pointer h-12 rounded-xl border-slate-200 bg-white px-8 font-medium text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]"
              >
                <XCircle className="mr-2 h-5 w-5" />
                Clear All
              </Button>
            </div>
          </div>
        </div>
      </section>
    </RehabSidebarLayout>
  );
}