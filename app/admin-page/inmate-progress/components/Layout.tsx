"use client";

import { ReactNode, useState } from "react";

import StaffHeader from "../../../components/StaffHeader";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      
      <div className="flex flex-1 flex-col">
        <StaffHeader
          role="admin"
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
          sessionUser={{
            name: "Administrator",
            email: "admin@bjmp.portal",
          }}
        />
        <main className="flex-1 px-6 py-8 md:px-10">{children}</main>
      </div>
    </div>
  );
}