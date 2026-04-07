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
import { Eye, Search, FilterX, ChevronDown, Users, Hash, User, Calendar, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import OfficerSidebarLayout from "../components/OfficerSidebarLayout";
import ViewInmateModal from "../../admin-page/components/ViewInmateModal";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

type InmateStatus = "Active" | "Released" | "Transferred";

type InmateRecord = {
    id: string;
    firstName: string;
    lastName: string;
    birthdate: string;
    gender: "Male" | "Female";
    status: InmateStatus;
};

interface SupabaseInmate {
    inmate_id: number;
    first_name: string;
    last_name: string;
    birthdate: string;
    gender: string;
    status: string;
}

const STATUS_THEME: Record<InmateStatus, { color: string; mutedColor: string }> = {
    Active: { color: "#0f766e", mutedColor: "#99f6e4" },
    Released: { color: "#c2410c", mutedColor: "#fdba74" },
    Transferred: { color: "#1d4ed8", mutedColor: "#93c5fd" },
};

function statusCountFromRows(rows: InmateRecord[], status: InmateStatus) {
    return rows.filter((row) => row.status === status).length;
}

export default function OfficerInmatePage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-slate-500 font-lexend">Loading Inmate Records...</div>}>
            <OfficerInmatePageContent />
        </Suspense>
    );
}

function OfficerInmatePageContent() {
    const searchParams = useSearchParams();
    const initialSearch = searchParams.get("id") || searchParams.get("search") || "";
    
    const [globalFilter, setGlobalFilter] = useState(initialSearch);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 5 });
    const [inmates, setInmates] = useState<InmateRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedInmateId, setSelectedInmateId] = useState<string | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [statusFilterOpen, setStatusFilterOpen] = useState(false);
    const [genderFilterOpen, setGenderFilterOpen] = useState(false);
    const [pageSizeOpen, setPageSizeOpen] = useState(false);

    const fetchInmates = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from("inmates")
                .select("inmate_id, first_name, last_name, birthdate, gender, status")
                .order("inmate_id", { ascending: false });

            if (error) {
                console.error("Supabase error fetching inmates:", error);
                throw new Error(error.message);
            }

            const formatted: InmateRecord[] = (data as SupabaseInmate[] || []).map((item) => ({
                id: String(item.inmate_id),
                firstName: item.first_name || "",
                lastName: item.last_name || "",
                birthdate: item.birthdate || "",
                gender: item.gender as "Male" | "Female",
                status: item.status as InmateStatus,
            }));
            setInmates(formatted);
        } catch (err) {
            console.error("Error fetching inmates:", err);
            toast.error("Failed to load inmate records.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInmates();
    }, [fetchInmates]);

    const uniqueStatuses = useMemo(() => Array.from(new Set(inmates.map((i) => i.status))).sort(), [inmates]);
    const uniqueGenders = useMemo(() => Array.from(new Set(inmates.map((i) => i.gender))).sort(), [inmates]);

    const columns = useMemo<ColumnDef<InmateRecord>[]>(
        () => [
            {
                header: "ID",
                accessorKey: "id",
                cell: ({ row }) => (
                    <div className="flex items-center gap-1.5">
                        <Hash size={14} className="text-slate-400" />
                        <span className="font-mono text-xs text-slate-500 font-bold">{row.original.id}</span>
                    </div>
                ),
            },
            {
                header: "First Name",
                accessorKey: "firstName",
                cell: ({ row }) => (
                    <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <User size={16} />
                        </div>
                        <span className="font-medium text-slate-800">{row.original.firstName}</span>
                    </div>
                ),
            },
            {
                header: "Last Name",
                accessorKey: "lastName",
                cell: ({ row }) => (
                    <div className="flex items-center gap-2 text-slate-600">
                        <User size={16} className="text-slate-400" />
                        <span>{row.original.lastName}</span>
                    </div>
                ),
            },
            {
                header: "Birthdate",
                accessorKey: "birthdate",
                cell: ({ row }) => (
                    <div className="flex items-center gap-2 text-slate-600">
                        <Calendar size={16} className="text-slate-400" />
                        <span>{row.original.birthdate}</span>
                    </div>
                ),
            },
            {
                header: "Gender",
                accessorKey: "gender",
                filterFn: 'equals',
                cell: ({ row }) => (
                    <div className="flex items-center gap-2 text-slate-600">
                        <Users size={16} className="text-slate-400" />
                        <span>{row.original.gender}</span>
                    </div>
                ),
            },
            {
                header: "Status",
                accessorKey: "status",
                filterFn: 'equals',
                cell: ({ row }) => {
                    const status = row.original.status;
                    const theme = STATUS_THEME[status];

                    return (
                        <span
                            className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                            style={{ backgroundColor: theme.mutedColor, color: theme.color }}
                        >
                            {status}
                        </span>
                    );
                },
            },
            {
                header: "Actions",
                id: "actions",
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <button 
                            type="button" 
                            className="text-teal-700 hover:text-teal-900 transition p-1 hover:bg-teal-50 rounded-md cursor-pointer" 
                            title="View Details"
                            onClick={() => {
                                setSelectedInmateId(row.original.id);
                                setIsViewModalOpen(true);
                            }}
                        >
                            <Eye size={18} />
                        </button>
                    </div>
                ),
            },
        ],
        []
    );

    const table = useReactTable({
        data: inmates,
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
            { status: "Active" as const, count: statusCountFromRows(inmates, "Active") },
            { status: "Released" as const, count: statusCountFromRows(inmates, "Released") },
            { status: "Transferred" as const, count: statusCountFromRows(inmates, "Transferred") },
        ],
        [inmates]
    );

    const totalForGraph = graphCounts.reduce((sum, item) => sum + item.count, 0);

    const pieGradient = useMemo(() => {
        if (totalForGraph === 0) {
            return "conic-gradient(#cbd5e1 0deg 360deg)";
        }

        let currentAngle = 0;
        const segments = graphCounts.map((item) => {
            const sliceAngle = (item.count / totalForGraph) * 360;
            const start = currentAngle;
            const end = currentAngle + sliceAngle;
            currentAngle = end;
            return `${STATUS_THEME[item.status].color} ${start}deg ${end}deg`;
        });

        return `conic-gradient(${segments.join(", ")})`;
    }, [graphCounts, totalForGraph]);

    const activeCount = graphCounts.find((item) => item.status === "Active")?.count ?? 0;
    const releasedCount = graphCounts.find((item) => item.status === "Released")?.count ?? 0;
    const transferredCount = graphCounts.find((item) => item.status === "Transferred")?.count ?? 0;

    return (
        <OfficerSidebarLayout>
            <section className="space-y-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h1 className="font-lexend text-3xl font-semibold text-slate-800 flex items-center gap-3">
                            Inmate Records
                            <Users className="text-teal-700" size={32} />
                        </h1>
                        <p className="mt-1 text-sm text-slate-600">
                            View and monitor inmate profiles and custodial records.
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard title="Total Records" value={String(totalForGraph)} tone="text-slate-900" />
                    <SummaryCard title="Active Inmates" value={String(activeCount)} tone="text-teal-700" />
                    <SummaryCard title="Released Inmates" value={String(releasedCount)} tone="text-orange-600" />
                    <SummaryCard title="Transferred Inmates" value={String(transferredCount)} tone="text-blue-700" />
                </div>

                <div className="flex gap-5">
                    <div className="max-w-sm min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <h2 className="font-lexend text-lg font-semibold text-slate-800">Status Distribution</h2>

                        <div className="mt-3 flex items-center justify-center">
                            <div
                                className="h-32 w-32 rounded-full border-6 border-white shadow-inner"
                                style={{ background: pieGradient }}
                                aria-label="Inmate status distribution"
                            />
                        </div>

                        <div className="mt-4 space-y-2.5">
                            {graphCounts.map((item) => (
                                <div key={item.status} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                                    <div className="flex items-center gap-2 text-sm text-slate-700">
                                        <span
                                            className="h-3 w-3 rounded-sm"
                                            style={{ backgroundColor: STATUS_THEME[item.status].color }}
                                        />
                                        {item.status}
                                    </div>
                                    <span className="text-sm font-semibold text-slate-900">{item.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
                            <div className="relative flex-1 sm:max-w-xs">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <Search size={16} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search inmates..."
                                    value={globalFilter ?? ""}
                                    onChange={(event) => {
                                        setGlobalFilter(event.target.value);
                                        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                                    }}
                                    className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg bg-white text-sm text-slate-700 outline-none ring-teal-500 focus:ring-2 focus:border-teal-500 transition-all placeholder:text-slate-400"
                                />
                            </div>

                            <Popover open={statusFilterOpen} onOpenChange={setStatusFilterOpen}>
                              <PopoverTrigger className="flex min-w-40 items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition cursor-pointer focus:ring-2 focus:border-teal-500 ring-teal-500 sm:w-48">
                                <span className={(table.getColumn("status")?.getFilterValue() as string) ? "text-slate-700" : "text-slate-400"}>
                                  {(table.getColumn("status")?.getFilterValue() as string) || "All Statuses"}
                                </span>
                                <ChevronDown size={14} className={`shrink-0 text-slate-400 transition-transform ${statusFilterOpen ? "rotate-180" : ""}`} />
                              </PopoverTrigger>
                              <PopoverContent align="start" sideOffset={6} className="w-48 p-1">
                                <button type="button" onClick={() => { table.getColumn("status")?.setFilterValue(undefined); setPagination(prev => ({ ...prev, pageIndex: 0 })); setStatusFilterOpen(false); }} className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100">
                                  <span className="flex-1 text-left">All Statuses</span>
                                  {!(table.getColumn("status")?.getFilterValue() as string) && <Check className="h-3.5 w-3.5 text-teal-600" />}
                                </button>
                                {uniqueStatuses.map((status) => (
                                  <button key={status} type="button" onClick={() => { table.getColumn("status")?.setFilterValue(status); setPagination(prev => ({ ...prev, pageIndex: 0 })); setStatusFilterOpen(false); }} className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100">
                                    <span className="flex-1 text-left">{status}</span>
                                    {(table.getColumn("status")?.getFilterValue() as string) === status && <Check className="h-3.5 w-3.5 text-teal-600" />}
                                  </button>
                                ))}
                              </PopoverContent>
                            </Popover>

                            <Popover open={genderFilterOpen} onOpenChange={setGenderFilterOpen}>
                              <PopoverTrigger className="flex min-w-36 items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition cursor-pointer focus:ring-2 focus:border-teal-500 ring-teal-500 sm:w-40">
                                <span className={(table.getColumn("gender")?.getFilterValue() as string) ? "text-slate-700" : "text-slate-400"}>
                                  {(table.getColumn("gender")?.getFilterValue() as string) || "All Genders"}
                                </span>
                                <ChevronDown size={14} className={`shrink-0 text-slate-400 transition-transform ${genderFilterOpen ? "rotate-180" : ""}`} />
                              </PopoverTrigger>
                              <PopoverContent align="start" sideOffset={6} className="w-40 p-1">
                                <button type="button" onClick={() => { table.getColumn("gender")?.setFilterValue(undefined); setPagination(prev => ({ ...prev, pageIndex: 0 })); setGenderFilterOpen(false); }} className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100">
                                  <span className="flex-1 text-left">All Genders</span>
                                  {!(table.getColumn("gender")?.getFilterValue() as string) && <Check className="h-3.5 w-3.5 text-teal-600" />}
                                </button>
                                {uniqueGenders.map((gender) => (
                                  <button key={gender} type="button" onClick={() => { table.getColumn("gender")?.setFilterValue(gender); setPagination(prev => ({ ...prev, pageIndex: 0 })); setGenderFilterOpen(false); }} className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100">
                                    <span className="flex-1 text-left">{gender}</span>
                                    {(table.getColumn("gender")?.getFilterValue() as string) === gender && <Check className="h-3.5 w-3.5 text-teal-600" />}
                                  </button>
                                ))}
                              </PopoverContent>
                            </Popover>

                            {(globalFilter || columnFilters.length > 0) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setGlobalFilter("");
                                        setColumnFilters([]);
                                        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                                    }}
                                    className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-100 cursor-pointer"
                                >
                                    <FilterX size={14} />
                                    Clear Filters
                                </button>
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="border-b border-slate-200 bg-slate-50">
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <tr key={headerGroup.id}>
                                            {headerGroup.headers.map((header) => (
                                                <th
                                                    key={header.id}
                                                    className={`px-5 py-3 text-left text-sm font-semibold text-slate-700 ${
                                                        header.id === "actions" ? "sticky right-0 z-10 bg-slate-50" : ""
                                                    }`}
                                                >
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(header.column.columnDef.header, header.getContext())}
                                                </th>
                                            ))}
                                        </tr>
                                    ))}
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={columns.length} className="px-5 py-12 text-center text-sm text-slate-500">
                                                Loading records...
                                            </td>
                                        </tr>
                                    ) : table.getRowModel().rows.length === 0 ? (
                                        <tr>
                                            <td colSpan={columns.length} className="px-5 py-12 text-center text-sm text-slate-500">
                                                No records found.
                                            </td>
                                        </tr>
                                    ) : (
                                        table.getRowModel().rows.map((row, i) => {
                                            const isEven = i % 2 !== 0;
                                            const rowBg = isEven ? 'bg-slate-200' : 'bg-white';
                                            
                                            return (
                                                <tr key={row.id} className={`${rowBg} hover:bg-teal-50 transition-colors group`}>
                                                    {row.getVisibleCells().map((cell) => {
                                                        const isActions = cell.column.id === "actions";
                                                          return (
                                                            <td
                                                                key={cell.id}
                                                                className={`px-5 py-3 text-sm text-slate-700 ${
                                                                    isActions 
                                                                        ? `sticky right-0 z-10 ${rowBg} shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)] transition-colors group-hover:bg-teal-50` 
                                                                        : ""
                                                                }`}
                                                            >
                                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <span>Rows per page:</span>
                                <Popover open={pageSizeOpen} onOpenChange={setPageSizeOpen}>
                                  <PopoverTrigger className="flex min-w-14 items-center justify-between gap-2 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm cursor-pointer transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20">
                                    <span className="text-slate-700">{table.getState().pagination.pageSize}</span>
                                    <ChevronDown size={14} className={`shrink-0 text-slate-400 transition-transform ${pageSizeOpen ? "rotate-180" : ""}`} />
                                  </PopoverTrigger>
                                  <PopoverContent align="start" sideOffset={6} className="w-20 p-1">
                                    {[5, 8, 10].map((size) => (
                                      <button key={size} type="button" onClick={() => { table.setPageSize(size); setPageSizeOpen(false); }} className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100">
                                        <span className="flex-1 text-left">{size}</span>
                                        {table.getState().pagination.pageSize === size && <Check className="h-3.5 w-3.5 text-teal-600" />}
                                      </button>
                                    ))}
                                  </PopoverContent>
                                </Popover>
                            </div>

                            <div className="flex items-center gap-3">
                                <p className="text-sm text-slate-600">
                                    Page {table.getState().pagination.pageIndex + 1} of {Math.max(table.getPageCount(), 1)}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => table.previousPage()}
                                    disabled={!table.getCanPreviousPage()}
                                    className="cursor-pointer rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    type="button"
                                    onClick={() => table.nextPage()}
                                    disabled={!table.getCanNextPage()}
                                    className="cursor-pointer rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <ViewInmateModal
                isOpen={isViewModalOpen}
                onClose={() => {
                    setIsViewModalOpen(false);
                    setSelectedInmateId(null);
                }}
                inmateId={selectedInmateId}
            />
        </OfficerSidebarLayout>
    );
}

type SummaryCardProps = {
    title: string;
    value: string;
    tone: string;
};

function SummaryCard({ title, value, tone }: SummaryCardProps) {
    return (
        <article className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-sm text-slate-500">{title}</p>
            <p className={`mt-2 text-4xl font-semibold ${tone}`}>{value}</p>
        </article>
    );
}
