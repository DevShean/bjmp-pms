"use client";

import { LayoutGrid, CheckCircle2, AlertTriangle } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

function BehaviorStatCard({ title, value, icon, iconBg, iconColor }: StatCardProps) {
  return (
    <article className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </article>
  );
}

export default function BehaviorStatsCards({
  stats = { total: 1, excellent: 1, good: 0, fair: 0, poor: 0 },
}: {
  stats?: { total: number; excellent: number; good: number; fair: number; poor: number };
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <BehaviorStatCard
        title="Total Logs"
        value={stats.total}
        icon={<LayoutGrid size={24} />}
        iconBg="bg-blue-50"
        iconColor="text-blue-600"
      />
      <BehaviorStatCard
        title="Excellent"
        value={stats.excellent}
        icon={<CheckCircle2 size={24} />}
        iconBg="bg-green-50"
        iconColor="text-green-600"
      />
      <BehaviorStatCard
        title="Good"
        value={stats.good}
        icon={<CheckCircle2 size={24} />}
        iconBg="bg-blue-50"
        iconColor="text-blue-600"
      />
      <BehaviorStatCard
        title="Fair"
        value={stats.fair}
        icon={<AlertTriangle size={24} />}
        iconBg="bg-orange-50"
        iconColor="text-orange-600"
      />
      <BehaviorStatCard
        title="Poor"
        value={stats.poor}
        icon={<AlertTriangle size={24} />}
        iconBg="bg-red-50"
        iconColor="text-red-600"
      />
    </div>
  );
}
