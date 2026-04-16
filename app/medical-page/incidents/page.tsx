"use client";

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import {
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getFilteredRowModel,
    useReactTable,
    type ColumnDef,
    type PaginationState,
    type ColumnFiltersState,
} from "@tanstack/react-table";
import { 
    AlertCircle, 
    Search, 
    FilterX, 
    ChevronDown, 
    Check, 
    Calendar,
    PlusCircle,
    Eye,
    LifeBuoy
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import IconButton from "@/components/ui/IconButton";
import { Skeleton } from "@/components/ui/skeleton";
import MedicalSidebarLayout from "../components/MedicalSidebarLayout";
import AddIncidentModal from "../components/AddIncidentModal";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

type SeverityLevel = "Low" | "Medium" | "High" | "Critical";

type IncidentRecord = {
    id: string;
    inmateName: string;
    date: string;
    type: string;
    severity: SeverityLevel;
    location: string;
    status: string;
    actionTaken: string;
};

interface SupabaseIncident {
    incident_id: number;
    incident_date: string;
    incident_type: string;
    severity_level: string;
    location: string;
    status: string;
    action_taken: string;
    inmates: {
        first_name: string;
        last_name: string;
    } | {
        first_name: string;
        last_name: string;
    }[] | null;
}

const SEVERITY_THEME: Record<SeverityLevel, { color: string; mutedColor: string }> = {
    Low: { color: "#0f766e", mutedColor: "#99f6e4" },
    Medium: { color: "#1d4ed8", mutedColor: "#93c5fd" },
    High: { color: "#c2410c", mutedColor: "#fdba74" },
    Critical: { color: "#be123c", mutedColor: "#fecdd3" },
};

function countBySeverity(rows: IncidentRecord[], severity: SeverityLevel) {
    return rows.filter((row) => row.severity === severity).length;
}

export default function MedicalIncidentsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-slate-500 font-lexend text-sm">Loading Incidents Portal...</div>}>
            <MedicalIncidentsPageContent />
        </Suspense>
    );
}

function MedicalIncidentsPageContent() {
    const [globalFilter, setGlobalFilter] = useState("");
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 8 });
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [severityFilterOpen, setSeverityFilterOpen] = useState(false);
    const [pageSizeOpen, setPageSizeOpen] = useState(false);

    const fetchIncidents = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from("incidents")
                .select(`
                    incident_id,
                    incident_date,
                    incident_type,
                    severity_level,
                    location,
                    status,
                    action_taken,
                    inmates (
                        first_name,
                        last_name
                    )
                `)
                .order("incident_date", { ascending: false });

            if (error) throw error;

            const formatted: IncidentRecord[] = (data as unknown as SupabaseIncident[] || []).map((item) => {
                const inmate = Array.isArray(item.inmates) ? item.inmates[0] : item.inmates;
                return {
                    id: String(item.incident_id),
                    inmateName: inmate ? `${inmate.first_name} ${inmate.last_name}` : "Unknown Inmate",
                    date: item.incident_date,
                    type: item.incident_type,
                    severity: item.severity_level as SeverityLevel,
                    location: item.location || "N/A",
                    status: item.status || "Reported",
                    actionTaken: item.action_taken || "No action recorded",
                };
            });
            setIncidents(formatted);
        } catch (err) {
            console.error("Error fetching incidents:", err);
            toast.error("Failed to load incident records.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchIncidents();
    }, [fetchIncidents]);

    const columns = useMemo<ColumnDef<IncidentRecord>[]>(
        () => [
            {
                header: "Date",
                accessorKey: "date",
                cell: ({ row }) => (
                    <div className="flex items-center gap-2 text-slate-600">
                        <Calendar size={14} className="text-slate-400" />
                        <span className="font-medium">{format(new Date(row.original.date), "MMM dd, yyyy")}</span>
                    </div>
                ),
            },
            {
                header: "Inmate",
                accessorKey: "inmateName",
                cell: ({ row }) => (
                    <span className="font-semibold text-slate-800">{row.original.inmateName}</span>
                ),
            },
            {
                header: "Type",
                accessorKey: "type",
                cell: ({ row }) => (
                    <span className="text-slate-600">{row.original.type}</span>
                ),
            },
            {
                header: "Severity",
                accessorKey: "severity",
                filterFn: 'equals',
                cell: ({ row }) => {
                    const severity = row.original.severity;
                    const theme = SEVERITY_THEME[severity] || SEVERITY_THEME.Low;
                    return (
                        <span
                            className="inline-flex rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider"
                            style={{ backgroundColor: theme.mutedColor, color: theme.color }}
                        >
                            {severity}
                        </span>
                    );
                },
            },
            {
                header: "Location",
                accessorKey: "location",
            },
            {
                header: "Action Taken",
                accessorKey: "actionTaken",
                cell: ({ row }) => (
                    <span className="text-xs text-slate-500 italic max-w-xs truncate block">
                        {row.original.actionTaken}
                    </span>
                ),
            },
            {
                header: "Actions",
                id: "actions",
                cell: () => (
                    <div className="flex items-center gap-2">
                        <IconButton
                           onMouseDown={() => {}} // Placeholder for view
                           title="View Details"
                           icon={<Eye size={16} />}
                           colorClass="bg-white border text-slate-500 hover:text-indigo-600 hover:border-indigo-100"
                        >
                            View
                        </IconButton>
                    </div>
                ),
            },
        ],
        []
    );

    const table = useReactTable({
        data: incidents,
        columns,
        state: { 
            pagination,
            globalFilter,
            columnFilters,
        },
        onPaginationChange: setPagination,
        onGlobalFilterChange: setGlobalFilter,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    const graphCounts = useMemo(
        () => [
            { severity: "High" as const, count: countBySeverity(incidents, "High") + countBySeverity(incidents, "Critical") },
            { severity: "Medium" as const, count: countBySeverity(incidents, "Medium") },
            { severity: "Low" as const, count: countBySeverity(incidents, "Low") },
        ],
        [incidents]
    );

    const totalForGraph = graphCounts.reduce((sum, item) => sum + item.count, 0);

    const pieGradient = useMemo(() => {
        if (totalForGraph === 0) return "conic-gradient(#cbd5e1 0deg 360deg)";
        let currentAngle = 0;
        const segments = graphCounts.map((item) => {
            const sliceAngle = (item.count / totalForGraph) * 360;
            const start = currentAngle;
            const end = currentAngle + sliceAngle;
            currentAngle = end;
            const color = item.severity === "High" ? SEVERITY_THEME.High.color : 
                          item.severity === "Medium" ? SEVERITY_THEME.Medium.color : 
                          SEVERITY_THEME.Low.color;
            return `${color} ${start}deg ${end}deg`;
        });
        return `conic-gradient(${segments.join(", ")})`;
    }, [graphCounts, totalForGraph]);

    return (
        <MedicalSidebarLayout>
            <section className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h1 className="font-lexend text-3xl font-bold text-slate-900 flex items-center gap-3">
                            Medical Incidents
                            <AlertCircle className="text-indigo-700" size={32} />
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Monitor and record medical emergencies, health-related conduct, and clinical incidents.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <IconButton
                            onClick={() => setIsAddModalOpen(true)}
                            icon={<PlusCircle size={18} className="-ml-1" />} 
                            colorClass="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100"
                        >
                            Log New Incident
                        </IconButton>
                        <IconButton
                            onClick={() => {}} // Placeholder for help/info
                            icon={<LifeBuoy size={18} className="-ml-1" />} 
                            colorClass="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                        >
                            Incident Protocol
                        </IconButton>
                    </div>
                </div>

                {/* Status Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {isLoading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-28 rounded-2xl bg-white shadow-sm" />
                        ))
                    ) : (
                        <>
                            <SummaryCard title="Total Incidents" value={String(incidents.length)} tone="text-slate-900" />
                            <SummaryCard title="Critical/High" value={String(countBySeverity(incidents, "High") + countBySeverity(incidents, "Critical"))} tone="text-rose-600" />
                            <SummaryCard title="Routine Emergencies" value={String(incidents.filter(i => i.type === "Health Emergency").length)} tone="text-indigo-600" />
                            <SummaryCard title="Resolved Cases" value={String(incidents.filter(i => i.status === "Resolved").length)} tone="text-emerald-600" />
                        </>
                    )}
                </div>

                <div className="flex flex-col xl:flex-row gap-5">
                    {/* Severity Distribution */}
                    {isLoading ? (
                        <Skeleton className="max-w-sm w-full h-[300px] rounded-2xl" />
                    ) : (
                    <div className="max-w-sm min-w-0 w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="font-lexend text-lg font-bold text-slate-800">Severity Distribution</h2>
                        <div className="mt-8 flex items-center justify-center">
                            <div
                                className="h-36 w-36 rounded-full border-8 border-white shadow-lg transition-transform hover:scale-105"
                                style={{ background: pieGradient }}
                            />
                        </div>
                        <div className="mt-10 space-y-3">
                            {graphCounts.map((item) => (
                                <div key={item.severity} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                        <span
                                            className="h-3 w-3 rounded-full"
                                            style={{ backgroundColor: item.severity === "High" ? SEVERITY_THEME.High.color : item.severity === "Medium" ? SEVERITY_THEME.Medium.color : SEVERITY_THEME.Low.color }}
                                        />
                                        {item.severity} Level
                                    </div>
                                    <span className="text-sm font-bold text-slate-900">{item.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    )}

                    {/* Incidents Table */}
                    <div className="flex-1 min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-4 sm:flex-row sm:items-center">
                            <div className="relative flex-1 sm:max-w-xs">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Filter by inmate or location..."
                                    value={globalFilter ?? ""}
                                    onChange={(e) => setGlobalFilter(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                            </div>

                            <Popover open={severityFilterOpen} onOpenChange={setSeverityFilterOpen}>
                                <PopoverTrigger className="flex min-w-[160px] items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition drop-shadow-sm">
                                    <span>{(table.getColumn("severity")?.getFilterValue() as string) || "All Severities"}</span>
                                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${severityFilterOpen ? "rotate-180" : ""}`} />
                                </PopoverTrigger>
                                <PopoverContent align="start" className="w-48 p-1">
                                    {["", "Low", "Medium", "High", "Critical"].map((sev) => (
                                        <button
                                            key={sev}
                                            onClick={() => {
                                                table.getColumn("severity")?.setFilterValue(sev || undefined);
                                                setSeverityFilterOpen(false);
                                            }}
                                            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                                        >
                                            {sev || "All Severities"}
                                            {((table.getColumn("severity")?.getFilterValue() as string) ?? "") === sev && <Check size={14} className="text-indigo-600" />}
                                        </button>
                                    ))}
                                </PopoverContent>
                            </Popover>

                            {globalFilter && (
                                <button
                                    onClick={() => setGlobalFilter("")}
                                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-rose-600 bg-rose-50 rounded-xl hover:bg-rose-100 transition border border-rose-100"
                                >
                                    <FilterX size={14} />
                                    Reset
                                </button>
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50/80 border-b border-slate-200">
                                    {table.getHeaderGroups().map(group => (
                                        <tr key={group.id}>
                                            {group.headers.map(header => (
                                                <th key={header.id} className="px-6 py-4 text-left font-bold text-slate-600 uppercase tracking-tight text-[11px]">
                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                </th>
                                            ))}
                                        </tr>
                                    ))}
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {isLoading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i}>
                                                {Array.from({ length: 7 }).map((_, j) => (
                                                    <td key={j} className="px-6 py-4"><Skeleton className="h-4 w-full" /></td>
                                                ))}
                                            </tr>
                                        ))
                                    ) : table.getRowModel().rows.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-slate-500 italic">No medical incidents found.</td>
                                        </tr>
                                    ) : (
                                        table.getRowModel().rows.map(row => (
                                            <tr key={row.id} className="hover:bg-slate-50/50 transition-colors group">
                                                {row.getVisibleCells().map(cell => (
                                                    <td key={cell.id} className="px-6 py-4 text-slate-600">
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/30">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <span>Rows per page:</span>
                                <Popover open={pageSizeOpen} onOpenChange={setPageSizeOpen}>
                                    <PopoverTrigger className="flex items-center justify-between gap-2 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 cursor-pointer transition-all hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-w-14">
                                        <span>{table.getState().pagination.pageSize}</span>
                                        <ChevronDown size={12} className={`text-slate-400 transition-transform shrink-0 ${pageSizeOpen ? "rotate-180" : ""}`} />
                                    </PopoverTrigger>
                                    <PopoverContent align="start" sideOffset={6} className="w-20 p-1">
                                        {[8, 15, 30].map((size) => (
                                            <button
                                                key={size}
                                                type="button"
                                                onClick={() => {
                                                    table.setPageSize(size);
                                                    setPageSizeOpen(false);
                                                }}
                                                className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
                                            >
                                                <span className="flex-1 text-left">{size}</span>
                                                {table.getState().pagination.pageSize === size && (
                                                    <Check className="h-3.5 w-3.5 text-indigo-600" />
                                                )}
                                            </button>
                                        ))}
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-xs text-slate-500 font-medium">Page {pagination.pageIndex + 1} of {table.getPageCount()}</span>
                                <div className="flex items-center gap-1">
                                    <button
                                        disabled={!table.getCanPreviousPage()}
                                        onClick={() => table.previousPage()}
                                        className="p-1 disabled:opacity-30 cursor-pointer"
                                    ><ChevronDown className="rotate-90 text-slate-600" size={18} /></button>
                                    <button
                                        disabled={!table.getCanNextPage()}
                                        onClick={() => table.nextPage()}
                                        className="p-1 disabled:opacity-30 cursor-pointer"
                                    ><ChevronDown className="-rotate-90 text-slate-600" size={18} /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <AddIncidentModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={fetchIncidents}
            />
        </MedicalSidebarLayout>
    );
}

function SummaryCard({ title, value, tone }: { title: string; value: string; tone: string }) {
    return (
        <article className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</p>
            <p className={`mt-3 text-4xl font-bold font-lexend ${tone}`}>{value}</p>
        </article>
    );
}
