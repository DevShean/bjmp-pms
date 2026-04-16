"use client";

import { useState, useEffect, useCallback } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { 
  BarChart3, 
  Calendar as CalendarIcon, 
  Info, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  FileDown,
  XCircle
} from "lucide-react";

import MedicalSidebarLayout from "../components/MedicalSidebarLayout";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";


// --- Components & Patterns ---

const inputClass = "flex w-full cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-500";

function StatCard({ title, value, tone }: { title: string; value: number; tone: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-all hover:shadow-md">
      <p className="text-sm text-slate-500 font-medium">{title}</p>
      <p className={`mt-2 text-4xl font-bold ${tone}`}>{value}</p>
    </article>
  );
}

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
                      ? "bg-blue-700 text-white"
                      : "text-slate-700 hover:bg-blue-50 hover:text-blue-700"
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

interface MedicalRecordTableRow {
  record_id: string;
  record_date: string;
  visit_type: string | null;
  diagnosis: string | null;
  treatment: string | null;
  medication: string | null;
  blood_pressure: string | null;
  temperature_c: number | null;
  pulse_rate: number | null;
  respiratory_rate: number | null;
  medical_condition: string | null;
  allergies: string | null;
  next_checkup_date: string | null;
  hospital_referred: string | null;
  inmates: {
    first_name: string | null;
    last_name: string | null;
    cell_block: string | null;
    inmate_id: string | null;
  } | {
    first_name: string | null;
    last_name: string | null;
    cell_block: string | null;
    inmate_id: string | null;
  }[] | null;
}

// --- Main Page ---

export default function HealthReportPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [visitTypeFilter, setVisitTypeFilter] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    routine: 0,
    emergency: 0,
    mentalHealth: 0,
  });

  const fetchStats = useCallback(async () => {
    try {
      const [
        totalRes,
        routineRes,
        emergencyRes,
        mentalHealthRes
      ] = await Promise.all([
        supabase.from("medical_records").select("*", { count: "exact", head: true }),
        supabase.from("medical_records").select("*", { count: "exact", head: true }).eq("visit_type", "Routine Checkup"),
        supabase.from("medical_records").select("*", { count: "exact", head: true }).eq("visit_type", "Emergency"),
        supabase.from("medical_records").select("*", { count: "exact", head: true }).eq("visit_type", "Mental Health"),
      ]);

      if (totalRes.error) console.error("Error fetching total stats:", totalRes.error);
      if (routineRes.error) console.error("Error fetching routine stats:", routineRes.error);
      if (emergencyRes.error) console.error("Error fetching emergency stats:", emergencyRes.error);
      if (mentalHealthRes.error) console.error("Error fetching mental health stats:", mentalHealthRes.error);

      setStats({
        total: totalRes.count || 0,
        routine: routineRes.count || 0,
        emergency: emergencyRes.count || 0,
        mentalHealth: mentalHealthRes.count || 0,
      });
    } catch (error) {
      console.error("Critical error in fetchStats:", error);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setFilterMonth("");
    setVisitTypeFilter("");
    toast.info("Filters reset to default.");
  };

  const generateReport = async () => {
    setIsGenerating(true);
    const loadingToast = toast.loading("Processing clinical records for report generation...");
    try {
      let query = supabase
        .from("medical_records")
        .select(`
          record_id,
          visit_type,
          diagnosis,
          treatment,
          medication,
          blood_pressure,
          temperature_c,
          pulse_rate,
          respiratory_rate,
          medical_condition,
          allergies,
          next_checkup_date,
          hospital_referred,
          record_date,
          inmates (
            first_name,
            last_name,
            cell_block,
            inmate_id
          )
        `);

      if (filterMonth) {
        const date = new Date(filterMonth + "-01T12:00:00");
        const monthStart = format(startOfMonth(date), "yyyy-MM-dd");
        const monthEnd = format(endOfMonth(date), "yyyy-MM-dd");
        query = query.gte("record_date", monthStart).lte("record_date", monthEnd);
      } else {
        if (startDate) query = query.gte("record_date", startDate);
        if (endDate) query = query.lte("record_date", endDate);
      }

      if (visitTypeFilter) {
        query = query.eq("visit_type", visitTypeFilter);
      }

      const { data, error } = await query.order("record_date", { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) {
        toast.dismiss(loadingToast);
        toast.error("No clinical records found for the defined reporting period.");
        return;
      }

      // Generate printable report HTML
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.dismiss(loadingToast);
        toast.error("Failed to open print window. Please check your popup settings.");
        return;
      }

      const recordsHtml = (data as unknown as MedicalRecordTableRow[]).map(record => {
        const inmate = Array.isArray(record.inmates) ? record.inmates[0] : record.inmates;
        const inmateName = `${inmate?.first_name || ""} ${inmate?.last_name || ""}`.trim() || "Unknown PDL";
        return `
          <tr>
            <td>${record.record_date}</td>
            <td>${inmateName}<br/><small style="color: #64748b;">${inmate?.inmate_id || "N/A"}</small></td>
            <td>${record.visit_type || "N/A"}</td>
            <td>${record.diagnosis || "N/A"}</td>
            <td>
              ${record.treatment ? `<div><strong>Treatment:</strong> ${record.treatment}</div>` : ""}
              ${record.medication ? `<div><strong>Medication:</strong> ${record.medication}</div>` : ""}
            </td>
            <td>
              <small>
                BP: ${record.blood_pressure || "N/A"}<br/>
                Temp: ${record.temperature_c ?? "N/A"}°C<br/>
                PR: ${record.pulse_rate ?? "N/A"} | RR: ${record.respiratory_rate ?? "N/A"}
              </small>
            </td>
          </tr>
        `;
      }).join("");

      const dateHeading = filterMonth 
        ? format(new Date(filterMonth + "-01T12:00:00"), "MMMM yyyy")
        : `${startDate || "Beginning"} &mdash; ${endDate || "Present"}`;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Clinical Records Report</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
            .header { display: flex; align-items: center; justify-content: center; text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
            .logo { width: 90px; height: 90px; }
            .header-text { margin: 0 40px; }
            .header-text h1 { font-size: 18px; margin: 0; font-weight: 700; color: #0f172a; }
            .header-text h2 { font-size: 14px; margin: 4px 0; font-weight: 600; color: #475569; }
            .header-text h3 { font-size: 13px; margin: 2px 0; font-weight: 500; color: #64748b; }
            
            .report-info { text-align: center; margin-bottom: 30px; }
            .report-title { font-size: 20px; font-weight: 700; margin-bottom: 8px; color: #0f172a; text-transform: uppercase; }
            .report-date { font-size: 14px; color: #64748b; font-weight: 500; }
            
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background: #f8fafc; text-align: left; padding: 12px 15px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; }
            td { padding: 12px 15px; font-size: 12px; color: #334155; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
            
            .footer { margin-top: 50px; text-align: right; font-size: 12px; color: #94a3b8; }
            @media print {
              @page { size: landscape; margin: 0; }
              body { padding: 2cm; margin: 0; }
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
              <h3>Regional Office VIII</h3>
            </div>
            <img src="/img/logo/bplogo.png" class="logo" />
          </div>
          
          <div class="report-info">
            <div class="report-title">Health Reports & Clinical Records</div>
            <div class="report-date">${dateHeading}</div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="width: 100px;">Date</th>
                <th style="width: 180px;">PDL Name / ID</th>
                <th style="width: 120px;">Visit Type</th>
                <th style="width: 180px;">Diagnosis</th>
                <th>Treatment & Medication</th>
                <th style="width: 140px;">Vital Signs</th>
              </tr>
            </thead>
            <tbody>
              ${recordsHtml}
            </tbody>
          </table>
          

          
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
              }, 500);
            };
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      toast.dismiss(loadingToast);
      toast.success("Clinical report ready for printing!");
    } catch (err) {
      console.error(err);
      toast.dismiss(loadingToast);
      const errorMessage = err instanceof Error ? err.message : "Failed to generate reporting dataset.";
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <MedicalSidebarLayout>
      <div className="w-full space-y-8">
        {/* Header Section */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between px-2">
          <div className="space-y-1">
            <h1 className="font-lexend text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
              Health Reports & Analytics
              <BarChart3 className="text-blue-700" size={32} />
            </h1>
            <p className="text-slate-500 max-w-2xl">
              Monitor medical consultations, emergency interventions, and clinical trends across the facility&apos;s population.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 px-2">
          <StatCard title="Total Consultations" value={stats.total} tone="text-slate-900" />
          <StatCard title="Routine Checkups" value={stats.routine} tone="text-blue-600" />
          <StatCard title="Emergency Cases" value={stats.emergency} tone="text-rose-600" />
          <StatCard title="Mental Health" value={stats.mentalHealth} tone="text-violet-600" />
        </div>

        {/* Action Card */}
        <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 md:p-10 shadow-sm transition-all hover:shadow-md relative overflow-hidden">
          {/* Subtle decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/30 rounded-full -mr-32 -mt-32 pointer-events-none" />

          <div className="relative">
            <div className="mb-10 flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="font-lexend text-2xl font-bold text-slate-900">
                  Export Clinical Data
                </h2>
                <p className="text-sm text-slate-500 max-w-lg">
                  Configure reporting parameters and generate high-fidelity printable reports of medical interventions and PDL health records.
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 transition-transform group hover:scale-110">
                <FileDown className="h-6 w-6" />
              </div>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
                <div className="md:col-span-12">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 border-b border-slate-100 pb-2 inline-block">
                    Reporting Interval & Constraints
                  </p>
                </div>

                {/* Start Date */}
                <div className="md:col-span-3 flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500 font-lexend px-1">
                    Start Date
                  </label>
                  <DatePickerField
                    id="start_date"
                    value={startDate}
                    onSelect={(date) => {
                      setStartDate(date ? format(date, "yyyy-MM-dd") : "");
                      setFilterMonth(""); // Specific dates override month
                    }}
                    placeholder="From date..."
                  />
                </div>

                {/* End Date */}
                <div className="md:col-span-3 flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500 font-lexend px-1">
                    End Date
                  </label>
                  <DatePickerField
                    id="end_date"
                    value={endDate}
                    onSelect={(date) => {
                      setEndDate(date ? format(date, "yyyy-MM-dd") : "");
                      setFilterMonth("");
                    }}
                    placeholder="To date..."
                  />
                </div>

                {/* Month Selector */}
                <div className="md:col-span-3 flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500 font-lexend px-1">
                    Specific Month
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

                {/* Visit Type Filter */}
                <div className="md:col-span-3 flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500 font-lexend px-1">
                    Consultation Type
                  </label>
                  <select
                    value={visitTypeFilter}
                    onChange={(e) => setVisitTypeFilter(e.target.value)}
                    className="w-full h-[52px] rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-700 outline-none transition hover:bg-slate-100 focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none"
                  >
                    <option value="">All Visit Types</option>
                    <option value="Routine Checkup">Routine Checkup</option>
                    <option value="Emergency">Emergency Only</option>
                    <option value="Mental Health">Mental Health</option>
                    <option value="Follow-up">Follow-up Visits</option>
                  </select>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-100 flex items-start gap-4 transition-colors hover:bg-slate-50">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm shrink-0">
                  <Info className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Automated Report Metadata</h4>
                  <p className="text-slate-500 text-sm leading-relaxed mt-1">
                    The generated clinical report incorporates PDL demographics, vital sign history, clinical diagnoses, and prescribed treatments. All timestamps are localized to facility time.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-slate-100">
                <Button 
                  onClick={generateReport}
                  disabled={isGenerating}
                  className="h-14 rounded-2xl bg-blue-700 px-10 font-bold text-white shadow-xl shadow-blue-200 transition-all hover:bg-blue-800 hover:shadow-2xl active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait cursor-pointer"
                >
                  {isGenerating ? (
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  ) : (
                    <FileDown className="mr-2 h-6 w-6" />
                  )}
                  {isGenerating ? "Preparing Report..." : "Generate Printable Report"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="h-14 rounded-2xl border-slate-200 bg-slate-50 px-8 font-semibold text-slate-600 transition-all hover:bg-white hover:text-slate-900 active:scale-[0.98] cursor-pointer"
                >
                  <XCircle className="mr-2 h-5 w-5" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MedicalSidebarLayout>
  );
}
