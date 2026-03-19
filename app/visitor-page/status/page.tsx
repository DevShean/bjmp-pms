"use client";

import { useState } from "react";
import VisitorHeader from "../../components/VisitorHeader";
import VisitorSidebar from "../../components/VisitorSidebar";

export default function VisitStatusProfilePage() {
	const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

	return (
		<div className="flex min-h-screen w-full">
			<VisitorSidebar
				sessionUser={{
					name: "Visitor Account",
					email: "visitor@bjmp.portal",
				}}
				isCollapsed={isSidebarCollapsed}
			/>
			<div className="flex flex-1 flex-col">
				<VisitorHeader
					isSidebarCollapsed={isSidebarCollapsed}
					onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
					sessionUser={{
						name: "Visitor Account",
						email: "visitor@bjmp.portal",
					}}
				/>
				<main className="flex-1 bg-gray-50">
					<div className="p-6">
						<h1 className="text-2xl font-semibold text-gray-800">Visit Status</h1>
					</div>
				</main>
			</div>
		</div>
	);
}
