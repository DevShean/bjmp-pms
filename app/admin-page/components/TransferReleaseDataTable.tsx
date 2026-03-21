"use client";

import { Button } from "../../../components/ui/button";
import { useReactTable, getCoreRowModel, flexRender, ColumnDef } from "@tanstack/react-table";
import { useMemo} from "react";

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
}

export default function TransferReleaseDataTable({ data, newBlocks, setNewBlocks, onTransfer }: TransferReleaseDataTableProps) {
  const columns = useMemo<ColumnDef<InmateCellBlock>[]>(
    () => [
      {
        header: "INMATE NAME",
        accessorKey: "name",
        cell: ({ row }) => <span className="text-slate-800 font-medium">{row.original.name}</span>,
      },
      {
        header: "CURRENT CELL BLOCK",
        accessorKey: "currentBlock",
        cell: ({ row }) => <span className="text-slate-700">{row.original.currentBlock}</span>,
      },
      {
        header: "NEW CELL BLOCK",
        id: "newBlock",
        cell: ({ row }) => (
          <input
            type="text"
            placeholder="Enter new block"
            value={newBlocks[row.original.id] || ""}
            onChange={e => setNewBlocks({ ...newBlocks, [row.original.id]: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none ring-teal-500 placeholder:text-slate-400 focus:ring-2"
          />
        ),
      },
      {
        header: "ACTION",
        id: "action",
        cell: ({ row }) => (
          <Button
            variant="default"
            size="sm"
            disabled={!newBlocks[row.original.id] || newBlocks[row.original.id] === row.original.currentBlock}
            onClick={() => onTransfer(row.original.id, row.original.name, newBlocks[row.original.id])}
          >Transfer</Button>
        ),
      },
    ],
    [newBlocks, setNewBlocks, onTransfer]
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="bg-slate-50">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th key={header.id} className="px-5 py-3 text-left text-sm font-semibold text-slate-700">
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {table.getRowModel().rows.map(row => (
            <tr key={row.id} className="hover:bg-slate-50/70">
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="px-5 py-3 text-sm">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
