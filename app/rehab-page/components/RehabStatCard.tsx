"use client";

import type { LucideIcon } from "lucide-react";

interface RehabStatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  valueColor?: string;
}

export default function RehabStatCard({
  title,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  valueColor = "text-[#2952b3]",
}: RehabStatCardProps) {
  return (
    <article className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
      <div className="space-y-1.5 text-left">
        <p className="text-sm font-medium text-slate-500 leading-tight">{title}</p>
        <p className={`text-3xl font-bold tracking-tight ${valueColor}`}>{value}</p>
      </div>
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg} bg-opacity-15`}>
        <Icon className={`h-6 w-6 ${iconColor}`} />
      </div>
    </article>
  );
}
