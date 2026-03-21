

"use client";
import AdminSidebarLayout from "../components/AdminSidebarLayout";
import { useState } from "react";
import TransferReleaseDataTable from "../components/TransferReleaseDataTable";

type InmateCellBlock = {
	id: string;
	name: string;
	currentBlock: string;
};

const INMATES: InmateCellBlock[] = [
	{ id: "1", name: "Anthony Lopez", currentBlock: "A3" },
	{ id: "2", name: "Daniel Cortez", currentBlock: "D1" },
	{ id: "3", name: "Eric Gomez", currentBlock: "A2" },
	{ id: "4", name: "Jose Mendoza", currentBlock: "D4" },
	{ id: "5", name: "Juans Dela Cruz", currentBlock: "A1" },
	{ id: "6", name: "Leo Navarro", currentBlock: "B3" },
	{ id: "7", name: "Mark Santos", currentBlock: "B2" },
	{ id: "8", name: "Michael Tan", currentBlock: "B1" },
	{ id: "9", name: "Pedro Reyes", currentBlock: "C1" },
];

export default function TransferReleasePage() {
	const [newBlocks, setNewBlocks] = useState<{ [id: string]: string }>({});

	// Demo stats
	const totalTransfers = 0;
	const thisMonth = 0;
	const totalInmates = INMATES.length;

	 return (
		 <AdminSidebarLayout>
			 <section className="space-y-6">
				 <h1 className="font-lexend text-3xl font-semibold text-slate-800">Inmate Transfers Management</h1>

				 <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					 <SummaryCard title="Total Transfers" value={String(totalTransfers)} icon="document" tone="text-purple-700" />
					 <SummaryCard title="This Month" value={String(thisMonth)} icon="bolt" tone="text-green-600" />
					 <SummaryCard title="Total Inmates" value={String(totalInmates)} icon="user" tone="text-purple-700" />
				 </div>

				 <div className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
					 <div className="px-6 py-4 border-b border-slate-200">
						 <h2 className="font-lexend text-xl font-semibold text-slate-800">Update Inmate Cell Blocks</h2>
					 </div>
					 <TransferReleaseDataTable
						 data={INMATES}
						 newBlocks={newBlocks}
						 setNewBlocks={setNewBlocks}
						 onTransfer={(id, name, newBlock) => {
							 // TODO: Implement transfer logic
							 alert(`Transferred ${name} to block ${newBlock}`);
						 }}
					 />
				 </div>
			 </section>
		 </AdminSidebarLayout>
	);
}

function SummaryCard({ title, value, icon, tone }: { title: string; value: string; icon: "document" | "bolt" | "user"; tone: string }) {
	const iconMap = {
		document: (
			<svg className="size-7 text-purple-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="6" y="3" width="12" height="18" rx="2" /><path d="M9 7h6M9 11h6M9 15h6" /></svg>
		),
		bolt: (
			<svg className="size-7 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" /></svg>
		),
		user: (
			<svg className="size-7 text-purple-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="7" r="4" /><path d="M6 21v-2a6 6 0 0 1 12 0v2" /></svg>
		),
	};
	return (
		<article className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
			<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">{iconMap[icon]}</div>
			<div>
				<p className="text-sm text-slate-500">{title}</p>
				<p className={`mt-1 text-3xl font-semibold ${tone}`}>{value}</p>
			</div>
		</article>
	);
}
