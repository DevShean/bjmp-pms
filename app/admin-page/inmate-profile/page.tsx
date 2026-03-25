"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    useReactTable,
    type ColumnDef,
    type PaginationState,
} from "@tanstack/react-table";
import { Eye, Edit, Trash2, UserPlus, Stethoscope } from "lucide-react";
import IconButton from "@/components/ui/IconButton";
import AdminSidebarLayout from "../components/AdminSidebarLayout";
import AddInmateModal from "../components/AddInmateModal";
import ViewInmateModal from "../components/ViewInmateModal";
import EditInmateModal from "../components/EditInmateModal";
import DeleteInmateModal from "../components/DeleteInmateModal";
import AssignMedicalStaffModal from "../components/AssignMedicalStaffModal";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

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

export default function InmateProfilePage() {
    const [searchField, setSearchField] = useState<"name" | "status" | "gender">("name");
    const [searchTerm, setSearchTerm] = useState("");
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 5 });
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAssignMedicalModalOpen, setIsAssignMedicalModalOpen] = useState(false);
    const [inmates, setInmates] = useState<InmateRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedInmateId, setSelectedInmateId] = useState<string | null>(null);
    const [selectedInmateName, setSelectedInmateName] = useState<string | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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
                id: `INM-${String(item.inmate_id).padStart(3, "0")}`,
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

    const handleInmateDeleted = useCallback(() => {
        fetchInmates();
    }, [fetchInmates]);

    useEffect(() => {
        fetchInmates();
    }, [fetchInmates]);


    const filteredRows = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();
        if (!keyword) {
            return inmates;
        }

        return inmates.filter((row) => {
            if (searchField === "name") {
                return `${row.firstName} ${row.lastName}`.toLowerCase().includes(keyword);
            }

            if (searchField === "status") {
                return row.status.toLowerCase().includes(keyword);
            }

            return row.gender.toLowerCase().includes(keyword);
        });
    }, [searchField, searchTerm, inmates]);

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
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <button 
                            type="button" 
                            className="text-teal-700 hover:text-teal-900 transition p-1 hover:bg-teal-50 rounded-md cursor-pointer" 
                            title="View"
                            onClick={() => {
                                setSelectedInmateId(row.original.id);
                                setIsViewModalOpen(true);
                            }}
                        >
                            <Eye size={18} />
                        </button>
                        <button 
                            type="button" 
                            className="text-blue-700 hover:text-blue-900 transition p-1 hover:bg-blue-50 rounded-md cursor-pointer" 
                            title="Edit"
                            onClick={() => {
                                setSelectedInmateId(row.original.id);
                                setIsEditModalOpen(true);
                            }}
                        >
                            <Edit size={18} />
                        </button>
                        <button 
                            type="button" 
                            className="text-rose-600 hover:text-rose-700 transition p-1 hover:bg-rose-50 rounded-md cursor-pointer" 
                            title="Delete"
                            onClick={() => {
                                setSelectedInmateId(row.original.id);
                                setSelectedInmateName(`${row.original.firstName} ${row.original.lastName}`);
                                setIsDeleteModalOpen(true);
                            }}
                        >
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
                        <IconButton
                            onClick={() => setIsAddModalOpen(true)}
                            icon={<UserPlus size={18} className="-ml-1" />} 
                            colorClass="bg-teal-700 hover:bg-teal-800 text-white"
                        >
                            Add New Inmate
                        </IconButton>
                        <IconButton
                            onClick={() => setIsAssignMedicalModalOpen(true)}
                            icon={<Stethoscope size={18} className="-ml-1" />} 
                            colorClass="bg-blue-700 hover:bg-blue-800 text-white"
                        >
                            Assign Medical Staff
                        </IconButton>
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
                                className="cursor-pointer rounded-lg bg-teal-700 px-6 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
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
                                className="cursor-pointer rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300"
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
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={columns.length} className="px-5 py-12 text-center text-sm text-slate-500">
                                                Loading inmate records...
                                            </td>
                                        </tr>
                                    ) : table.getRowModel().rows.length === 0 ? (
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
                                    className="cursor-pointer rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700"
                                >
                                    {[5, 8, 10].map((size) => (
                                        <option className="cursor-pointer" key={size} value={size}>
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
        </AdminSidebarLayout>

        <AddInmateModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSubmit={() => {
                fetchInmates();
                setIsAddModalOpen(false);
            }}
        />
        <ViewInmateModal
            isOpen={isViewModalOpen}
            onClose={() => {
                setIsViewModalOpen(false);
                setSelectedInmateId(null);
            }}
            inmateId={selectedInmateId}
        />
        <EditInmateModal
            isOpen={isEditModalOpen}
            onClose={() => {
                setIsEditModalOpen(false);
                setSelectedInmateId(null);
            }}
            onSubmit={() => {
                fetchInmates();
            }}
            inmateId={selectedInmateId}
        />
        <DeleteInmateModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
                setIsDeleteModalOpen(false);
                setSelectedInmateId(null);
                setSelectedInmateName(null);
            }}
            onSubmit={handleInmateDeleted}
            inmateId={selectedInmateId}
            inmateName={selectedInmateName}
        />
        <AssignMedicalStaffModal
            isOpen={isAssignMedicalModalOpen}
            onClose={() => setIsAssignMedicalModalOpen(false)}
            onSubmit={(data) => {
                // TODO: handle assignment
                console.log("Assigned medical staff:", data);
                setIsAssignMedicalModalOpen(false);
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
