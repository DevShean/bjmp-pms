"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import StaffHeader from "../../components/StaffHeader";
import StaffSidebar from "../../components/StaffSidebar";

type AdminSidebarLayoutProps = {
  children: ReactNode;
};

export default function AdminSidebarLayout({ children }: AdminSidebarLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      <StaffSidebar
        role="admin"
        isCollapsed={isSidebarCollapsed}
        sessionUser={{
          name: "Administrator",
          email: "admin@bjmp.portal",
        }}
      />

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