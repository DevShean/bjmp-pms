"use client";

import AdminSidebarLayout from "../components/AdminSidebarLayout";
import { BookOpen, Plus } from "lucide-react";
import IconButton from "@/components/ui/IconButton";
import ProgramDataTable, { ProgramRecord } from "../components/ProgramDataTable";
import AddProgramModal from "../components/AddProgramModal";
import { useState } from "react";

const demoPrograms: ProgramRecord[] = [];

export default function ManageProgramPage() {
	const [isModalOpen, setIsModalOpen] = useState(false);

	return (
		<AdminSidebarLayout>
			<section className="space-y-6">
				<div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white px-8 py-6 shadow-sm md:flex-row md:items-center md:justify-between">
					<div>
						<h1 className="font-lexend text-3xl font-semibold text-slate-800 flex items-center gap-3">
							Programs Management
							<BookOpen size={32} className="text-blue-500" />
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

				<div className="mt-2">
					<ProgramDataTable data={demoPrograms} />
				</div>
			</section>

			<AddProgramModal 
				isOpen={isModalOpen} 
				onClose={() => setIsModalOpen(false)} 
				onSubmit={(data) => {
					console.log("Submitted Program Data:", data);
				}} 
			/>
		</AdminSidebarLayout>
	);
}
