"use client";

import { useState, useMemo } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
} from "@tanstack/react-table";
import { Search, User, ShieldCheck, Calendar, StickyNote, Eye } from "lucide-react";

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
          <div className="flex items-center gap-2 text-slate-500 max-w-[150px] truncate">
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
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
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
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg bg-white text-sm text-slate-700 outline-none ring-teal-500 focus:ring-2 focus:border-teal-500 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-5 py-3 text-left text-sm font-semibold text-slate-700"
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
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-teal-50 transition-colors group">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-5 py-3 text-sm text-slate-700">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between bg-white">
        <div className="text-sm text-slate-600">
          Showing {table.getRowModel().rows.length} logs
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="cursor-pointer rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-50 transition-colors"
          >
            Previous
          </button>
          <button
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
