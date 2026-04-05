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
import { 
  Search, 
  FilterX, 
  ChevronDown, 
  Edit, 
  Calendar, 
  User, 
  Layers, 
  CheckCircle2,
  Clock,
  XCircle,
  Check
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface ProgramRecord {
  id: string;
  inmateName: string;
  program: string;
  startDate: string;
  endDate: string;
  status: "Ongoing" | "Completed" | "Dropped";
  staff: string;
}

interface ProgramTableProps {
  data: ProgramRecord[];
  onEdit?: (record: ProgramRecord) => void;
}

const STATUS_THEME: Record<ProgramRecord["status"], { color: string; bg: string; icon: React.ReactNode }> = {
  Ongoing: { 
    color: "text-yellow-800", 
    bg: "bg-yellow-100", 
    icon: <Clock size={13} /> 
  },
  Completed: { 
    color: "text-green-800", 
    bg: "bg-green-100", 
    icon: <CheckCircle2 size={13} /> 
  },
  Dropped: { 
    color: "text-rose-800", 
    bg: "bg-rose-100", 
    icon: <XCircle size={13} /> 
  },
};

export default function ProgramTable({ data, onEdit }: ProgramTableProps) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 5 });
  const [statusFilterOpen, setStatusFilterOpen] = useState(false);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);

  const columns = useMemo<ColumnDef<ProgramRecord>[]>(
    () => [
      {
        header: "INMATE NAME",
        accessorKey: "inmateName",
        cell: ({ row }) => (
          <span className="font-medium text-slate-800 flex items-center gap-2">
            <User size={16} className="text-teal-600" />
            {row.original.inmateName}
          </span>
        ),
      },
      {
        header: "PROGRAM",
        accessorKey: "program",
        cell: ({ row }) => (
          <span className="text-slate-700 flex items-center gap-2">
            <Layers size={16} className="text-slate-400" />
            {row.original.program}
          </span>
        ),
      },
      {
        header: "START DATE",
        accessorKey: "startDate",
        cell: ({ row }) => (
          <span className="text-slate-600 flex items-center gap-2">
            <Calendar size={16} className="text-slate-400" />
            {row.original.startDate}
          </span>
        ),
      },
      {
        header: "END DATE",
        accessorKey: "endDate",
        cell: ({ row }) => (
          <span className="text-slate-600 flex items-center gap-2">
            <Calendar size={16} className="text-slate-400" />
            {row.original.endDate}
          </span>
        ),
      },
      {
        header: "PROGRESS",
        accessorKey: "status",
        cell: ({ row }) => {
          const status = row.original.status;
          const theme = STATUS_THEME[status];
          return (
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${theme.bg} ${theme.color}`}>
              {theme.icon}
              {status}
            </span>
          );
        },
      },
      {
        header: "STAFF",
        accessorKey: "staff",
        cell: ({ row }) => (
          <span className="text-slate-700 flex items-center gap-2">
            <User size={16} className="text-slate-400" />
            {row.original.staff}
          </span>
        ),
      },
      {
        header: "ACTION",
        id: "actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="text-blue-700 hover:text-blue-900 transition p-1 hover:bg-blue-50 rounded-md cursor-pointer"
              title="Edit"
              onClick={() => onEdit?.(row.original)}
            >
              <Edit size={18} />
            </button>
          </div>
        ),
      },
    ],
    [onEdit]
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
      columnFilters,
      pagination,
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const uniqueStatuses = useMemo(() => Array.from(new Set(data.map((p) => p.status))).sort(), [data]);

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
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
              className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 sm:text-sm transition-all"
              placeholder="Search progress..."
            />
          </div>

          {/* Status Filter */}
          <Popover open={statusFilterOpen} onOpenChange={setStatusFilterOpen}>
            <PopoverTrigger className="flex min-w-36 items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer">
              <span className={(table.getColumn("status")?.getFilterValue() as string) ? "text-slate-700" : "text-slate-400"}>
                {(table.getColumn("status")?.getFilterValue() as string) || "All Statuses"}
              </span>
              <ChevronDown size={14} className={`shrink-0 text-slate-400 transition-transform ${statusFilterOpen ? "rotate-180" : ""}`} />
            </PopoverTrigger>
            <PopoverContent align="start" sideOffset={6} className="w-48 p-1">
              <button type="button" onClick={() => { table.getColumn("status")?.setFilterValue(undefined); setStatusFilterOpen(false); }} className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100">
                <span className="flex-1 text-left">All Statuses</span>
                {!(table.getColumn("status")?.getFilterValue() as string) && <Check className="h-3.5 w-3.5 text-teal-600" />}
              </button>
              {uniqueStatuses.map((status) => (
                <button key={status} type="button" onClick={() => { table.getColumn("status")?.setFilterValue(status); setStatusFilterOpen(false); }} className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100">
                  <span className="flex-1 text-left">{status}</span>
                  {(table.getColumn("status")?.getFilterValue() as string) === status && <Check className="h-3.5 w-3.5 text-teal-600" />}
                </button>
              ))}
            </PopoverContent>
          </Popover>

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

      {/* Table Container */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const isInmate = header.column.id === "inmateName";
                    const isActions = header.column.id === "actions";
                    return (
                      <th
                        key={header.id}
                        className={`px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 ${
                          isInmate ? "sticky left-0 z-20 bg-slate-50 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.1)]" : ""
                        } ${
                          isActions ? "sticky right-0 z-20 bg-slate-50 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)]" : ""
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
            <tbody className="divide-y divide-slate-100">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-5 py-12 text-center text-sm text-slate-500">
                    No progress records found.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-teal-50/50 transition-colors group">
                    {row.getVisibleCells().map((cell) => {
                      const isInmate = cell.column.id === "inmateName";
                      const isActions = cell.column.id === "actions";
                      const rowBg = row.index % 2 !== 0 ? "bg-slate-200" : "bg-white";
                      
                      return (
                        <td
                          key={cell.id}
                          className={`whitespace-nowrap px-5 py-3.5 text-sm text-slate-700 transition-colors ${
                            isInmate ? `sticky left-0 z-10 ${rowBg} shadow-[4px_0_10px_-4px_rgba(0,0,0,0.1)] group-hover:bg-teal-50` : ""
                          } ${
                            isActions ? `sticky right-0 z-10 ${rowBg} shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)] group-hover:bg-teal-50` : ""
                          } ${!isInmate && !isActions ? `${rowBg} group-hover:bg-teal-50/50` : ""}`}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Control */}
        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50/30">
          <div className="flex items-center gap-6 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-500">Rows per page:</span>
              <Popover open={pageSizeOpen} onOpenChange={setPageSizeOpen}>
                <PopoverTrigger className="flex min-w-14 items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm cursor-pointer transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20">
                  <span className="text-slate-700">{table.getState().pagination.pageSize}</span>
                  <ChevronDown size={14} className={`shrink-0 text-slate-400 transition-transform ${pageSizeOpen ? "rotate-180" : ""}`} />
                </PopoverTrigger>
                <PopoverContent align="start" sideOffset={6} className="w-20 p-1">
                  {[5, 10, 20, 50].map((size) => (
                    <button key={size} type="button" onClick={() => { table.setPageSize(size); setPageSizeOpen(false); }} className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100">
                      <span className="flex-1 text-left">{size}</span>
                      {table.getState().pagination.pageSize === size && <Check className="h-3.5 w-3.5 text-teal-600" />}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
            </div>
            <p className="font-medium">
              Page {table.getState().pagination.pageIndex + 1} of {Math.max(table.getPageCount(), 1)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
