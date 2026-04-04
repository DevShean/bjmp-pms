"use client";

import { useState, useMemo } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
  type ColumnFiltersState,
  type PaginationState,
} from "@tanstack/react-table";
import { Search, User, ShieldCheck, Calendar, StickyNote, Eye, ChevronDown, FilterX } from "lucide-react";

export interface BehaviorLogRecord {
  id: string;
  inmateName: string;
  staffName: string;
  logDate: string;
  rating: "Excellent" | "Good" | "Fair" | "Poor";
  notes: string;
  inmatePhoto?: string;
}

const RATING_THEME: Record<BehaviorLogRecord["rating"], { bg: string; text: string }> = {
  Excellent: { bg: "bg-teal-50", text: "text-teal-700" },
  Good: { bg: "bg-blue-50", text: "text-blue-700" },
  Fair: { bg: "bg-orange-50", text: "text-orange-700" },
  Poor: { bg: "bg-rose-50", text: "text-rose-700" },
};

export default function BehaviorLogsTable({ 
  data, 
  isLoading, 
  onView 
}: { 
  data: BehaviorLogRecord[], 
  isLoading?: boolean,
  onView?: (log: BehaviorLogRecord) => void
}) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 5 });

  const uniqueRatings = useMemo(() => Array.from(new Set(data.map((i) => i.rating))).sort(), [data]);

  const columns = useMemo<ColumnDef<BehaviorLogRecord>[]>(
    () => [
      {
        header: "LOG ID",
        accessorKey: "id",
        cell: ({ row }) => <span className="font-mono text-slate-500 font-bold text-xs">#{row.original.id}</span>,
      },
      {
        header: "INMATE NAME",
        accessorKey: "inmateName",
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
               <User size={16} />
            </div>
            <span className="font-medium text-slate-800">{row.original.inmateName}</span>
          </div>
        ),
      },
      {
        header: "STAFF NAME",
        accessorKey: "staffName",
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-slate-600">
            <ShieldCheck size={16} className="text-slate-400" />
            <span>{row.original.staffName}</span>
          </div>
        ),
      },
      {
        header: "LOG DATE",
        accessorKey: "logDate",
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar size={16} className="text-slate-400" />
            <span>{row.original.logDate}</span>
          </div>
        ),
      },
      {
        header: "RATING",
        accessorKey: "rating",
        filterFn: 'equals',
        cell: ({ row }) => {
          const theme = RATING_THEME[row.original.rating];
          return (
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${theme.bg} ${theme.text}`}>
              {row.original.rating}
            </span>
          );
        },
      },
      {
        header: "NOTES",
        accessorKey: "notes",
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-slate-500 max-w-37.5 truncate">
            {row.original.notes ? (
              <>
                <StickyNote size={14} className="shrink-0" />
                <span className="truncate">{row.original.notes}</span>
              </>
            ) : (
              <span className="text-slate-300">No notes</span>
            )}
          </div>
        ),
      },
      {
        header: "ACTIONS",
        id: "actions",
        cell: ({ row }) => (
          <button 
            type="button"
            onClick={() => onView?.(row.original)}
            className="text-teal-700 hover:text-teal-900 transition p-1 hover:bg-teal-50 rounded-md cursor-pointer"
            title="View Details"
          >
            <Eye size={18} />
          </button>
        ),
      },
    ],
    [onView]
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

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
        {/* Search Input aligned with inmate profile style */}
        <div className="relative flex-1 sm:max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={16} />
          </div>
          <input
            type="text"
            placeholder="Search logs..."
            value={globalFilter}
            onChange={(e) => {
              setGlobalFilter(e.target.value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
            className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg bg-white text-sm text-slate-700 outline-none ring-teal-500 focus:ring-2 focus:border-teal-500 transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="relative sm:w-48">
          <select
            value={(table.getColumn("rating")?.getFilterValue() as string) ?? ""}
            onChange={(event) => {
              table.getColumn("rating")?.setFilterValue(event.target.value || undefined);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
            className="appearance-none block w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg bg-white text-sm text-slate-700 outline-none ring-teal-500 focus:ring-2 focus:border-teal-500 transition-all cursor-pointer"
          >
            <option value="">All Ratings</option>
            {uniqueRatings.map((rating) => (
              <option key={rating} value={rating}>
                {rating}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
            <ChevronDown size={14} />
          </div>
        </div>

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
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent"></div>
                    <span>Loading logs...</span>
                  </div>
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-12 text-center text-sm text-slate-500">
                  No behavior logs found.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, i) => {
                const isEven = i % 2 !== 0;
                const rowBg = isEven ? "bg-slate-200" : "bg-white";

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
      
      <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between bg-white">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span>Rows per page:</span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(event) => {
              table.setPageSize(Number(event.target.value));
            }}
            className="cursor-pointer rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-teal-500"
          >
            {[5, 10, 20, 50].map((size) => (
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
            className="cursor-pointer rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-50 transition-colors"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="cursor-pointer rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-50 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
