"use client";

import { Button } from "../../../components/ui/button";
import { useReactTable, getCoreRowModel, flexRender, ColumnDef } from "@tanstack/react-table";
import { useMemo, useState, useEffect, memo } from "react";
import { ArrowRightLeft } from "lucide-react";

export type InmateCellBlock = {
  id: string;
  name: string;
  currentBlock: string;
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
      className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
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
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-sm font-bold uppercase ring-2 ring-white">
              {row.original.name.charAt(0)}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-900">{row.original.name}</span>
              <span className="text-xs text-slate-500">ID: #{row.original.id.padStart(4, '0')}</span>
            </div>
          </div>
        ),
      },
      {
        header: "CURRENT BLOCK",
        accessorKey: "currentBlock",
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200">
            {row.original.currentBlock}
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
              className={isReady ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/20 transition-all font-medium border-0' : 'text-slate-500 border-slate-200'}
            >
              <ArrowRightLeft className="mr-2 h-4 w-4" /> Transfer
            </Button>
          );
        },
      },
    ],
    [onTransfer]
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      newBlocks,
      setNewBlocks,
    },
  });

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[800px] border-collapse text-left">
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id} className="border-b border-slate-200 bg-slate-50/50">
              {headerGroup.headers.map(header => (
                <th key={header.id} className="whitespace-nowrap px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-sm text-slate-500">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
                  <span>Loading inmate records...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-sm text-slate-500 font-medium">
                No inmate records found.
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map(row => (
              <tr key={row.id} className="group transition-colors duration-200 hover:bg-slate-50/80">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="whitespace-nowrap px-6 py-4 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
