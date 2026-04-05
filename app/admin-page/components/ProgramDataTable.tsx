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
import { UserPlus, Users, BarChart2, CheckCircle2, Edit, Trash2, Search, FilterX, ChevronDown, Tag, Calendar, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-slate-700">
            <Tag size={14} className="text-slate-400 shrink-0" />
            <span>{row.original.type}</span>
          </div>
        ),
      },
      {
        header: "START DATE",
        accessorKey: "startDate",
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar size={14} className="text-slate-400 shrink-0" />
            <span>{row.original.startDate}</span>
          </div>
        ),
      },
      {
        header: "END DATE",
        accessorKey: "endDate",
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar size={14} className="text-slate-400 shrink-0" />
            <span>{row.original.endDate}</span>
          </div>
        ),
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
  const [typeFilterOpen, setTypeFilterOpen] = useState(false);
  const [statusFilterOpen, setStatusFilterOpen] = useState(false);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);

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
          <Popover open={typeFilterOpen} onOpenChange={setTypeFilterOpen}>
            <PopoverTrigger className="flex min-w-36 items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer">
              <span className={(table.getColumn("type")?.getFilterValue() as string) ? "text-slate-700" : "text-slate-400"}>
                {(table.getColumn("type")?.getFilterValue() as string) || "All Types"}
              </span>
              <ChevronDown size={14} className={`shrink-0 text-slate-400 transition-transform ${typeFilterOpen ? "rotate-180" : ""}`} />
            </PopoverTrigger>
            <PopoverContent align="start" sideOffset={6} className="w-48 p-1">
              <button type="button" onClick={() => { table.getColumn("type")?.setFilterValue(undefined); setTypeFilterOpen(false); }} className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100">
                <span className="flex-1 text-left">All Types</span>
                {!(table.getColumn("type")?.getFilterValue() as string) && <Check className="h-3.5 w-3.5 text-teal-600" />}
              </button>
              {uniqueTypes.map((type) => (
                <button key={type} type="button" onClick={() => { table.getColumn("type")?.setFilterValue(type); setTypeFilterOpen(false); }} className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100">
                  <span className="flex-1 text-left">{type}</span>
                  {(table.getColumn("type")?.getFilterValue() as string) === type && <Check className="h-3.5 w-3.5 text-teal-600" />}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          {/* Status Filter */}
          <Popover open={statusFilterOpen} onOpenChange={setStatusFilterOpen}>
            <PopoverTrigger className="flex min-w-36 items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer">
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
            <Popover open={pageSizeOpen} onOpenChange={setPageSizeOpen}>
              <PopoverTrigger className="flex min-w-14 items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm cursor-pointer transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20">
                <span className="text-slate-700">{table.getState().pagination.pageSize}</span>
                <ChevronDown size={14} className={`shrink-0 text-slate-400 transition-transform ${pageSizeOpen ? "rotate-180" : ""}`} />
              </PopoverTrigger>
              <PopoverContent align="start" sideOffset={6} className="w-20 p-1">
                {[5, 10, 30, 50].map((pageSize) => (
                  <button key={pageSize} type="button" onClick={() => { table.setPageSize(pageSize); setPageSizeOpen(false); }} className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100">
                    <span className="flex-1 text-left">{pageSize}</span>
                    {table.getState().pagination.pageSize === pageSize && <Check className="h-3.5 w-3.5 text-teal-600" />}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
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
