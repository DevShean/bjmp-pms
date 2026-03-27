"use client";

import { useState, useMemo } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
  PaginationState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { UserPlus, Users, BarChart2, CheckCircle2, Edit, Trash2, Search, FilterX, ChevronDown } from "lucide-react";

export interface ProgramRecord {
  id: string;
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  enrolled: number;
  capacity: number;
  status: "Active" | "Completed" | "Upcoming" | "Inactive" | "Cancelled";
}

interface ProgramDataTableProps {
  data: ProgramRecord[];
  onEdit?: (program: ProgramRecord) => void;
  onDelete?: (program: ProgramRecord) => void;
  onAssign?: (program: ProgramRecord) => void;
  initialSearch?: string;
}

export default function ProgramDataTable({ data, onEdit, onDelete, onAssign, initialSearch = "" }: ProgramDataTableProps) {
  const columns = useMemo<ColumnDef<ProgramRecord>[]>(
    () => [
      {
        header: "PROGRAM NAME",
        accessorKey: "name",
        cell: ({ row }) => (
          <span className="font-medium text-slate-800 flex items-center gap-2">
            <BarChart2 size={16} className="text-teal-500" />
            {row.original.name}
          </span>
        ),
      },
      {
        header: "TYPE",
        accessorKey: "type",
        cell: ({ row }) => <span className="text-slate-700">{row.original.type}</span>,
      },
      {
        header: "START DATE",
        accessorKey: "startDate",
        cell: ({ row }) => <span className="text-slate-700">{row.original.startDate}</span>,
      },
      {
        header: "END DATE",
        accessorKey: "endDate",
        cell: ({ row }) => <span className="text-slate-700">{row.original.endDate}</span>,
      },
      {
        header: "ENROLLED/CAPACITY",
        id: "enrolledCapacity",
        cell: ({ row }) => (
          <span className="text-slate-700">
            <Users size={15} className="inline mr-1 text-teal-600" />
            {row.original.enrolled}/{row.original.capacity}
          </span>
        ),
      },
      {
        header: "STATUS",
        accessorKey: "status",
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
              row.original.status === "Active"
                ? "bg-green-100 text-green-800"
                : row.original.status === "Completed"
                ? "bg-teal-100 text-teal-800"
                : row.original.status === "Upcoming"
                ? "bg-amber-100 text-amber-800"
                : "bg-slate-200 text-slate-800"
            }`}
          >
            <CheckCircle2 size={13} />
            {row.original.status}
          </span>
        ),
      },
      {
        header: "ACTIONS",
        id: "actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="text-teal-700 hover:text-teal-900 transition p-1 hover:bg-teal-50 rounded-md cursor-pointer"
              title="Edit"
              onClick={() => onEdit?.(row.original)}
            >
              <Edit size={18} />
            </button>
            <button
              type="button"
              className="text-rose-600 hover:text-rose-700 transition p-1 hover:bg-rose-50 rounded-md cursor-pointer"
              title="Delete"
              onClick={() => onDelete?.(row.original)}
            >
              <Trash2 size={18} />
            </button>
            <button
              type="button"
              className="text-blue-700 hover:text-blue-900 transition p-1 hover:bg-blue-50 rounded-md cursor-pointer"
              title="Assign"
              onClick={() => onAssign?.(row.original)}
            >
              <UserPlus size={18} />
            </button>
          </div>
        ),
      },
    ],
    [onEdit, onDelete, onAssign]
  );

  const [globalFilter, setGlobalFilter] = useState(initialSearch);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Derive unique categories for filters
  const uniqueTypes = useMemo(() => Array.from(new Set(data.map((p) => p.type))).sort(), [data]);
  const uniqueStatuses = useMemo(() => Array.from(new Set(data.map((p) => p.status))).sort(), [data]);

  const initialPagination = useMemo<PaginationState>(() => ({ pageIndex: 0, pageSize: 10 }), []);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
      columnFilters,
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: initialPagination,
    },
  });

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-600">
        No program records found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Global Search */}
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={16} />
            </div>
            <input
              type="text"
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 sm:text-sm transition-all shadow-sm"
              placeholder="Search programs..."
            />
          </div>

          {/* Type Filter */}
          <div className="relative">
            <select
              value={(table.getColumn("type")?.getFilterValue() as string) ?? ""}
              onChange={(e) => table.getColumn("type")?.setFilterValue(e.target.value || undefined)}
              className="appearance-none block w-full pl-3 pr-10 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 sm:text-sm transition-all shadow-sm cursor-pointer"
            >
              <option value="">All Types</option>
              {uniqueTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <ChevronDown size={14} />
            </div>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={(table.getColumn("status")?.getFilterValue() as string) ?? ""}
              onChange={(e) => table.getColumn("status")?.setFilterValue(e.target.value || undefined)}
              className="appearance-none block w-full pl-3 pr-10 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm transition-all shadow-sm cursor-pointer"
            >
              <option value="">All Statuses</option>
              {uniqueStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <ChevronDown size={14} />
            </div>
          </div>

          {/* Clear Filters */}
          {(globalFilter || columnFilters.length > 0) && (
            <button
              onClick={() => {
                setGlobalFilter("");
                setColumnFilters([]);
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-100"
            >
              <FilterX size={14} />
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header, index) => {
                  const isActions = header.id === "actions";
                  const isProgramName = index === 0;
                  return (
                    <th
                      key={header.id}
                      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 ${
                        isActions
                          ? "sticky right-0 z-20 bg-slate-50 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)]"
                          : isProgramName
                          ? "sticky left-0 z-20 bg-slate-50 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.1)]"
                          : ""
                      }`}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-teal-50/50 transition-colors group">
                {row.getVisibleCells().map((cell, index) => {
                  const isActions = cell.column.id === "actions";
                  const isProgramName = index === 0;
                  const rowBg = row.index % 2 !== 0 ? "bg-slate-200" : "bg-white";
                  
                  return (
                    <td
                      key={cell.id}
                      className={`whitespace-nowrap px-4 py-3 text-sm transition-colors group-hover:bg-teal-50 ${rowBg} ${
                        isActions
                          ? "sticky right-0 z-10 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)]"
                          : isProgramName
                          ? "sticky left-0 z-10 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.1)]"
                          : ""
                      }`}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
        <div className="flex items-center gap-6 text-sm text-slate-600">
          <p>
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </p>
          <div className="flex items-center gap-2">
            <span className="font-medium">Rows per page:</span>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="border border-slate-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer"
            >
              {[5, 10, 30, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
);
}
