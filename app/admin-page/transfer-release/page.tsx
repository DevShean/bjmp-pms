

"use client";
import AdminSidebarLayout from "../components/AdminSidebarLayout";
import { useState, useCallback, useEffect } from "react";
import TransferReleaseDataTable from "../components/TransferReleaseDataTable";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ArrowLeftRight, FileText, Zap, User } from "lucide-react";
import { getInmateImageUrl } from "../../lib/utils/image";

type InmateCellBlock = {
	id: string;
	name: string;
	currentBlock: string;
	gender: "Male" | "Female";
	imageUrl: string;
};

// Removed static INMATES constant

export default function TransferReleasePage() {
	const [inmates, setInmates] = useState<InmateCellBlock[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [newBlocks, setNewBlocks] = useState<{ [id: string]: string }>({});

	const fetchInmates = useCallback(async () => {
		setIsLoading(true);
		try {
			const { data, error } = await supabase
				.from("inmates")
				.select("inmate_id, first_name, last_name, cell_block, photo_path, gender")
				.order("last_name", { ascending: true });

			if (error) throw error;

			const formatted: InmateCellBlock[] = (data || []).map((item) => {
				const fullName = `${item.first_name} ${item.last_name}`;
				return {
					id: String(item.inmate_id),
					name: fullName,
					currentBlock: item.cell_block || "Unassigned",
					gender: item.gender as "Male" | "Female",
					imageUrl: getInmateImageUrl(item.photo_path, fullName),
				};
			});
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
			const numericId = parseInt(id, 10);
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

	// Demo stats (can be enriched later)
	const totalTransfers = 0;
	const thisMonth = 0;
	const totalInmates = inmates.length;

	 return (
		 <AdminSidebarLayout>
			 <section className="space-y-6">
				<div>
					<h1 className="font-lexend text-2xl font-semibold text-slate-800 flex items-center gap-3 sm:text-3xl">
						Inmate Transfers & Release
						<ArrowLeftRight size={32} className="text-teal-600 shrink-0" />
					</h1>
					<p className="mt-1 text-sm text-slate-600">Manage inmate cell block transfers and release processing</p>
				</div>

				 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					 <SummaryCard title="Total Transfers" value={String(totalTransfers)} icon="document" tone="text-teal-700" />
					 <SummaryCard title="Pending Requests" value={String(thisMonth)} icon="bolt" tone="text-amber-600" />
					 <SummaryCard title="Total Inmates" value={String(totalInmates)} icon="user" tone="text-teal-700" />
				 </div>

				 <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden min-w-0">
					 <div className="px-6 py-4 border-b border-slate-200 bg-white sticky top-0 z-20">
						 <h2 className="font-lexend text-xl font-semibold text-slate-800">Transfer & Release Records</h2>
					 </div>
					 <div className="p-4">
						<TransferReleaseDataTable
							data={inmates}
							newBlocks={newBlocks}
							setNewBlocks={setNewBlocks}
							onTransfer={handleTransfer}
							isLoading={isLoading}
						/>
					 </div>
				 </div>
			 </section>
		 </AdminSidebarLayout>
	);
}

function SummaryCard({ title, value, icon, tone }: { title: string; value: string; icon: "document" | "bolt" | "user"; tone: string }) {
	const iconMap = {
		document: <FileText className="size-6 text-teal-500" />,
		bolt: <Zap className="size-6 text-amber-500" />,
		user: <User className="size-6 text-teal-500" />,
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
