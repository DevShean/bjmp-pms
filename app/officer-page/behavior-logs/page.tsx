"use client";

import { useEffect, useState, useCallback } from "react";
import OfficerSidebarLayout from "../components/OfficerSidebarLayout";
import { FileText, PlusCircle } from "lucide-react";
import BehaviorDistributionChart from "../components/BehaviorDistributionChart";
import BehaviorLogsTable, { BehaviorLogRecord } from "../components/BehaviorLogsTable";
import IconButton from "@/components/ui/IconButton";
import AddBehaviorLogModal, { AddBehaviorLogFormData } from "../components/AddBehaviorLogModal";
import ViewBehaviorLogModal from "../components/ViewBehaviorLogModal";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

interface BehaviorLogResponse {
	log_id: number;
	log_date: string;
	behavior_rating: "Excellent" | "Good" | "Fair" | "Poor";
	notes: string | null;
	inmates: {
		first_name: string | null;
		last_name: string | null;
		photo_path: string | null;
	} | null;
	users: {
		username: string;
	} | null;
}

export default function BehaviorLogsPage() {
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [isViewModalOpen, setIsViewModalOpen] = useState(false);
	const [selectedLog, setSelectedLog] = useState<BehaviorLogRecord | null>(null);
	const [logs, setLogs] = useState<BehaviorLogRecord[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [stats, setStats] = useState({
		total: 0,
		excellent: 0,
		good: 0,
		fair: 0,
		poor: 0,
	});

	const fetchLogs = useCallback(async () => {
		setIsLoading(true);
		try {
			const { data, error } = await supabase
				.from("behavior_logs")
				.select(`
					log_id,
					log_date,
					behavior_rating,
					notes,
					inmates (first_name, last_name, photo_path),
					users (username)
				`)
				.order("log_date", { ascending: false });

			if (error) throw error;

			const formattedLogs: BehaviorLogRecord[] = (data as unknown as BehaviorLogResponse[] || []).map((item) => ({
				id: String(item.log_id),
				inmateName: `${item.inmates?.first_name || ""} ${item.inmates?.last_name || ""}`.trim(),
				staffName: item.users?.username || "Unknown Staff",
				logDate: item.log_date,
				rating: item.behavior_rating,
				notes: item.notes || "",
				inmatePhoto: item.inmates?.photo_path || undefined,
			}));

			setLogs(formattedLogs);

			// Calculate stats
			const newStats = {
				total: formattedLogs.length,
				excellent: formattedLogs.filter((l) => l.rating === "Excellent").length,
				good: formattedLogs.filter((l) => l.rating === "Good").length,
				fair: formattedLogs.filter((l) => l.rating === "Fair").length,
				poor: formattedLogs.filter((l) => l.rating === "Poor").length,
			};
			setStats(newStats);
		} catch (err) {
			console.error("Error fetching logs:", err);
			toast.error("Failed to fetch behavior logs.");
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchLogs();
	}, [fetchLogs]);

	const handleAddLog = async (formData: AddBehaviorLogFormData) => {
		try {
			// Get current user or fallback to first correctional officer for demo
			const { data: userData } = await supabase.from("users").select("user_id").eq("role_id", 2).limit(1).single();
			const staffId = userData?.user_id || 1;

			const { error } = await supabase.from("behavior_logs").insert({
				inmate_id: parseInt(formData.inmate_id),
				staff_id: staffId,
				log_date: formData.log_date,
				behavior_rating: formData.rating,
				notes: formData.notes,
			});

			if (error) throw error;

			toast.success("Behavior log added successfully!");
			fetchLogs();
		} catch (err) {
			console.error("Error adding log:", err);
			toast.error("Failed to add behavior log.");
		}
	};

	const handleViewLog = (log: BehaviorLogRecord) => {
		setSelectedLog(log);
		setIsViewModalOpen(true);
	};

	return (
		<OfficerSidebarLayout>
			<section className="space-y-6">
				{/* Header section */}
				<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
					<div>
						<h1 className="font-lexend text-3xl font-semibold text-slate-800 flex items-center gap-3">
							Behavior Logs Management
							<FileText className="text-teal-700" size={32} />
						</h1>
						<p className="mt-1 text-sm text-slate-600">
							Monitor and track inmate behavior logs and ratings.
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-3">
						<IconButton
							onClick={() => setIsAddModalOpen(true)}
							icon={<PlusCircle size={18} className="-ml-1" />} 
							colorClass="bg-teal-700 hover:bg-teal-800 text-white"
						>
							Add New Log
						</IconButton>
					</div>
				</div>

				{/* Summary Cards */}
				<div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
					<SummaryCard title="Total Logs" value={String(stats.total)} tone="text-slate-900" />
					<SummaryCard title="Excellent" value={String(stats.excellent)} tone="text-teal-700" />
					<SummaryCard title="Good" value={String(stats.good)} tone="text-blue-700" />
					<SummaryCard title="Fair" value={String(stats.fair)} tone="text-orange-600" />
					<SummaryCard title="Poor" value={String(stats.poor)} tone="text-rose-600" />
				</div>

				{/* Side-by-side layout: Chart and Table */}
				<div className="flex flex-col lg:flex-row gap-5">
					{/* Distribution section on the left */}
					<div className="lg:max-w-sm w-full lg:min-w-0">
						<BehaviorDistributionChart data={stats} />
					</div>

					{/* Table content on the right */}
					<div className="flex-1 min-w-0">
						<BehaviorLogsTable 
							data={logs} 
							isLoading={isLoading} 
							onView={handleViewLog}
						/>
					</div>
				</div>
			</section>

			<AddBehaviorLogModal 
				isOpen={isAddModalOpen} 
				onClose={() => setIsAddModalOpen(false)} 
				onSubmit={handleAddLog}
			/>

			<ViewBehaviorLogModal
				isOpen={isViewModalOpen}
				onClose={() => setIsViewModalOpen(false)}
				log={selectedLog}
			/>
		</OfficerSidebarLayout>
	);
}

type SummaryCardProps = {
	title: string;
	value: string;
	tone: string;
};

function SummaryCard({ title, value, tone }: SummaryCardProps) {
	return (
		<article className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-all hover:shadow-md">
			<p className="text-sm font-medium text-slate-500">{title}</p>
			<p className={`mt-2 text-4xl font-semibold ${tone}`}>{value}</p>
		</article>
	);
}
