"use client";

import { type ReactNode } from "react";

interface ProgramRecord {
  id: string;
  inmateName: string;
  program: string;
  startDate: string;
  status: "Ongoing" | "Completed" | "Dropped";
}

interface ProgramTableProps {
  data: ProgramRecord[];
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  Ongoing: { bg: "bg-yellow-100", text: "text-yellow-800" },
  Completed: { bg: "bg-green-100", text: "text-green-800" },
  Dropped: { bg: "bg-red-100", text: "text-red-800" },
};

export default function ProgramTable({ data }: ProgramTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-5 py-3 text-left text-sm font-semibold text-slate-700">Inmate</th>
              <th className="px-5 py-3 text-left text-sm font-semibold text-slate-700">Program</th>
              <th className="px-5 py-3 text-left text-sm font-semibold text-slate-700">Start Date</th>
              <th className="px-5 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row) => {
              const style = STATUS_STYLES[row.status] || { bg: "bg-slate-100", text: "text-slate-800" };
              return (
                <tr key={row.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-3 text-sm font-medium text-slate-900">{row.inmateName}</td>
                  <td className="px-5 py-3 text-sm text-slate-700">{row.program}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{row.startDate}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${style.bg} ${style.text}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              );
            })}
            {data.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-500">
                  No program records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}