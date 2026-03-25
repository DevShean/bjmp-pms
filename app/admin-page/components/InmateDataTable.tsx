'use client';

import { useMemo } from 'react';
import {
	ColumnDef,
	PaginationState,
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	useReactTable,
} from '@tanstack/react-table';
import { Eye, Pencil } from 'lucide-react';

interface InmateRecord {
	id: string;
	photoPath?: string;
	firstName: string;
	lastName: string;
	gender: string;
	birthDate: string;
	crime: string;
	sentenceYears: number;
	cellBlock: string;
	admissionDate: string;
	releaseDate?: string;
	status: 'Active' | 'Released' | 'Transferred' | 'Deceased';
	maritalStatus: string;
	religion: string;
	height: string;
	weight: string;
	bloodType: string;
	emergencyContact: string;
	emergencyPhone: string;
	caseNumber: string;
	caseStatus: string;
}

interface InmateDataTableProps {
	data: InmateRecord[];
}

export default function InmateDataTable({ data }: InmateDataTableProps) {
	const columns = useMemo<ColumnDef<InmateRecord>[]>(
		() => [
			{
				header: 'ID',
				accessorKey: 'id',
				cell: ({ row }) => <span className="font-medium text-slate-800">{row.original.id}</span>,
			},
			{
				header: 'Name',
				id: 'name',
				cell: ({ row }) => (
					<span className="text-slate-700">
						{row.original.lastName}, {row.original.firstName}
					</span>
				),
			},
			{
				header: 'Gender',
				accessorKey: 'gender',
				cell: ({ row }) => <span className="text-slate-700">{row.original.gender}</span>,
			},
			{
				header: 'Crime',
				accessorKey: 'crime',
				cell: ({ row }) => <span className="text-slate-700">{row.original.crime}</span>,
			},
			{
				header: 'Cell Block',
				accessorKey: 'cellBlock',
				cell: ({ row }) => <span className="text-slate-700">{row.original.cellBlock}</span>,
			},
			{
				header: 'Admission',
				accessorKey: 'admissionDate',
				cell: ({ row }) => <span className="text-slate-700">{row.original.admissionDate}</span>,
			},
			{
				header: 'Status',
				accessorKey: 'status',
				cell: ({ row }) => (
					<span
						className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
							row.original.status === 'Active'
								? 'bg-green-100 text-green-800'
								: row.original.status === 'Released'
								? 'bg-teal-100 text-teal-800'
								: row.original.status === 'Transferred'
								? 'bg-amber-100 text-amber-800'
								: 'bg-slate-200 text-slate-800'
						}`}
					>
						{row.original.status}
					</span>
				),
			},
			{
				header: 'Action',
				id: 'action',
				cell: ({ row }) => (
					<div className="flex items-center gap-2">
						<button
							type="button"
							className="inline-flex items-center justify-center rounded-md border border-slate-200 p-1.5 text-slate-700 hover:bg-slate-50"
							title="View"
							aria-label={`View ${row.original.id}`}
						>
							<Eye size={16} />
						</button>
						<button
							type="button"
							className="inline-flex items-center justify-center rounded-md border border-teal-200 p-1.5 text-teal-700 hover:bg-teal-50"
							title="Edit"
							aria-label={`Edit ${row.original.id}`}
						>
							<Pencil size={16} />
						</button>
					</div>
				),
			},
		],
		[]
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
				No inmate records found.
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
				<p className="text-sm text-slate-600">
					Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
				</p>
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