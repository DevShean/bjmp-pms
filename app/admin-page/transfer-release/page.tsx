

"use client";
import AdminSidebarLayout from "../components/AdminSidebarLayout";
import { useState, useCallback, useEffect, useMemo } from "react";
import TransferReleaseDataTable from "../components/TransferReleaseDataTable";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

type InmateCellBlock = {
	id: string;
	name: string;
	currentBlock: string;
};

// Removed static INMATES constant

export default function TransferReleasePage() {
	const [inmates, setInmates] = useState<InmateCellBlock[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [newBlocks, setNewBlocks] = useState<{ [id: string]: string }>({});
	const [searchTerm, setSearchTerm] = useState("");

	const fetchInmates = useCallback(async () => {
		setIsLoading(true);
		try {
			const { data, error } = await supabase
				.from("inmates")
				.select("inmate_id, first_name, last_name, cell_block")
				.order("last_name", { ascending: true });

			if (error) throw error;

			const formatted: InmateCellBlock[] = (data || []).map((item) => ({
				id: `INM-${String(item.inmate_id).padStart(3, "0")}`,
				name: `${item.first_name} ${item.last_name}`,
				currentBlock: item.cell_block || "Unassigned",
			}));
			setInmates(formatted);
		} catch (err) {
			console.error("Error fetching inmates:", err);
			toast.error("Failed to load inmate records.");
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchInmates();
	}, [fetchInmates]);

	const handleTransfer = useCallback(async (id: string, name: string, newBlock: string) => {
		try {
			const numericId = parseInt(id.replace("INM-", ""), 10);
			const { error } = await supabase
				.from("inmates")
				.update({ cell_block: newBlock })
				.eq("inmate_id", numericId);

			if (error) throw error;

			toast.success(`Transferred ${name} to block ${newBlock}`);
			
			// Clear the input for this inmate
			setNewBlocks(prev => {
				const next = { ...prev };
				delete next[id];
				return next;
			});
			
			fetchInmates();
		} catch (err) {
			console.error("Transfer error:", err);
			toast.error(`Failed to transfer ${name}.`);
		}
	}, [fetchInmates]);

	const filteredInmates = useMemo(() => {
		const keyword = searchTerm.toLowerCase();
		return inmates.filter(i => 
			i.name.toLowerCase().includes(keyword) || 
			i.id.toLowerCase().includes(keyword) ||
			i.currentBlock.toLowerCase().includes(keyword)
		);
	}, [inmates, searchTerm]);

	// Demo stats (can be enriched later)
	const totalTransfers = 0;
	const thisMonth = 0;
	const totalInmates = inmates.length;

	 return (
		 <AdminSidebarLayout>
			 <section className="space-y-6">
				 <h1 className="font-lexend text-3xl font-semibold text-slate-800">Inmate Transfers Management</h1>

				 <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					 <SummaryCard title="Total Transfers" value={String(totalTransfers)} icon="document" tone="text-purple-700" />
					 <SummaryCard title="This Month" value={String(thisMonth)} icon="bolt" tone="text-green-600" />
					 <SummaryCard title="Total Inmates" value={String(totalInmates)} icon="user" tone="text-purple-700" />
				 </div>

				 <div className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
					 <div className="px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
						 <h2 className="font-lexend text-xl font-semibold text-slate-800">Update Inmate Cell Blocks</h2>
						 <div className="relative w-full max-w-sm">
							 <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
								 <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
							 </div>
							 <input
								 type="text"
								 placeholder="Search by name, ID, or block..."
								 value={searchTerm}
								 onChange={(e) => setSearchTerm(e.target.value)}
								 className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2 pl-10 pr-3 text-sm text-slate-700 outline-none transition-all focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/20"
							 />
						 </div>
					 </div>
					 <TransferReleaseDataTable
						 data={filteredInmates}
						 newBlocks={newBlocks}
						 setNewBlocks={setNewBlocks}
						 onTransfer={handleTransfer}
						 isLoading={isLoading}
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
