"use client";

import { useState } from "react";
import StaffHeader from "./StaffHeader";
import StaffSidebar from "./StaffSidebar";
import { type StaffRole, staffRoleConfig } from "./staffNavigation";

type Highlight = {
  label: string;
  value: string;
  note: string;
};

type StaffDashboardShellProps = {
  role: StaffRole;
  title: string;
  description: string;
  highlights: Highlight[];
  focusAreas: string[];
};

export default function StaffDashboardShell({
  role,
  title,
  description,
  highlights,
  focusAreas,
}: StaffDashboardShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const config = staffRoleConfig[role];

  return (
    <div className="flex min-h-screen w-full bg-linear-to-br from-slate-50 via-white to-blue-50/30">
      <StaffSidebar
        role={role}
        isCollapsed={isSidebarCollapsed}
        sessionUser={{
          name: config.label,
          email: config.defaultEmail,
        }}
      />

      <div className="flex flex-1 flex-col">
        <StaffHeader
          role={role}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
          sessionUser={{
            name: config.label,
            email: config.defaultEmail,
          }}
        />

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
            <section className="overflow-hidden rounded-3xl bg-linear-to-br from-[#0a1e47] via-[#0f2f6a] to-[#1e4b8f] p-1 shadow-2xl">
              <div className="rounded-[22px] bg-white/5 p-6 text-white backdrop-blur-sm md:p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-200">
                      BJMP Internal Portal
                    </p>
                    <h1 className="font-lexend text-3xl font-semibold md:text-4xl">{title}</h1>
                    <p className="max-w-2xl text-sm leading-7 text-blue-100 md:text-base">{description}</p>
                  </div>
                  <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-blue-100 backdrop-blur-sm">
                    <p className="font-semibold text-white">Role Access</p>
                    <p className="mt-1">{config.label}</p>
                  </div>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  {highlights.map((item) => (
                    <article
                      key={item.label}
                      className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm"
                    >
                      <p className="text-sm text-blue-100">{item.label}</p>
                      <p className="mt-2 text-3xl font-bold text-white">{item.value}</p>
                      <p className="mt-3 text-xs uppercase tracking-[0.14em] text-blue-200">{item.note}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
              <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-xl shadow-slate-200/50 backdrop-blur-sm md:p-7">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-lexend text-xl font-semibold text-slate-800">Role Workspace</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Primary modules available for the {config.shortLabel.toLowerCase()} team.
                    </p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 ring-1 ring-blue-700/10">
                    Active Modules
                  </span>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {config.menuItems.map((item) => (
                    <div
                      key={item.name}
                      className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-blue-200 hover:bg-blue-50/70"
                    >
                      <p className="font-medium text-slate-800">{item.name}</p>
                      <p className="mt-2 text-sm text-slate-500">
                        {item.children ? `${item.children.length} linked actions available` : `Path: ${item.path}`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-xl shadow-slate-200/50 backdrop-blur-sm">
                <h2 className="font-lexend text-xl font-semibold text-slate-800">Priority Focus</h2>
                <div className="mt-5 space-y-3">
                  {focusAreas.map((item, index) => (
                    <div
                      key={item}
                      className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3"
                    >
                      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0f2f6a] text-xs font-semibold text-white">
                        {index + 1}
                      </span>
                      <p className="text-sm text-slate-600">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}