"use client";

import { useMemo } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  PaginationState,
} from "@tanstack/react-table";
import { Eye, Users, BarChart2, CheckCircle2, Edit, Trash2 } from "lucide-react";

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
  onView?: (program: ProgramRecord) => void;
  onEdit?: (program: ProgramRecord) => void;
  onDelete?: (program: ProgramRecord) => void;
}

export default function ProgramDataTable({ data, onView, onEdit, onDelete }: ProgramDataTableProps) {
  const columns = useMemo<ColumnDef<ProgramRecord>[]>(
    () => [
      {
        header: "PROGRAM NAME",
        accessorKey: "name",
        cell: ({ row }) => (
          <span className="font-medium text-slate-800 flex items-center gap-2">
            <BarChart2 size={16} className="text-blue-500" />
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
                ? "bg-blue-100 text-blue-800"
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
              title="View"
              onClick={() => onView?.(row.original)}
            >
              <Eye size={18} />
            </button>
            <button
              type="button"
              className="text-blue-700 hover:text-blue-900 transition p-1 hover:bg-blue-50 rounded-md cursor-pointer"
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
          </div>
        ),
      },
    ],
    [onView, onEdit, onDelete]
  );

  const initialPagination = useMemo<PaginationState>(() => ({ pageIndex: 0, pageSize: 10 }), []);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    initialState: { pagination: initialPagination },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-600">
        No program records found.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const isActions = header.id === "actions";
                  return (
                    <th
                      key={header.id}
                      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 ${
                        isActions ? "sticky right-0 z-10 bg-slate-50 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)]" : ""
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
          <tbody className="divide-y divide-slate-100 bg-white">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50 group">
                {row.getVisibleCells().map((cell) => {
                  const isActions = cell.column.id === "actions";
                  return (
                    <td 
                      key={cell.id} 
                      className={`whitespace-nowrap px-4 py-3 text-sm ${
                        isActions ? "sticky right-0 z-10 bg-white group-hover:bg-slate-50 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)]" : ""
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
        <p className="text-sm text-slate-600">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </p>
        {/* Pagination controls can be added here */}
      </div>
    </div>
  );
}
