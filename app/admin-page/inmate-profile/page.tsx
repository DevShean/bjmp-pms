"use client";

import { useEffect, useMemo, useState } from "react";
import {
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    useReactTable,
    type ColumnDef,
    type PaginationState,
} from "@tanstack/react-table";
import { Eye, Edit, Trash2 } from "lucide-react";
import AdminSidebarLayout from "../components/AdminSidebarLayout";
import AddInmateModal from "../components/AddInmateModal";

type InmateStatus = "Active" | "Released" | "Transferred";

type InmateRecord = {
    id: string;
    firstName: string;
    lastName: string;
    birthdate: string;
    gender: "Male" | "Female";
    status: InmateStatus;
};

type GraphApiResponse = {
    statusCounts: Array<{ status: InmateStatus; count: number }>;
    generatedAt: string;
};

const INMATES: InmateRecord[] = [
    { id: "INM-001", firstName: "Leo", lastName: "Navarro", birthdate: "1994-03-08", gender: "Male", status: "Active" },
    { id: "INM-002", firstName: "Daniel", lastName: "Cortez", birthdate: "1989-06-30", gender: "Male", status: "Active" },
    { id: "INM-003", firstName: "Eric", lastName: "Gomez", birthdate: "1991-01-25", gender: "Male", status: "Released" },
    { id: "INM-004", firstName: "Ramon", lastName: "Villanueva", birthdate: "1998-04-14", gender: "Male", status: "Active" },
    { id: "INM-005", firstName: "Michael", lastName: "Tan", birthdate: "1987-09-09", gender: "Male", status: "Transferred" },
    { id: "INM-006", firstName: "Anthony", lastName: "Lopez", birthdate: "1992-12-01", gender: "Male", status: "Active" },
    { id: "INM-007", firstName: "Jose", lastName: "Mendoza", birthdate: "1985-07-18", gender: "Male", status: "Active" },
    { id: "INM-008", firstName: "Pedro", lastName: "Reyes", birthdate: "1995-02-20", gender: "Male", status: "Active" },
    { id: "INM-009", firstName: "Mark", lastName: "Santos", birthdate: "1988-11-03", gender: "Male", status: "Active" },
    { id: "INM-010", firstName: "Juans", lastName: "Dela Cruz", birthdate: "1990-05-12", gender: "Male", status: "Active" },
];

const STATUS_THEME: Record<InmateStatus, { color: string; mutedColor: string }> = {
    Active: { color: "#0f766e", mutedColor: "#99f6e4" },
    Released: { color: "#c2410c", mutedColor: "#fdba74" },
    Transferred: { color: "#1d4ed8", mutedColor: "#93c5fd" },
};

function statusCountFromRows(rows: InmateRecord[], status: InmateStatus) {
    return rows.filter((row) => row.status === status).length;
}

export default function InmateProfilePage() {
    const [searchField, setSearchField] = useState<"name" | "status" | "gender">("name");
    const [searchTerm, setSearchTerm] = useState("");
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 5 });
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [graphData, setGraphData] = useState<GraphApiResponse | null>(null);
    const [graphError, setGraphError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        async function loadGraph() {
            try {
                const response = await fetch("/api/inmate-status", { signal: controller.signal });
                if (!response.ok) {
                    throw new Error("Unable to load graph data.");
                }

                const payload = (await response.json()) as GraphApiResponse;
                setGraphData(payload);
            } catch (error) {
                if ((error as Error).name !== "AbortError") {
                    setGraphError("Graph data is temporarily unavailable.");
                }
            }
        }

        void loadGraph();

        return () => {
            controller.abort();
        };
    }, []);

    const filteredRows = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();
        if (!keyword) {
            return INMATES;
        }

        return INMATES.filter((row) => {
            if (searchField === "name") {
                return `${row.firstName} ${row.lastName}`.toLowerCase().includes(keyword);
            }

            if (searchField === "status") {
                return row.status.toLowerCase().includes(keyword);
            }

            return row.gender.toLowerCase().includes(keyword);
        });
    }, [searchField, searchTerm]);

    const columns = useMemo<ColumnDef<InmateRecord>[]>(
        () => [
            {
                header: "First Name",
                accessorKey: "firstName",
            },
            {
                header: "Last Name",
                accessorKey: "lastName",
            },
            {
                header: "Birthdate",
                accessorKey: "birthdate",
            },
            {
                header: "Gender",
                accessorKey: "gender",
            },
            {
                header: "Status",
                accessorKey: "status",
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
                cell: () => (
                    <div className="flex items-center gap-2">
                        <button type="button" className="text-teal-700 hover:text-teal-900 transition" title="View">
                            <Eye size={18} />
                        </button>
                        <button type="button" className="text-blue-700 hover:text-blue-900 transition" title="Edit">
                            <Edit size={18} />
                        </button>
                        <button type="button" className="text-rose-600 hover:text-rose-700 transition" title="Delete">
                            <Trash2 size={18} />
                        </button>
                    </div>
                ),
            },
        ],
        []
    );

    const table = useReactTable({
        data: filteredRows,
        columns,
        state: { pagination },
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    const graphCounts = useMemo(
        () =>
            graphData?.statusCounts ?? [
                { status: "Active" as const, count: statusCountFromRows(INMATES, "Active") },
                { status: "Released" as const, count: statusCountFromRows(INMATES, "Released") },
                { status: "Transferred" as const, count: statusCountFromRows(INMATES, "Transferred") },
            ],
        [graphData]
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
        <>
        <AdminSidebarLayout>
            <section className="space-y-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h1 className="font-lexend text-3xl font-semibold text-slate-800">Inmates Management</h1>
                        <p className="mt-1 text-sm text-slate-600">
                            Manage inmate profiles, medical assignments, and records.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setIsAddModalOpen(true)}
                            className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
                        >
                            Add New Inmate
                        </button>
                        <button
                            type="button"
                            className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
                        >
                            Assign Medical Staff
                        </button>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard title="Total Inmates" value={String(totalForGraph)} tone="text-slate-900" />
                    <SummaryCard title="Active Inmates" value={String(activeCount)} tone="text-teal-700" />
                    <SummaryCard title="Released Inmates" value={String(releasedCount)} tone="text-orange-600" />
                    <SummaryCard title="Transferred Inmates" value={String(transferredCount)} tone="text-blue-700" />
                </div>

                <div className="flex gap-5">
                    <div className="max-w-sm min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <h2 className="font-lexend text-lg font-semibold text-slate-800">Inmate Status Distribution</h2>

                        <div className="mt-3 flex items-center justify-center">
                            <div
                                className="h-32 w-32 rounded-full border-6 border-white shadow-inner"
                                style={{ background: pieGradient }}
                                aria-label="Inmate status distribution pie graph"
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

                        {graphError ? <p className="mt-3 text-xs text-rose-600">{graphError}</p> : null}
                    </div>

                    <div className="flex-1 min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center">
                            <select
                                value={searchField}
                                onChange={(event) => {
                                    setSearchField(event.target.value as "name" | "status" | "gender");
                                    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                                }}
                                className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none ring-teal-500 focus:ring-2"
                            >
                                <option value="name">Name</option>
                                <option value="status">Status</option>
                                <option value="gender">Gender</option>
                            </select>

                            <input
                                type="text"
                                placeholder="Enter search term..."
                                value={searchTerm}
                                onChange={(event) => {
                                    setSearchTerm(event.target.value);
                                    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                                }}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none ring-teal-500 placeholder:text-slate-400 focus:ring-2"
                            />

                            <button
                                type="button"
                                className="rounded-lg bg-teal-700 px-6 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
                            >
                                Search
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setSearchField("name");
                                    setSearchTerm("");
                                    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                                }}
                                className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300"
                            >
                                Clear
                            </button>
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
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {table.getRowModel().rows.length === 0 ? (
                                        <tr>
                                            <td colSpan={columns.length} className="px-5 py-12 text-center text-sm text-slate-500">
                                                No inmate records found.
                                            </td>
                                        </tr>
                                    ) : (
                                        table.getRowModel().rows.map((row) => (
                                            <tr key={row.id} className="hover:bg-slate-50/70">
                                                {row.getVisibleCells().map((cell) => (
                                                    <td
                                                        key={cell.id}
                                                        className={`px-5 py-3 text-sm text-slate-700 ${
                                                            cell.column.id === "actions" ? "sticky right-0 z-10 bg-white" : ""
                                                        }`}
                                                    >
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <span>Rows per page:</span>
                                <select
                                    value={table.getState().pagination.pageSize}
                                    onChange={(event) => {
                                        table.setPageSize(Number(event.target.value));
                                    }}
                                    className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700"
                                >
                                    {[5, 8, 10].map((size) => (
                                        <option key={size} value={size}>
                                            {size}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-3">
                                <p className="text-sm text-slate-600">
                                    Page {table.getState().pagination.pageIndex + 1} of {Math.max(table.getPageCount(), 1)}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => table.previousPage()}
                                    disabled={!table.getCanPreviousPage()}
                                    className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    type="button"
                                    onClick={() => table.nextPage()}
                                    disabled={!table.getCanNextPage()}
                                    className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </AdminSidebarLayout>

        <AddInmateModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSubmit={(data) => {
                // TODO: persist to Supabase
                console.log("New inmate data:", data);
                setIsAddModalOpen(false);
            }}
        />
        </>
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
