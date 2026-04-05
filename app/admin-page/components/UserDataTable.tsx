"use client";

import { useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  PaginationState,
} from "@tanstack/react-table";
import { User, Edit, Trash2, Mail, ShieldCheck, ChevronDown, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface UserRecord {
  id: string;
  username: string;
  email: string;
  role: string;
  role_id: number;
}

interface UserDataTableProps {
  data: UserRecord[];
  onEdit?: (user: UserRecord) => void;
  onDelete?: (user: UserRecord) => void;
}

export default function UserDataTable({ data, onEdit, onDelete }: UserDataTableProps) {
  const columns = useMemo<ColumnDef<UserRecord>[]>(
    () => [
      {
        header: "USERNAME",
        accessorKey: "username",
        cell: ({ row }) => (
          <span className="font-medium text-slate-800 flex items-center gap-2">
            <div className="bg-slate-100 p-1.5 rounded-full text-slate-500">
              <User size={16} />
            </div>
            {row.original.username}
          </span>
        ),
      },
      {
        header: "EMAIL",
        accessorKey: "email",
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-slate-600">
            <Mail size={15} className="text-slate-400 shrink-0" />
            <span>{row.original.email}</span>
          </div>
        ),
      },
      {
        header: "ROLE",
        accessorKey: "role",
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-slate-700">
            <ShieldCheck size={15} className="text-slate-400 shrink-0" />
            <span className="font-medium">{row.original.role}</span>
          </div>
        ),
      },
      {
        header: "ACTIONS",
        id: "actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="cursor-pointer text-teal-700 hover:text-teal-900 transition"
              title="Edit"
              aria-label={`Edit ${row.original.id}`}
              onClick={() => onEdit?.(row.original)}
            >
              <Edit size={18} />
            </button>
            <button
              type="button"
              className="cursor-pointer text-rose-600 hover:text-rose-700 transition"
              title="Delete"
              aria-label={`Delete ${row.original.id}`}
              onClick={() => onDelete?.(row.original)}
            >
              <Trash2 size={18} />
            </button>
          </div>
        ),
      },
    ],
    [onDelete, onEdit]
  );

  const initialPagination = useMemo<PaginationState>(() => ({ pageIndex: 0, pageSize: 10 }), []);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);

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
        No user records found.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-100">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-teal-50/50 transition-colors group">
                {row.getVisibleCells().map((cell) => {
                  const rowBg = row.index % 2 !== 0 ? 'bg-slate-200' : 'bg-white';
                  return (
                    <td key={cell.id} className={`whitespace-nowrap px-4 py-3 text-sm ${rowBg} transition-colors group-hover:bg-teal-600/8`}>
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
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <p>
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </p>
          <div className="flex items-center gap-2">
            <span>Show</span>
            <Popover open={pageSizeOpen} onOpenChange={setPageSizeOpen}>
              <PopoverTrigger className="flex min-w-14 items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm cursor-pointer transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20">
                <span className="text-slate-700">{table.getState().pagination.pageSize}</span>
                <ChevronDown size={14} className={`shrink-0 text-slate-400 transition-transform ${pageSizeOpen ? "rotate-180" : ""}`} />
              </PopoverTrigger>
              <PopoverContent align="start" sideOffset={6} className="w-20 p-1">
                {[5, 10, 30].map((size) => (
                  <button key={size} type="button" onClick={() => { table.setPageSize(size); setPageSizeOpen(false); }} className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100">
                    <span className="flex-1 text-left">{size}</span>
                    {table.getState().pagination.pageSize === size && <Check className="h-3.5 w-3.5 text-teal-600" />}
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
  );
}
