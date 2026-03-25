"use client";

import AdminSidebarLayout from "../components/AdminSidebarLayout";
import { BookOpen, Plus } from "lucide-react";
import IconButton from "@/components/ui/IconButton";
import ProgramDataTable, { ProgramRecord } from "../components/ProgramDataTable";
import AddProgramModal, { AddProgramFormData } from "../components/AddProgramModal";
import EditProgramModal from "../components/EditProgramModal";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function ManageProgramPage() {
	const [programs, setPrograms] = useState<ProgramRecord[]>([]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const fetchPrograms = useCallback(async () => {
		try {
			setIsLoading(true);
			const { data, error } = await supabase
				.from("programs")
				.select("*")
				.order("program_id", { ascending: false });

			if (error) throw error;

			if (data) {
				const formatted: ProgramRecord[] = data.map((p) => ({
					id: p.program_id.toString(),
					name: p.program_name,
					type: p.program_type,
					startDate: p.start_date,
					endDate: p.end_date,
					enrolled: 0, // Enrolled count would need a join with inmate_programs
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
					<div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white px-5 py-6 shadow-sm md:flex-row md:items-center md:justify-between sm:px-8">
						<div>
							<h1 className="font-lexend text-2xl font-semibold text-slate-800 flex items-center gap-3 sm:text-3xl">
								Programs Management
								<BookOpen size={32} className="text-blue-500 shrink-0" />
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

					<div className="mt-2 text-slate-800">
						{isLoading ? (
							<div className="flex justify-center p-12">
								<p className="text-slate-500">Loading programs...</p>
							</div>
						) : (
							<ProgramDataTable 
							data={programs} 
							onEdit={(p: ProgramRecord) => {
								setSelectedProgramId(p.id);
								setIsEditModalOpen(true);
							}}
							onDelete={(p: ProgramRecord) => console.log("Delete", p)}
							onAssign={(p: ProgramRecord) => console.log("Assign", p)}
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
		</AdminSidebarLayout>
	);
}
