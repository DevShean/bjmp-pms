"use client";

import { Button } from "../../../components/ui/button";
import { 
  useReactTable, 
  getCoreRowModel, 
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender, 
  ColumnDef,
  type PaginationState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { useMemo, useState, useEffect, memo } from "react";
import { ArrowRightLeft, Search, FilterX, ChevronDown, LayoutGrid, Users } from "lucide-react";

import Image from "next/image";

export type InmateCellBlock = {
  id: string;
  name: string;
  currentBlock: string;
  gender: "Male" | "Female";
  imageUrl: string;
};

interface TransferReleaseDataTableProps {
  data: InmateCellBlock[];
  newBlocks: { [id: string]: string };
  setNewBlocks: (blocks: { [id: string]: string }) => void;
  onTransfer: (id: string, name: string, newBlock: string) => void;
  isLoading?: boolean;
}

const CellInput = memo(function CellInput({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const [localVal, setLocalVal] = useState(value);
  
  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  return (
    <input
      type="text"
      placeholder="e.g. B2"
      value={localVal}
      onChange={e => {
        const v = e.target.value.toUpperCase();
        setLocalVal(v);
        onChange(v);
      }}
      className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
    />
  );
});

export default function TransferReleaseDataTable({ 
  data, 
  newBlocks, 
  setNewBlocks, 
  onTransfer,
  isLoading = false 
}: TransferReleaseDataTableProps) {
  const columns = useMemo<ColumnDef<InmateCellBlock>[]>(
    () => [
      {
        header: "INMATE",
        accessorKey: "name",
        cell: ({ row }) => (
          <div className="flex items-center gap-3 w-full max-w-[250px]">
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2 ring-white shadow-sm bg-slate-100">
              <Image
                src={row.original.imageUrl}
                alt={row.original.name}
                fill
                className="object-cover"
                unoptimized={row.original.imageUrl.startsWith("data:")}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-900">{row.original.name}</span>
              <span className="text-xs text-slate-500">ID: {row.original.id}</span>
            </div>
          </div>
        ),
      },
      {
        header: "CURRENT BLOCK",
        accessorKey: "currentBlock",
        filterFn: "equals",
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200">
            <LayoutGrid size={12} className="text-slate-500" />
            {row.original.currentBlock}
          </span>
        ),
      },
      {
        header: "GENDER",
        accessorKey: "gender",
        filterFn: "equals",
        cell: ({ row }) => (
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
            row.original.gender === "Male" ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"
          }`}>
            <Users size={12} />
            {row.original.gender}
          </span>
        ),
      },
      {
        header: "NEW BLOCK DETAILS",
        id: "newBlock",
        cell: ({ row, table }) => {
          const meta = table.options.meta as {
            newBlocks: { [id: string]: string };
            setNewBlocks: (blocks: { [id: string]: string }) => void;
          };
          const currentVal = meta?.newBlocks[row.original.id] || "";
          
          return (
            <div className="w-full max-w-[180px]">
              <CellInput
                value={currentVal}
                onChange={val => meta?.setNewBlocks({ ...meta.newBlocks, [row.original.id]: val })}
              />
            </div>
          );
        },
      },
      {
        header: "ACTION",
        id: "action",
        cell: ({ row, table }) => {
          const meta = table.options.meta as {
            newBlocks: { [id: string]: string };
            setNewBlocks: (blocks: { [id: string]: string }) => void;
          };
          const isReady = meta?.newBlocks[row.original.id] && meta?.newBlocks[row.original.id] !== row.original.currentBlock;
          return (
            <Button
              variant={isReady ? "default" : "outline"}
              size="sm"
              disabled={!isReady}
              onClick={() => onTransfer(row.original.id, row.original.name, meta?.newBlocks[row.original.id])}
              className={isReady ? 'cursor-pointer bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-500/20 transition-all font-medium border-0' : 'text-slate-500 border-slate-200'}
            >
              <ArrowRightLeft className="mr-2 h-4 w-4" /> Transfer
            </Button>
          );
        },
      },
    ],
    [onTransfer]
  );

  const [pagination, setPagination] = useState<PaginationState>({ 
    pageIndex: 0, 
    pageSize: 5 
  });
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Derive unique blocks for filter
  const uniqueBlocks = useMemo(() => {
    const blocks = Array.from(new Set(data.map((i) => i.currentBlock)));
    return blocks.sort();
  }, [data]);

  const uniqueGenders = useMemo(() => {
    const genders = Array.from(new Set(data.map((i) => i.gender)));
    return genders.sort();
  }, [data]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      pagination,
      globalFilter,
      columnFilters,
    },
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    meta: {
      newBlocks,
      setNewBlocks,
    },
  });

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
              placeholder="Search inmates..."
            />
          </div>

          {/* Block Filter */}
          <div className="relative">
            <select
              value={(table.getColumn("currentBlock")?.getFilterValue() as string) ?? ""}
              onChange={(e) => table.getColumn("currentBlock")?.setFilterValue(e.target.value || undefined)}
              className="appearance-none block w-full pl-3 pr-10 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 sm:text-sm transition-all shadow-sm cursor-pointer"
            >
              <option value="">All Blocks</option>
              {uniqueBlocks.map((block) => (
                <option key={block} value={block}>
                  {block}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <ChevronDown size={14} />
            </div>
          </div>

          {/* Gender Filter */}
          <div className="relative">
            <select
              value={(table.getColumn("gender")?.getFilterValue() as string) ?? ""}
              onChange={(e) => table.getColumn("gender")?.setFilterValue(e.target.value || undefined)}
              className="appearance-none block w-full pl-3 pr-10 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm transition-all shadow-sm cursor-pointer"
            >
              <option value="">All Genders</option>
              {uniqueGenders.map((gender) => (
                <option key={gender} value={gender}>
                  {gender}
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
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-100 cursor-pointer"
            >
              <FilterX size={14} />
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-left">
            <thead className="bg-slate-50">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} className="border-b border-slate-200">
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="whitespace-nowrap px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-sm text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
                      <span>Loading inmate records...</span>
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-sm text-slate-500 font-medium">
                    No inmate records found.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="group transition-colors duration-200 hover:bg-teal-50/50">
                    {row.getVisibleCells().map(cell => {
                      const rowBg = row.index % 2 !== 0 ? 'bg-slate-200' : 'bg-white';
                      return (
                        <td key={cell.id} className={`whitespace-nowrap px-6 py-4 align-middle ${rowBg} transition-colors group-hover:bg-teal-50`}>
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

        {/* Pagination Controls */}
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 bg-white">
          <div className="flex items-center gap-6 text-sm text-slate-600">
            <p>
              Page {table.getState().pagination.pageIndex + 1} of {Math.max(table.getPageCount(), 1)}
            </p>
            <div className="flex items-center gap-2">
              <span className="font-medium">Rows per page:</span>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                className="border border-slate-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer"
              >
                {[5, 10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="cursor-pointer rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors hover:bg-slate-50"
            >
              Previous
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="cursor-pointer rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
