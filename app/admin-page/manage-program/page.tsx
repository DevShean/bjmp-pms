"use client";

import AdminSidebarLayout from "../components/AdminSidebarLayout";
import { BookOpen, Plus, BookCheck, BookMarked, LibraryBig } from "lucide-react";
import IconButton from "@/components/ui/IconButton";
import ProgramDataTable, { ProgramRecord } from "../components/ProgramDataTable";
import AddProgramModal, { AddProgramFormData } from "../components/AddProgramModal";
import EditProgramModal from "../components/EditProgramModal";
import DeleteProgramModal from "../components/DeleteProgramModal";
import AssignProgramModal from "../components/AssignProgramModal";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ManageProgramPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-slate-500 font-lexend">Loading Programs...</div>}>
            <ManageProgramPageContent />
        </Suspense>
    );
}

function ManageProgramPageContent() {
    const searchParams = useSearchParams();
    const initialSearch = searchParams.get("search") || searchParams.get("id") || "";

	const [programs, setPrograms] = useState<ProgramRecord[]>([]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
	const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
	const [selectedProgramName, setSelectedProgramName] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	interface SupabaseProgram {
		program_id: number;
		program_name: string;
		program_type: string;
		start_date: string;
		end_date: string;
		capacity: number;
		status: string;
		inmate_programs?: { count: number }[];
	}

	const fetchPrograms = useCallback(async () => {
		try {
			setIsLoading(true);
			await new Promise((resolve) => setTimeout(resolve, 3000));
			const { data, error } = await supabase
				.from("programs")
				.select("*, inmate_programs(count)")
				.order("program_id", { ascending: false });

			if (error) throw error;

			if (data) {
				const formatted: ProgramRecord[] = (data as unknown as SupabaseProgram[]).map((p) => ({
					id: p.program_id.toString(),
					name: p.program_name,
					type: p.program_type,
					startDate: p.start_date,
					endDate: p.end_date,
					enrolled: p.inmate_programs?.[0]?.count || 0,
					capacity: p.capacity,
					status: p.status as "Active" | "Completed" | "Upcoming" | "Inactive" | "Cancelled"
				}));
				setPrograms(formatted);
			}
		} catch (error) {
			console.error("Error fetching programs:", error);
			toast.error("Failed to fetch programs.");
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchPrograms();
	}, [fetchPrograms]);
	const handleAddProgram = async (formData: AddProgramFormData) => {
		try {
			const { error } = await supabase
				.from("programs")
				.insert([{
					program_name: formData.program_name,
					program_type: formData.program_type, // Now aligned with enum
					description: formData.description,
					start_date: formData.start_date,
					end_date: formData.end_date,
					duration_weeks: parseInt(formData.duration),
					capacity: parseInt(formData.capacity),
					location: formData.location,
					assigned_staff_id: formData.assigned_staff ? parseInt(formData.assigned_staff) : null,
					requirements: formData.requirements,
					status: "Active"
				}]);

			if (error) throw error;

			toast.success("Program added successfully!");
			fetchPrograms();
		} catch (error) {
			console.error("Error adding program:", error);
			toast.error("Failed to add program.");
		}
	};

	return (
		<AdminSidebarLayout>
			<div className="w-full min-w-0 flex flex-col gap-6">
				<section className="space-y-6">
					<div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
						<div>
							<h1 className="font-lexend text-2xl font-semibold text-slate-800 flex items-center gap-3 sm:text-3xl">
								Programs Management
								<BookOpen size={32} className="text-teal-600 shrink-0" />
							</h1>
							<p className="mt-1 text-sm text-slate-600">Create, manage, and assign rehabilitation programs</p>
						</div>
						<IconButton
							onClick={() => setIsModalOpen(true)}
							icon={<Plus size={18} />} 
							colorClass="bg-teal-700 hover:bg-teal-800 text-white mt-4 md:mt-0"
						>
							Add New Program
						</IconButton>
					</div>

					{/* ── Status Cards ── */}
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						{isLoading ? (
							Array.from({ length: 4 }).map((_, i) => (
								<div key={i} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
									<Skeleton className="h-12 w-12 rounded-xl shrink-0" />
									<div className="space-y-2">
										<Skeleton className="h-4 w-24 rounded-md" />
										<Skeleton className="h-8 w-12 rounded-md" />
									</div>
								</div>
							))
						) : (
							<>
								<ProgramStatCard
									title="Total Programs"
									value={programs.length}
									icon={<LibraryBig className="size-6 text-teal-500" />}
									tone="text-teal-700"
								/>
								<ProgramStatCard
									title="Active Programs"
									value={programs.filter((p) => p.status === "Active").length}
									icon={<BookOpen className="size-6 text-emerald-500" />}
									tone="text-emerald-700"
								/>
								<ProgramStatCard
									title="Completed"
									value={programs.filter((p) => p.status === "Completed").length}
									icon={<BookCheck className="size-6 text-blue-500" />}
									tone="text-blue-700"
								/>
								<ProgramStatCard
									title="Upcoming"
									value={programs.filter((p) => p.status === "Upcoming").length}
									icon={<BookMarked className="size-6 text-amber-500" />}
									tone="text-amber-600"
								/>
							</>
						)}
					</div>

					<div className="mt-2 text-slate-800">
						{isLoading ? (
							<div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
								{/* Header row */}
								<div className="border-b border-slate-200 bg-slate-50 px-5 py-3 grid grid-cols-7 gap-4">
									{Array.from({ length: 7 }).map((_, i) => (
										<Skeleton key={i} className="h-4 rounded-md" />
									))}
								</div>
								{/* Rows */}
								<div className="divide-y divide-slate-100">
									{Array.from({ length: 6 }).map((_, i) => (
										<div key={i} className="px-5 py-3 grid grid-cols-7 gap-4 items-center">
											<Skeleton className="h-4 w-28 rounded-md" />
											<Skeleton className="h-5 w-20 rounded-full" />
											<Skeleton className="h-4 w-20 rounded-md" />
											<Skeleton className="h-4 w-20 rounded-md" />
											<Skeleton className="h-2 w-full rounded-full" />
											<Skeleton className="h-5 w-16 rounded-full" />
											<div className="flex gap-2">
												<Skeleton className="h-7 w-7 rounded-md" />
												<Skeleton className="h-7 w-7 rounded-md" />
												<Skeleton className="h-7 w-7 rounded-md" />
											</div>
										</div>
									))}
								</div>
							</div>
						) : (
							<ProgramDataTable 
							data={programs} 
							initialSearch={initialSearch}
							onEdit={(p: ProgramRecord) => {
								setSelectedProgramId(p.id);
								setIsEditModalOpen(true);
							}}
							onDelete={(p: ProgramRecord) => {
								setSelectedProgramId(p.id);
								setSelectedProgramName(p.name);
								setIsDeleteModalOpen(true);
							}}
							onAssign={(p: ProgramRecord) => {
								setSelectedProgramId(p.id);
								setSelectedProgramName(p.name);
								setIsAssignModalOpen(true);
							}}
						/>
						)}
					</div>
				</section>
			</div>

			<AddProgramModal 
				isOpen={isModalOpen} 
				onClose={() => setIsModalOpen(false)} 
				onSubmit={handleAddProgram} 
			/>

			<EditProgramModal
				isOpen={isEditModalOpen}
				onClose={() => {
					setIsEditModalOpen(false);
					setSelectedProgramId(null);
				}}
				onSubmit={fetchPrograms}
				programId={selectedProgramId}
			/>

			<DeleteProgramModal
				isOpen={isDeleteModalOpen}
				onClose={() => {
					setIsDeleteModalOpen(false);
					setSelectedProgramId(null);
					setSelectedProgramName(null);
				}}
				onSubmit={fetchPrograms}
				programId={selectedProgramId}
				programName={selectedProgramName}
			/>

			<AssignProgramModal 
				isOpen={isAssignModalOpen}
				onClose={() => {
					setIsAssignModalOpen(false);
					setSelectedProgramId(null);
					setSelectedProgramName(null);
				}}
				onSubmit={fetchPrograms}
				programId={selectedProgramId}
				programName={selectedProgramName}
			/>
		</AdminSidebarLayout>
	);
}

function ProgramStatCard({ title, value, icon, tone }: { title: string; value: number; icon: React.ReactNode; tone: string }) {
	return (
		<article className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
			<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">{icon}</div>
			<div>
				<p className="text-sm text-slate-500">{title}</p>
				<p className={`mt-1 text-3xl font-semibold ${tone}`}>{value}</p>
			</div>
		</article>
	);
}
